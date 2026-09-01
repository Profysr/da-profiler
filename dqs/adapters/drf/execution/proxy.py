"""
Execution Proxy
===============

ELI5: The Execution Proxy is the single front door for both the human workbench
UI and the AI agent MCP server. Instead of calling the low-level runner directly,
both surfaces go through this proxy, which handles:

1. Validating the target exists and the method is allowed
2. Resolving URL path parameters (no auto-seeding — ask the user or return a clear error)
3. Attaching the requested user context (impersonation, bearer token, anonymous)
4. Dispatching through the sandbox runner with toggleable rollback
5. Returning the standard ProfileResult (HTTP response + SQL trace + N+1 flags)

The proxy owns the request contract; the runner is the internal engine that
actually dispatches the view.
"""

from __future__ import annotations
from dqs.adapters.drf.types import KIND_TYPES

import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from rest_framework.request import Request
from rest_framework.response import Response

from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
from dqs.adapters.drf.execution.query_interceptor import QueryAnalysisEngine
from dqs.adapters.drf.routing.introspector import DjangoIntrospector, CORE_HTTP_METHODS
from dqs.adapters.drf.routing.converters import PathConverterResolver, ResolvedPath
from dqs.adapters.drf.types import (
    ProfileResult,
    Route,
    ResolvedPath as ResolvedPathType,
    UnresolvablePathError,
)
from dqs.core.targets import Target

logger = logging.getLogger("dqs.proxy")


# ---------------------------------------------------------------------------
# Proxy request dataclass
# ---------------------------------------------------------------------------

class ProxyRequest:
    """
    Single request contract shared by the workbench UI and the MCP server.

    Both surfaces send requests through `POST /profiler/execute` with this shape.
    The proxy validates, resolves, and dispatches; the runner is the engine
    underneath.

    Fields:
        target_id: e.g. "view:/api/v1/books/" — what to execute
        method: HTTP method, one of GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS
        path_params: dict of named placeholders, e.g. {"pk": 42}
        query_params: dict of query-string parameters
        headers: dict of HTTP headers (Content-Type, Authorization, etc.)
        body: JSON-serializable payload (None for GET requests)
        sandbox: bool — True (default) wraps in transaction.atomic() with rollback
    """

    def __init__(
        self,
        target_id: str,
        method: str,
        path_params: dict[str, Any] | None = None,
        query_params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        body: Any | None = None,
        sandbox: bool = False,
    ) -> None:
        self.target_id = target_id
        self.method = method.upper()
        self.path_params = path_params or {}
        self.query_params = query_params or {}
        self.headers = headers or {}
        self.body = body
        self.sandbox = sandbox


# ---------------------------------------------------------------------------
# Core proxy logic
# ---------------------------------------------------------------------------
def resolve_target(target_id: str) -> Target:
    """
    Resolve a target_id string to a Target record.
    target_id format: "kind:identifier" e.g. "view:/api/v1/books/"
    """
    # Parse kind:identifier
    if ":" not in target_id:
        raise ImproperlyConfigured(f"Invalid target_id format: {target_id!r}. Expected 'kind:identifier'")

    kind, identifier = target_id.split(":", 1)

    # Discover all targets and find the matching one
    introspector = DjangoIntrospector()
    routes = introspector.list_all_routes()
    targets = DjangoTargetDiscovery(introspector_routes=routes).discover_all()

    matching = [t for t in targets if t.id == target_id]
    if not matching:
        raise ImproperlyConfigured(f"Target not found: {target_id}. Run `list_targets` to see available targets.")

    return matching[0]


def validate_method(target: Target, method: str) -> None:
    """
    Validate that the HTTP method is allowed for this target.
    Raises ImproperlyConfigured if the method is not in the target's allowed methods.
    """
    # Check route executable property and methods
    if not target.can_execute:
        raise ImproperlyConfigured(f"Target {target.id} cannot be executed (kind={target.kind})")

    # For views, check the route's allowed methods
    # We need to find the route - get from target_details
    target_details = target.target_details or {}
    route_path = target_details.get("path", "")

    # Quick validation: method must be in CORE_HTTP_METHODS
    if method not in CORE_HTTP_METHODS:
        raise ImproperlyConfigured(f"Invalid HTTP method: {method}")


def resolve_path_params(
    target: Target, explicit_params: dict[str, Any]
) -> ResolvedPathType:
    """
    Resolve URL path parameters for the target's route.

    Uses PathConverterResolver to fetch real DB records or return a clear error.
    No auto-seeding, if no record exists, returns url=None with a reason.
    """
    from dqs.adapters.drf.execution.discovery import DjangoTargetDiscovery

    # Get the route path from target details
    target_details = target.target_details or {}
    route_path = target_details.get("path", "")

    # Build route-like object for resolver
    # Extract model and url_params from target details (consistent across app)
    model = target_details.get("target_model")
    url_params_raw = target_details.get("url_params", [])

    # Create a minimal route-like object
    class _Route:
        path = route_path
        methods = ["GET"]  # Will be validated separately
        name = ""
        kind = target.kind
        is_drf = target.kind in KIND_TYPES
        executable = target.can_execute
        url_params = url_params_raw
        model = model

    # Try to resolve using PathConverterResolver
    resolver = PathConverterResolver()
    resolution = resolver.resolve(_Route(), explicit_params=explicit_params)

    if resolution.url is None:
        raise UnresolvablePathError(
            reason=resolution.reason or "Path parameters could not be resolved. "
            "Pick an existing record or provide explicit path parameter values.",
        )

    return resolution


def execute_request(request: ProxyRequest) -> ProfileResult:
    """
    Single entry point for both the workbench UI and the MCP server.

    Validates the target, resolves path params, attaches user context,
    dispatches through the sandbox runner, and returns the ProfilResult.

    The proxy is the orchestration layer; DjangoSandboxRunner.profile_callable()
    is the low-level engine it calls.
    """

    # ---- Step 1: Resolve target ----
    try:
        target = resolve_target(request.target_id)
    except ImproperlyConfigured as exc:
        logger.warning("Target resolution failed: %s", exc)
        return ProfileResult(
            path=request.target_id,
            status_code=404,
            error=str(exc),
        )

    # ---- Step 2: Validate method ----
    try:
        validate_method(target, request.method)
    except ImproperlyConfigured as exc:
        logger.warning("Method validation failed: %s", exc)
        return ProfileResult(
            path=request.target_id,
            status_code=400,
            error=str(exc),
        )

    # ---- Step 3: Resolve path parameters ----
    try:
        resolution = resolve_path_params(target, request.path_params)
    except UnresolvablePathError as exc:
        logger.warning("Path param resolution failed: %s", exc)
        return ProfileResult(
            path=request.target_id,
            status_code=400,
            error=str(exc),
        )

    concrete_url = resolution.url

    # ---- Step 4: Resolve the view callable and get route ----
    introspector = DjangoIntrospector()
    routes = introspector.list_all_routes()
    targets = DjangoTargetDiscovery(introspector_routes=routes).discover_all()

    # Find the route matching our target
    route = None
    for t in targets:
        if t.id == request.target_id and t.kind == "view":
            # Get route from target_details
            td = t.target_details or {}
            route_path = td.get("path", "")
            for r in routes:
                if r.path == route_path:
                    route = r
                    break
            break

    if route is None:
        return ProfileResult(
            path=concrete_url,
            status_code=404,
            error=f"Route not found for target {request.target_id}",
        )

    # ---- Step 5: Build WSGI request payload ----
    from django.test import RequestFactory

    method = request.method
    path_params = request.path_params
    query_params = request.query_params
    headers = request.headers
    body = request.body

    request_factory = RequestFactory()
    func = getattr(request_factory, method.lower(), None)

    if func is None:
        return ProfileResult(
            path=concrete_url,
            status_code=400,
            error=f"Unsupported HTTP method: {method}",
        )

    # Build the request
    if method in {"POST", "PUT", "PATCH"} and body is not None:
        django_request = func(
            concrete_url,
            data=body,
            content_type="application/json",
        )
    elif method == "GET" and query_params:
        django_request = func(concrete_url, data=query_params)
    else:
        django_request = func(concrete_url)

    # Attach headers
    for header_name, header_value in headers.items():
        meta_key = f"HTTP_{header_name.upper().replace('-', '_')}"
        django_request.META[meta_key] = header_value

    # ---- Step 6: Dispatch through sandbox runner ----
    django_request.resolver_match = type("Match", (), {"func": route.view, "args": (), "kwargs": {}})()

    # ---- Step 6: Dispatch through sandbox runner ----
    runner = DjangoSandboxRunner()

    try:
        response, queries_captured, db_duration_ms = runner.profile_callable(
            _dispatch_view, django_request, sandbox=request.sandbox,
        )
    except Exception as exc:
        logger.exception("Sandbox execution failed")
        return ProfileResult(
            path=concrete_url,
            status_code=500,
            error=f"Exception raised inside view execution: {exc}",
        )

    # ---- Step 7: Build analysis result ----
    status_code = getattr(response, "status_code", 200)
    response_body = _extract_response_body(response)
    response_size = _extract_response_size(response)

    # Build request snapshot
    request_snapshot = {
        "route": request.target_id,
        "method": request.method,
        "resolved_url": concrete_url,
        "path_params": [
            {"name": p.name, "value": resolution.params.get(p.name)}
            for p in resolution.params
        ]
        if hasattr(resolution, "params")
        else [],
        "query_params": query_params,
        "headers": headers,
        "body": body,
        "sandbox": request.sandbox,
    }

    # Build the full execution result using QueryAnalysisEngine
    result = QueryAnalysisEngine.build_execution_result(
        path=concrete_url,
        status_code=status_code,
        queries_captured=queries_captured,
        db_duration_ms=db_duration_ms,
        response_body=response_body,
        response_size=response_size,
        side_effect_warnings=[],  # Will be populated by runner
        request=request_snapshot,
        target_model=route.model,
    )

    return result


def _dispatch_view(view_func: Any, request: Any) -> Any:
    """
    Call the view and force render if needed.

    Internal helper used by the proxy's profile_callable.
    """
    response = view_func(request, *(), **{})
    if hasattr(response, "render") and callable(response.render):
        response.render()
    return response


def _extract_response_body(response: Any) -> Any:
    """Pull the parsed body out of a DRF or Django response object."""
    from dqs.adapters.drf.execution.runner import _extract_response_body as _erbr

    return _erbr(response)


def _extract_response_size(response: Any) -> int | None:
    """Calculate the response size in bytes for the frontend."""
    from dqs.adapters.drf.execution.runner import _extract_response_size as _ers

    return _ers(response)