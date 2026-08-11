"""
URL Path Parameter Resolver
============================

ELI5: Imagine every Django URL is a recipe with blanks in it:

    /books/<int:pk>/      <-- "pk" is a blank we have to fill in
    /authors/<slug:s>/    <-- "s" is a blank

Before DQS can fire a real request at that URL, it has to figure out what
values go in the blanks. That's what this module does. It looks at the
target's model (e.g. "books.Book"), checks the database for an existing
row, and pulls the right field value out of it.

If there's no row and no explicit value from the user, we DON'T make one up
anymore. We return a clear "no_record_found" reason so the workbench can
say "Pick a record or enter a value" instead of guessing.
"""

from __future__ import annotations

import inspect
import logging
import re
from typing import Any

from django.apps import apps
from django.urls import URLPattern, reverse
from django.urls.exceptions import NoReverseMatch
from django.urls.resolvers import RoutePattern

from dqs.adapters.drf.types import (
    InvalidPathParamError,
    PathParam,
    PathResolution,
    RouteMetadata,
)

logger = logging.getLogger("dqs.routing")


class PathConverterResolver:
    """
    Turns a parameterized route like `/books/<int:pk>/` into a concrete URL
    like `/books/42/` by resolving the values for every placeholder.

    The resolver does NOT seed the database. If the user didn't provide a
    value and there is no real row to pull one from, the resolution fails
    with a clear reason — the caller (workbench or MCP agent) decides what
    to do next (pick a record, ask the user, etc.).
    """

    # ------------------------------------------------------------------------
    # 1. Reading the placeholders out of a URL pattern
    # ------------------------------------------------------------------------
    @classmethod
    def extract_converters_from_pattern(cls, pattern: URLPattern) -> list[PathParam]:
        """
        Read the `<name:converter>` placeholders from a Django URLPattern.

        ELI5: We open the route definition and copy down every blank. For
        `/books/<int:pk>/` we return one PathParam: name="pk", converter="int".
        """
        params: list[PathParam] = []
        route_pattern = getattr(pattern, "pattern", None)
        if isinstance(route_pattern, RoutePattern):
            for name, converter in route_pattern.converters.items():
                # Convert "IntConverter" -> "int", "SlugConverter" -> "slug", etc.
                conv_type = type(converter).__name__.replace("Converter", "").lower() or "str"
                params.append(PathParam(name=name, converter=conv_type))
        return params

    # ------------------------------------------------------------------------
    # 2. Figuring out which DB field the placeholder refers to
    # ------------------------------------------------------------------------
    @classmethod
    def build_lookup_map(cls, view_callable: Any | None) -> dict[str, str]:
        """
        Build the mapping from "URL kwarg name" to "model field name".

        ELI5: A URL might say `<hash>` but the model field is actually called
        `sha_256`. DRF lets views declare this mapping with `lookup_field` and
        `lookup_url_kwarg`. We read those attributes so we know which field to
        pull the value from when filling the blank.

        Returns `{"pk": "pk"}` for normal views, or
        `{"article_slug": "slug"}` for a view with custom lookup config.
        """
        if not view_callable:
            return {}

        view_class = view_callable if inspect.isclass(view_callable) else getattr(view_callable, "cls", None)
        if not view_class:
            return {}

        lookup_field = getattr(view_class, "lookup_field", "pk")
        lookup_url_kwarg = getattr(view_class, "lookup_url_kwarg", None) or lookup_field
        return {lookup_url_kwarg: lookup_field}

    @classmethod
    def extract_from_model_instance(
        cls,
        instance: Any,
        param_name: str,
        lookup_map: dict[str, str] | None = None,
    ) -> Any | None:
        """
        Pull the right field value out of a model instance for one placeholder.

        ELI5: We have a real Book row and a blank labeled "pk". We look up
        what model field "pk" maps to (usually just `pk`, sometimes a
        custom field like `sha_256`) and return its value. Returns None
        if we can't find it — the caller treats that as "missing."
        """
        lookup_map = lookup_map or {}
        model_field_name = lookup_map.get(param_name, param_name)

        if model_field_name in ("pk", "id"):
            return instance.pk

        if hasattr(instance, model_field_name):
            value = getattr(instance, model_field_name)
            return value() if callable(value) else value

        return None

    # ------------------------------------------------------------------------
    # 3. The main entry point: build a concrete URL
    # ------------------------------------------------------------------------
    @classmethod
    def resolve(
        cls,
        route: RouteMetadata,
        explicit_params: dict[str, Any] | None = None,
        lookup_map: dict[str, str] | None = None,
    ) -> PathResolution:
        """
        Resolve every path parameter on a route and return a concrete URL.

        Resolution order for each missing parameter:
        1. Use an explicit value the caller provided (highest priority).
        2. Pull a real value from the first matching row in the database.
        3. Give up with a clear reason — NEVER invent data.

        ELI5: For every blank in the URL, we try in this order: "did the
        caller already tell us what to put here?", then "is there a real
        row in the database we can copy a value from?", then "we have no
        idea, please tell us what to use." That last case returns a
        PathResolution with `concrete_url=None` and `reason="no_record_found"`.
        """
        resolved: dict[str, Any] = dict(explicit_params or {})

        if not route.has_path_params:
            return PathResolution(
                concrete_url=cls._render_url(route, resolved),
                params=resolved,
            )

        missing = [p.name for p in route.path_params if p.name not in resolved]
        if not missing:
            return PathResolution(
                concrete_url=cls._render_url(route, resolved),
                params=resolved,
            )

        model_class = cls._resolve_target_model(route.target_model)
        if model_class is None:
            return PathResolution(
                concrete_url=None,
                params=resolved,
                reason=(
                    f"Route '{route.path}' has path parameter(s) "
                    f"{missing!r} but no resolvable target model "
                    f"('{route.target_model}'). Provide explicit values."
                ),
            )

        instance = cls._find_first_instance(model_class)
        if instance is None:
            return PathResolution(
                concrete_url=None,
                params=resolved,
                reason=(
                    f"Route '{route.path}' needs values for {missing!r} but "
                    f"model '{route.target_model}' has no rows in the database. "
                    f"Pick an existing record or enter a value."
                ),
            )

        effective_lookup_map = cls.build_lookup_map(getattr(route, "view_callable", None))
        if getattr(route, "lookup_map", None):
            effective_lookup_map.update(route.lookup_map)
        if lookup_map:
            effective_lookup_map.update(lookup_map)

        for p in route.path_params:
            if p.name in resolved:
                continue
            value = cls.extract_from_model_instance(instance, p.name, effective_lookup_map)
            if value is not None:
                resolved[p.name] = value
            else:
                logger.debug(
                    "Parameter '%s' could not be extracted from %s instance for route %s.",
                    p.name, model_class.__name__, route.path,
                )

        still_missing = [p.name for p in route.path_params if p.name not in resolved]
        if still_missing:
            return PathResolution(
                concrete_url=None,
                params=resolved,
                reason=(
                    f"Could not resolve path parameter(s) {still_missing!r} for "
                    f"route '{route.path}'. Provide explicit values."
                ),
            )

        return PathResolution(
            concrete_url=cls._render_url(route, resolved),
            params=resolved,
        )

    @classmethod
    def build_executable_url(
        cls,
        route: RouteMetadata,
        explicit_params: dict[str, Any] | None = None,
        lookup_map: dict[str, str] | None = None,
    ) -> PathResolution:
        """
        Convenience alias for `resolve()`. Kept so older callers that expect
        a tuple don't break — but the new code should call `resolve()` and
        use the PathResult directly.
        """
        return cls.resolve(route, explicit_params=explicit_params, lookup_map=lookup_map)

    # ------------------------------------------------------------------------
    # 4. Helpers (private)
    # ------------------------------------------------------------------------
    @classmethod
    def _resolve_target_model(cls, target_model: Any) -> type | None:
        """Turn a "app_label.ModelName" string into the actual Django Model class."""
        if not target_model or not isinstance(target_model, str) or target_model.count(".") != 1:
            return None
        try:
            app_label, model_name = target_model.split(".")
            return apps.get_model(app_label, model_name)
        except (LookupError, ValueError) as err:
            logger.warning("Could not resolve model '%s': %s", target_model, err)
            return None

    @classmethod
    def _find_first_instance(cls, model_class: type) -> Any | None:
        """Return the first row of a model, or None if the table is empty."""
        try:
            return model_class.objects.first()
        except Exception:
            logger.exception("Failed to query first instance of %s", model_class.__name__)
            return None

    @classmethod
    def _render_url(cls, route: RouteMetadata, params: dict[str, Any]) -> str:
        """
        Build the final URL string from a route template and resolved values.

        Tries Django's `reverse()` first (uses the URL name when available);
        falls back to literal placeholder substitution if reverse() can't
        resolve the URL name.
        """
        if route.view_name:
            try:
                return reverse(route.view_name, kwargs=params)
            except NoReverseMatch:
                logger.debug("reverse() failed for %s; falling back to string substitution", route.view_name)

        url = route.path
        for name, value in params.items():
            pattern = re.compile(rf"<(?:[^:]+:)?{name}>")
            url = pattern.sub(str(value), url)
        return url

    # ------------------------------------------------------------------------
    # 5. Convenience for callers that want to raise instead of branching
    # ------------------------------------------------------------------------
    @classmethod
    def resolve_or_raise(
        cls,
        route: RouteMetadata,
        explicit_params: dict[str, Any] | None = None,
        lookup_map: dict[str, str] | None = None,
    ) -> tuple[str, dict[str, Any]]:
        """
        Same as `resolve()` but raises `InvalidPathParamError` instead of
        returning a PathResolution with `concrete_url=None`. Useful when
        the caller would rather catch an exception than inspect the result.
        """
        result = cls.resolve(route, explicit_params=explicit_params, lookup_map=lookup_map)
        if result.concrete_url is None:
            raise InvalidPathParamError(result.reason or "Path parameters could not be resolved.")
        return result.concrete_url, result.params
