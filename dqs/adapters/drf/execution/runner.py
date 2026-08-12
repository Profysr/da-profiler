"""
Sandbox Runner
==============

ELI5: Imagine you're a chef who wants to test a new recipe (the Django view),
but you DON'T want to mess up the kitchen (your real database). The
SandboxRunner is your test kitchen:

1. It copies just enough of the kitchen to run the recipe in.
2. It puts a tiny CCTV camera on every cabinet the recipe touches (the
   QueryInterceptor) so we can see exactly which jars and pans got opened.
3. After the recipe is done, it throws away the test kitchen's contents
   (the transaction rollback), so the real kitchen is untouched.

You give the runner:
- the route's URL,
- an HTTP method (GET/POST/etc.),
- the headers and request body the caller wants to send,
- which user should appear to be making the call,
- whether to keep or discard the side effects (the `sandbox` toggle).

You get back:
- the HTTP response the view produced (status code, body),
- every SQL query that fired while the view ran, with file:line origins,
- any N+1 patterns we spotted, with copy-pasteable `.select_related()` fixes.

The runner never invents data — if the view needs an object that isn't in the
database, it asks you to provide one (via the path-param resolver). It never
seeds fake records on your behalf. What you see in the report is exactly what
ran during the request.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from typing import Any

from django.db import transaction
from django.urls import resolve
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory

from dqs.adapters.drf.database.db_manager import ShadowDatabaseManager
from dqs.adapters.drf.routing.introspector import DjangoIntrospector, CORE_HTTP_METHODS
from dqs.adapters.drf.routing.converters import PathConverterResolver
from dqs.adapters.drf.types import (
    ProfileResult,
    Route,
    UnresolvablePathError,
)
from dqs.core.static_advisor import StaticASTAdvisor
from .query_interceptor import QueryAnalysisEngine, QueryInterceptor


class DjangoSandboxRunner:
    """
    The low-level execution engine. Both the workbench UI and the MCP server
    eventually call `execute_request()` here.

    This class is intentionally thin — it just runs one request under
    observation. The orchestration (target validation, user impersonation,
    response shaping) lives in the proxy layer that wraps this class.
    """

    def __init__(self) -> None:
        # Make sure the shadow DB and router are configured before we try to run.
        ShadowDatabaseManager.ensure_initialized()
        self._request_factory = APIRequestFactory()

    # ------------------------------------------------------------------------
    # Core execution: run a callable under the CCTV camera
    # ------------------------------------------------------------------------
    def profile_callable(
        self,
        func: Callable[..., Any],
        *args: Any,
        sandbox: bool = True,
        **kwargs: Any,
    ) -> tuple[Any, list[dict[str, Any]], float]:
        """
        Run any Python callable and capture every SQL query it issues.
        """
        queries_captured: list[dict[str, Any]] = []
        result: Any = None
        db_duration_ms = 0.0

        if sandbox:
            # Default: strict rollback so the caller's real DB is untouched.
            with transaction.atomic():
                savepoint = transaction.savepoint()
                try:
                    with QueryInterceptor() as interceptor:
                        start = time.perf_counter()
                        result = func(*args, **kwargs)
                        db_duration_ms = (time.perf_counter() - start) * 1000.0
                        queries_captured = interceptor.captured_queries
                finally:
                    transaction.savepoint_rollback(savepoint)
        else:
            # Opt-out: writes persist. Caller asked us not to roll back.
            with QueryInterceptor() as interceptor:
                start = time.perf_counter()
                result = func(*args, **kwargs)
                db_duration_ms = (time.perf_counter() - start) * 1000.0
                queries_captured = interceptor.captured_queries

        return result, queries_captured, db_duration_ms

    # ------------------------------------------------------------------------
    # High-level: run one HTTP request end-to-end
    # ------------------------------------------------------------------------
    def execute_request(
        self,
        url_name_or_path: str,
        method: str = "GET",
        path_params: dict[str, Any] | None = None,
        query_params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        body: dict[str, Any] | None = None,
        user: Any | None = None,
        sandbox: bool = False,
    ) -> ProfileResult:
        """
        Execute one HTTP request against a discovered route, under observation.

        ELI5: This is the "press Execute" button on the workbench. We:
        1. Look up the route in the URL conf (or accept a path you pass).
        2. Fill in any `<...>` blanks (from your explicit values or from a
           real DB row).
        3. Build an HTTP request with your headers/body/user attached.
        4. Hand it to the view, watching every SQL query.
        5. By default, writes DO NOT roll back — data persists so you can
           run full CRUD cycles (POST → PUT → GET, for example). Set
           sandbox=True if you want strict rollback so the caller's real
           DB is untouched.
        6. Package up the response and the query trace into a ProfileResult.

        Args:
            url_name_or_path: the URL pattern (e.g. `/api/v1/books/`) or the
                URL name (e.g. `books-list`).
            method: HTTP verb. One of GET, POST, PUT, PATCH, DELETE.
            path_params: explicit values for `<...>` placeholders, e.g.
                `{"pk": 42}`. Wins over the database lookup.
            query_params: query string parameters as a dict.
            headers: HTTP headers as a dict.
            body: parsed JSON body for POST/PUT/PATCH. If you don't provide
                one and the view has a serializer, the proxy layer can call
                `suggest_payload()` to get a template you can edit.
            user: a Django User instance (or None for AnonymousUser). The
                runner doesn't authenticate it — that's the impersonation
                layer's job in v0.5; here we just attach it to request.user.
            sandbox: when True, writes roll back. Set False (default) when
                the caller wants to persist data and run full CRUD cycles
                (POST → PUT → GET, for example).

        Returns:
            A ProfileResult containing the HTTP response, every captured
            query with file:line origins, and any N+1 flags with fixes.
            When `sandbox=False` (default), any DB writes from the view
            will persist and be visible to subsequent requests.
        """
        
        method = method.upper()
        path_params = path_params or {}
        query_params = query_params or {}
        headers = headers or {}

        if method not in CORE_HTTP_METHODS:
            return ProfileResult(
                path=url_name_or_path,
                status_code=400,
                error=f"Invalid HTTP method: {method}",
            )

        route = self._lookup_route(url_name_or_path)

        # Resolve path parameters. If we can't, surface a clear error instead
        # of inventing data.
        try:
            resolution = PathConverterResolver.resolve(route, explicit_params=path_params)
        except UnresolvablePathError as exc:
            return ProfileResult(path=url_name_or_path, status_code=400, error=str(exc))

        if resolution.url is None:
            return ProfileResult(
                path=url_name_or_path,
                status_code=400,
                error=resolution.reason or "Path parameters could not be resolved.",
            )

        concrete_url = resolution.url

        # Match the resolved URL to its view callable.
        try:
            match = resolve(concrete_url)
            view_func = match.func
        except Exception as exc:
            return ProfileResult(
                path=concrete_url,
                status_code=404,
                error=f"Route resolution failed: {exc}",
            )

        # Find blocking I/O calls in the view's source code BEFORE running it
        # so we can flag risky endpoints early.
        side_effect_warnings = _detect_blocking_calls(view_func)

        # Build and dispatch the request under observation.
        request = self._build_request_payload(
            concrete_url, method, query_params, headers, body, user, match
        )

        try:
            response, queries_captured, db_duration_ms = self.profile_callable(
                _dispatch_view, view_func, request, match, sandbox=sandbox,
            )
        except Exception as exc:
            return ProfileResult(
                path=concrete_url,
                status_code=500,
                error=f"Exception raised inside view execution: {exc}",
                side_effect_warnings=side_effect_warnings,
            )

        status_code = getattr(response, "status_code", 200)
        response_body = _extract_response_body(response)
        request_snapshot = {
            "route": url_name_or_path,
            "method": method,
            "resolved_url": concrete_url,
            "path_params": [
                {"name": p.name, "value": resolution.params.get(p.name)}
                for p in route.url_params
            ],
            "query_params": query_params,
            "headers": headers,
            "body": body,
            "sandbox": sandbox,
        }

        return QueryAnalysisEngine.build_execution_result(
            path=concrete_url,
            status_code=status_code,
            queries_captured=queries_captured,
            db_duration_ms=db_duration_ms,
            response_body=response_body,
            side_effect_warnings=side_effect_warnings,
            request=request_snapshot,
            target_model=route.model,
        )

    # ------------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------------
    def _lookup_route(self, url_name_or_path: str) -> Route:
        """
        Find the Route for a given URL pattern or URL name.

        Falls back to a minimal Route if introspection can't find the
        route — this lets the runner still attempt the request, which will
        then fail at `resolve()` with a clear 404 if the URL really doesn't
        exist.
        """
        introspector = DjangoIntrospector()
        for route in introspector.list_all_routes():
            if route.path == url_name_or_path or route.name == url_name_or_path:
                return route
        return Route(
            path=url_name_or_path,
            methods=["GET"],
            name="",
            kind="api_view",
        )

    def _build_request_payload(
        self,
        concrete_url: str,
        method: str,
        query_params: dict[str, Any],
        headers: dict[str, str],
        body: dict[str, Any] | None,
        user: Any | None,
        match: Any,
    ) -> Request:
        """
        Build a DRF Request object the view can consume.

        ELI5: We assemble a fake incoming HTTP request — URL, method,
        headers, query string, body — and dress it up with the right
        user and resolver metadata so the view can't tell it's not real.
        """
        request_func = getattr(self._request_factory, method.lower(), None)
        if request_func is None:
            raise ValueError(f"Unsupported HTTP method: {method}")

        if method in {"POST", "PUT", "PATCH"} and body is not None:
            request = request_func(
                concrete_url,
                data=json.dumps(body),
                content_type="application/json",
            )
        elif method == "GET" and query_params:
            request = request_func(concrete_url, data=query_params)
        else:
            request = request_func(concrete_url)

        # Attach the caller-supplied headers.
        for header_name, header_value in headers.items():
            request[header_name] = header_value

        # Attach user (anonymous if none provided).
        from django.contrib.auth.models import AnonymousUser
        request.user = user if user is not None else AnonymousUser()
        request.resolver_match = match
        return request


# ---------------------------------------------------------------------------
# Module-level helpers (private — small enough to live outside the class)
# ---------------------------------------------------------------------------
def _detect_blocking_calls(view_func: Any) -> list[str]:
    """
    Scan a view's source for synchronous I/O calls (requests.post, smtplib, etc).

    ELI5: Before we run the view, we read its source code and look for any
    "this might freeze the request" patterns. We don't run anything — just
    peek at the code. Returns a list of human-readable warnings; empty if
    nothing concerning was found.
    """
    try:
        source = inspect.getsource(view_func)
        filename = inspect.getfile(view_func)
    except (TypeError, OSError):
        return []

    try:
        advisor = StaticASTAdvisor(source, filename=filename)
        findings = advisor.run()
    except Exception:
        return []

    return [f["message"] for f in findings if f.get("type") == "BLOCKING_EXTERNAL_CALL"]


def _dispatch_view(view_func: Any, request: Request, match: Any) -> Response:
    """
    Call the view with the right args, return its response, and render it.

    ELI5: Some views return lazy DRF Response objects — we have to force
    them to actually render (turn the Python data into JSON bytes) so the
    runner can record the status code and body.
    """
    response = view_func(request, *match.args, **match.kwargs)
    if isinstance(response, Response) and hasattr(response, "render"):
        response.render()
    return response


def _extract_response_body(response: Any) -> Any:
    """
    Pull the parsed body out of a DRF Response, falling back to bytes decoding.

    ELI5: DRF responses store their data in `.data` (a Python dict/list).
    Plain Django responses store it in `.content` (bytes). We try both.
    """
    if hasattr(response, "data"):
        return response.data
    content = getattr(response, "content", None)
    if not content:
        return None
    try:
        return json.loads(content.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None
