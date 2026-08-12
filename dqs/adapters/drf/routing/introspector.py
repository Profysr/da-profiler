"""
Django URL Introspector
=======================

ELI5: This is the "tour guide" for your Django project. When asked, it walks
through every URL your project knows about and writes down what each one
needs:

- the URL path itself (e.g. `/api/v1/books/<int:pk>/`),
- which HTTP methods it accepts,
- whether it's a regular DRF view or a ViewSet (which has slightly different
  behavior),
- whether we can safely call it ourselves (some routes are too dynamic and
  we'd rather show them in the UI but refuse to fire them),
- what database model it cares about (so the workbench can pre-fill path
  params with real values).

It does all this by reading Django's URL resolver tree (`urlpatterns`) —
never by hitting the database and never by executing any view code.

When the project is in production (`DEBUG=False`) it refuses to run, because
introspecting routes in production is a leak we don't want to allow.
"""

from __future__ import annotations

import inspect
import logging
import re
from typing import Any, Optional

from django.apps import apps
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models
from django.urls import URLPattern, URLResolver, get_resolver
from django.urls.resolvers import RegexPattern, RoutePattern

from dqs.adapters.drf.routing.converters import PathConverterResolver
from dqs.adapters.drf.types import Route

try:
    from rest_framework.views import APIView
except ImportError:  # pragma: no cover - DRF is a hard dep but be defensive
    APIView = None

logger = logging.getLogger(__name__)

# The HTTP methods we care about. Anything else (TRACE, CONNECT, etc.) is
# ignored — DRF views won't expose them.
CORE_HTTP_METHODS: set[str] = {"GET", "POST", "PUT", "PATCH", "DELETE"}
VALID_HTTP_METHODS: set[str] = CORE_HTTP_METHODS | {"HEAD", "OPTIONS"}


class DjangoIntrospector:
    """
    Walks Django's URL resolver tree and produces a Route object for every
    DRF-backed URL it finds.
    """

    def __init__(self) -> None:
        if not getattr(settings, "DEBUG", False):
            raise ImproperlyConfigured(
                "DjangoIntrospector can only run when DEBUG=True. "
                "Route introspection in production would leak your URL structure."
            )
        self.resolver = get_resolver()

    # ------------------------------------------------------------------------
    # 1. The main entry point
    # ------------------------------------------------------------------------
    def list_all_routes(self) -> list[Route]:
        """
        Recursively scan the entire URL tree and return one Route per
        discovered DRF route.

        ELI5: Start at the root of your project's URLs, then walk every
        `include()` and every leaf route. Skip any URL that starts with
        `/profiler/` (those are OUR endpoints; we don't profile ourselves).
        """
        routes: list[Route] = []
        self._walk(self.resolver.url_patterns, prefix="/", routes=routes)
        return routes

    # ------------------------------------------------------------------------
    # 2. The recursive walker
    # ------------------------------------------------------------------------
    def _walk(self, patterns: list[Any], prefix: str, routes: list[Route]) -> None:
        """
        Recursively visit URL patterns, diving into URLResolver groups and
        emitting a Route for each URLPattern leaf.

        ELI5: Imagine a folder tree where some folders contain more folders
        (`include()` calls) and some contain files (the actual routes). We
        walk every folder, open every file we find, and write down what
        each file does.
        """
        for pattern in patterns:
            full_path = self._clean_path(pattern, prefix)

            if isinstance(pattern, URLResolver):
                self._walk(pattern.url_patterns, full_path, routes)
                continue

            if isinstance(pattern, URLPattern):
                # Skip our own profiler endpoints — profiling them would be recursive nonsense.
                if full_path.startswith("/profiler/"):
                    continue
                route = self._analyze_view(pattern, full_path)
                if route is not None:
                    routes.append(route)

    # ------------------------------------------------------------------------
    # 3. Path normalization (handles both Django's new path() syntax and old regex urls)
    # ------------------------------------------------------------------------
    @staticmethod
    def _clean_path(pattern: Any, prefix: str) -> str:
        """
        Convert a Django pattern object into a clean human-readable path.

        ELI5: Django stores URLs as either nice `path("books/<int:pk>/")`
        strings or as scary regex patterns from the old `re_path()` style.
        We translate both into the friendly form so the workbench can show
        them nicely.
        """
        pattern_obj = getattr(pattern, "pattern", None)

        if isinstance(pattern_obj, RoutePattern): # A RoutePattern object holding the prefix (e.g., RoutePattern('api/v1/auth/')) 
            route = str(pattern_obj)
        elif isinstance(pattern_obj, RegexPattern):
            raw_regex = str(pattern_obj)
            # (?P<id>\d+)  ->  <id>
            route = re.sub(r"\(\?P<(\w+)>.*?\)", r"<\1>", raw_regex)
            # Drop non-capturing groups and anchors, normalize trailing slash markers.
            route = re.sub(r"\(\?:[^)]+\)", "", route)
            route = route.lstrip("^").rstrip("$").replace("\\Z", "").replace("\\.", ".").replace("/?", "/")
        else:
            route = str(pattern_obj) if pattern_obj else ""

        combined = f"{prefix}/{route}".replace("//", "/")
        return "/" + combined.lstrip("/")

    # ------------------------------------------------------------------------
    # 4. Find the model behind a view (so we can resolve path params later)
    # ------------------------------------------------------------------------
    # @staticmethod
    # def extract_model_from_view(view_class: type, pattern: Optional[URLPattern] = None) -> Optional[str]:
    #     """
    #     Try five different ways to figure out which Django Model a view is
    #     about, returning it as "app_label.ModelName".

    #     ELI5: Different DRF views advertise their model in different places
    #     — sometimes as a class attribute, sometimes via a method, sometimes
    #     not at all. We try the easy ones first, then fall back to clever
    #     tricks, and finally give up and return None (which is fine — the
    #     path resolver just won't be able to auto-fill values for it).
    #     """
    #     if not isinstance(view_class, type):
    #         return None

    #     def as_label(model_cls: Any) -> Optional[str]:
    #         if isinstance(model_cls, type) and issubclass(model_cls, models.Model) and hasattr(model_cls, "_meta"):
    #             return f"{model_cls._meta.app_label}.{model_cls._meta.object_name}"
    #         return None

    #     # Strategy 1: explicit class attributes (the common case).
    #     try:
    #         queryset = getattr(view_class, "queryset", None)
    #         if queryset is not None and hasattr(queryset, "model"):
    #             label = as_label(queryset.model)
    #             if label:
    #                 return label
    #         label = as_label(getattr(view_class, "model", None))
    #         if label:
    #             return label
    #     except Exception as exc:
    #         logger.debug("Strategy 1 (class attrs) failed for %s: %s", view_class, exc)

    #     # Strategy 2: read it from the serializer's Meta.model.
    #     try:
    #         serializer_cls = getattr(view_class, "serializer_class", None)
    #         if not serializer_cls and hasattr(view_class, "get_serializer_class"):
    #             try:
    #                 serializer_cls = view_class.get_serializer_class(None)
    #             except Exception:
    #                 pass
    #         if serializer_cls and hasattr(serializer_cls, "Meta"):
    #             label = as_label(getattr(serializer_cls.Meta, "model", None))
    #             if label:
    #                 return label
    #     except Exception as exc:
    #         logger.debug("Strategy 2 (serializer Meta) failed for %s: %s", view_class, exc)

    #     # Strategy 3: actually run get_queryset() in a safe mock context.
    #     if hasattr(view_class, "get_queryset"):
    #         try:
    #             from rest_framework.test import APIRequestFactory

    #             view_instance = view_class()
    #             view_instance.request = APIRequestFactory().get("/")
    #             view_instance.format_kwarg = None

    #             # Pretend we have every path param so the queryset can resolve.
    #             extracted_kwargs: dict[str, Any] = {}
    #             if pattern:
    #                 pattern_obj = getattr(pattern, "pattern", None)
    #                 if pattern_obj and hasattr(pattern_obj, "converters"):
    #                     extracted_kwargs = {name: 1 for name in pattern_obj.converters.keys()}
    #             view_instance.args = ()
    #             view_instance.kwargs = extracted_kwargs

    #             qs = view_instance.get_queryset()
    #             label = as_label(getattr(qs, "model", None))
    #             if label:
    #                 return label
    #         except Exception as exc:
    #             logger.debug("Strategy 3 (get_queryset) failed for %s: %s", view_class, exc)

    #     # Strategy 4: read the return-type annotation of get_queryset.
    #     if hasattr(view_class, "get_queryset"):
    #         try:
    #             sig = inspect.signature(view_class.get_queryset)
    #             return_type = sig.return_annotation
    #             if return_type is not inspect.Signature.empty:
    #                 label = as_label(getattr(return_type, "model", None))
    #                 if label:
    #                     return label
    #                 for arg in getattr(return_type, "__args__", []) or []:
    #                     label = as_label(arg)
    #                     if label:
    #                         return label
    #         except Exception as exc:
    #             logger.debug("Strategy 4 (return annotation) failed for %s: %s", view_class, exc)

    #     # Strategy 5: heuristic — does any model name appear in the URL pattern?
    #     if pattern:
    #         try:
    #             pattern_name = getattr(pattern, "name", "") or ""
    #             pattern_str = str(getattr(pattern, "pattern", ""))
    #             for registered_model in apps.get_models():
    #                 model_name = registered_model._meta.model_name
    #                 if pattern_name and model_name in pattern_name.lower().replace("_", "-").split("-"):
    #                     return as_label(registered_model)
    #                 if f"{model_name}_id" in pattern_str or f"{model_name}_pk" in pattern_str:
    #                     return as_label(registered_model)
    #         except Exception as exc:
    #             logger.debug("Strategy 5 (heuristic) failed for %s: %s", view_class, exc)

    #     return None

    # ------------------------------------------------------------------------
    # 5. Analyze a single URL pattern into a Route
    # ------------------------------------------------------------------------
    def _analyze_view(self, pattern: URLPattern, full_path: str) -> Route | None:
        """
        Pull everything we know about one route into a Route object.

        ELI5: We open one URLPattern file from the tree, figure out which
        Python class backs it, ask the path-param resolver what blanks it
        has, and ask the model detector what model it cares about. If we
        can't tell what HTTP methods it handles, we mark it as
        `executable=False` instead of guessing.
        """
        callback = pattern.callback
        if not callable(callback):
            return None

        unwrapped_callback = inspect.unwrap(callback)
        view_class: type | None = (
            getattr(callback, "view_class", None)
            or getattr(callback, "cls", None)
            or getattr(unwrapped_callback, "view_class", None)
            or getattr(unwrapped_callback, "cls", None)
        )

        if view_class is None or APIView is None or not issubclass(view_class, APIView):
            return None

        # model = self.extract_model_from_view(view_class, pattern)
        url_params = PathConverterResolver.extract_params_from_pattern(pattern)
        url_kwarg_to_field = PathConverterResolver.build_lookup_map(view_class)

        # ViewSets advertise their methods via the .actions dict; regular
        # APIViews inherit from APIView and have http_method_names.
        if hasattr(callback, "actions"):
            actions = getattr(callback, "actions", {})
            methods = [m.upper() for m in actions if m.upper() in VALID_HTTP_METHODS]
            executable = bool(methods)
            skip_reason = None if executable else "Could not resolve ViewSet actions mapping."
            kind = "viewset"
        else:
            raw_methods = [
                m.upper()
                for m in getattr(view_class, "http_method_names", [])
                if hasattr(view_class, m) and m.upper() in VALID_HTTP_METHODS
            ]
            # Skip views that only expose HEAD/OPTIONS — they don't have real handlers.
            has_core_handlers = any(m in CORE_HTTP_METHODS for m in raw_methods)
            methods = raw_methods if has_core_handlers else []
            executable = bool(methods)
            skip_reason = None if executable else "No core HTTP method handlers (GET, POST, etc.) defined on view class."
            kind = "api_view"

        return Route(
            path=full_path,
            methods=methods if executable else [],
            name=pattern.name or view_class.__name__,
            kind=kind,
            is_drf=True,
            executable=executable,
            url_params=url_params,
            model=None,  # model,  # TODO: re-enable model detection once it's more reliable
            skip_reason=skip_reason,
            view=view_class,
            url_kwarg_to_field=url_kwarg_to_field,
        )
