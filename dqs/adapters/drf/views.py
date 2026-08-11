import logging
from typing import Any

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from dqs.adapters.drf.execution.discovery import DjangoTargetDiscovery, serialize_target
from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
from dqs.adapters.drf.routing.introspector import DjangoIntrospector


logger = logging.getLogger("dqs")

"""
Viewed views.py:1-284
Searched for "class ExecutionResult"
Viewed types.py:1-51
Viewed discovery.py:1-60

Here is a breakdown of the response output structures returned to the frontend by each view in [views.py](file:///c:/Users/mprof/OneDrive/Desktop/da-profiler/dqs/adapters/drf/views.py).

---

### 1. `DQSDashboardView` (`GET /dqs/`)
Lists all discoverable Django URL routes and their metadata.

```json
{
  "routes": [...],
  "count": 10
}
```

#### Fields:
* **`routes`**: Array of route objects containing serialized route metadata (`path`, `methods`, `view_name`, `view_type`, `is_drf`, `executable`, `path_params`, `target_model`, `reason_unexecutable`, `lookup_map`).
* **`count`**: Total integer count of discoverable routes found in the Django project.

---

### 2. `DQSTargetsView` (`GET /dqs/targets/`)
Lists all profiled targets across the application (HTTP views, Celery tasks, WebSocket consumers, and Django signals).

```json
{
  "targets": [...],
  "counts": {"view": 5, "task": 2, "consumer": 1, "signal": 2},
  "total": 10
}
```

#### Fields:
* **`targets`**: Array of target objects containing metadata (`id`, `kind`, `name`, `triggerable`, `trigger_spec`, `static_findings`, `path`, `methods`).
* **`counts`**: Dictionary showing the breakdown count of targets grouped by kind (`view`, `task`, `consumer`, `signal`).
* **`total`**: Total integer count of all discovered targets.

---

### 3. `DQSProfileView` (`POST /dqs/profile/`)
Executes sandbox profiling on a target and returns the performance analysis, queries, and execution metrics.

#### A. When profiling HTTP Views (Dynamic Execution Result - [`ExecutionResult`](file:///c:/Users/mprof/OneDrive/Desktop/da-profiler/dqs/adapters/drf/types.py#L32-L46)):
```json
{
  "route": "/api/books/bad/",
  "status_code": 200,
  "metrics": {...},
  "queries": [...],
  "analysis": [...],
  "error": null,
  "side_effect_warnings": [...],
  "response_body": {...},
  "seeded_records": [...],
  "request_spec": {...},
  "process_log": [...],
  "process_log_summary": "..."
}
```

* **`route`**: The endpoint path or route name that was profiled.
* **`status_code`**: HTTP status code returned by the profiled endpoint view during sandbox execution.
* **`metrics`**: Object containing overall execution metrics (`total_queries`, `db_time_ms`, `total_time_ms`, `unique_fingerprints`, `n_plus_one_detected`).
* **`queries`**: Array of captured SQL queries executed during the request, including duration and caller trace.
* **`analysis`**: Array of detected performance issues (e.g. N+1 query patterns, redundant query loops, missing indexes).
* **`error`**: Error message string if sandbox execution failed, or `null` if successful.
* **`side_effect_warnings`**: Array of warning strings for detected unintended side-effects (e.g., unexpected DB mutations during GET).
* **`response_body`**: The JSON payload returned by the target view.
* **`seeded_records`**: Array of mock records created in the shadow database during setup.
* **`request_spec`**: Object detailing the request payload and headers used for the execution.
* **`process_log`**: Step-by-step logs recorded during sandbox creation and execution.
* **`process_log_summary`**: High-level text summary of the execution process log.

#### B. When profiling Non-View Targets (Celery tasks, Consumers, Signals - Static Analysis):
```json
{
  "target": {...},
  "static_findings": [...],
  "metrics": {"total_queries": 0, "db_time_ms": 0, "total_time_ms": 0, "unique_fingerprints": 0, "n_plus_one_detected": false},
  "queries": [],
  "analysis": [...],
  "side_effect_warnings": [],
  "response_body": null,
  "status_code": 0,
  "message": "Static analysis for task (not executable via HTTP)"
}
```

* **`target`**: Serialized target dictionary containing code structure and location information.
* **`static_findings`**: Array of issues detected via static AST code inspection.
* **`metrics`**: Empty default metrics payload since non-view targets are not executed dynamically over HTTP.
* **`queries`**: Empty array for query logs.
* **`analysis`**: Duplicated static findings array formatted for compatibility with the UI.
* **`side_effect_warnings`**: Empty array of side-effect warnings.
* **`response_body`**: `null` since no HTTP response body exists for static analysis targets.
* **`status_code`**: Default `0` status code for non-HTTP targets.
* **`message`**: Status message explaining that static analysis was performed instead of dynamic execution.

---

### 4. `DQSHealthView` (`GET /dqs/health/`)
Health check endpoint providing status of DQS configuration and database shadow routing.

```json
{
  "status": "ok",
  "debug": true,
  "shadow_db_configured": true,
  "router_configured": true,
  "shadow_db_alias": "dqs_shadow"
}
```

#### Fields:
* **`status`**: String indicator of service health status (e.g. `"ok"`).
* **`debug`**: Boolean indicating whether Django's `DEBUG` mode is active.
* **`shadow_db_configured`**: Boolean indicating if the isolated shadow database alias is configured in Django settings.
* **`router_configured`**: Boolean indicating if the `DQSRouter` database router is registered in Django settings.
* **`shadow_db_alias`**: Name string of the shadow database alias configured in Django (`"dqs_shadow"`).
"""


# ---------------------------------------------------------------------------
# CORS Support for Dashboard Frontend
# ---------------------------------------------------------------------------
def add_cors_headers(response: Response, request: Request) -> Response:
    """Add CORS headers to allow dashboard frontend access."""
    origin = request.headers.get("Origin")
    allowed_origins = getattr(settings, "DQS_ALLOWED_ORIGINS", [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])
    
    # Allow any origin in DEBUG mode for development convenience
    if getattr(settings, "DEBUG", False):
        if origin:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
            response["Vary"] = "Origin"
    elif origin in allowed_origins:
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
        response["Vary"] = "Origin"
    
    return response


class CORSEnabledAPIView(APIView):
    """Base API view with CORS support for dashboard."""
    
    def options(self, request: Request, *args, **kwargs) -> Response:
        """Handle preflight OPTIONS requests."""
        response = Response()
        return add_cors_headers(response, request)
    
    def initial(self, request: Request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        # Add CORS headers to all responses
        if hasattr(self, '_cors_response'):
            return
        self._cors_response = True
        
    def finalize_response(self, request: Request, response: Response, *args, **kwargs) -> Response:
        response = super().finalize_response(request, response, *args, **kwargs)
        return add_cors_headers(response, request)


# ---------------------------------------------------------------------------
# Helpers & Security Guardrails
# ---------------------------------------------------------------------------
def require_debug(view_func):
    """
    Decorator that short-circuits with HTTP 403 when DEBUG=False.
    Returns JSON response.
    """
    def _wrapper(self, request, *args, **kwargs):
        if not getattr(settings, "DEBUG", False):
            msg = (
                "Da Profiler is disabled in production. "
                "Set DEBUG=True in local settings."
            )
            return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)
        return view_func(self, request, *args, **kwargs)
    return _wrapper


class DQSJSONEncoder(DjangoJSONEncoder):
    """
    Extends Django's native encoder to safely serialize byte streams,
    ORM instances, and fallback object representations.
    """
    def default(self, obj: Any) -> Any:
        if isinstance(obj, bytes):
            try:
                return obj.decode("utf-8")
            except UnicodeDecodeError:
                return repr(obj)
        if hasattr(obj, "_meta") or hasattr(obj, "__dict__"):
            return str(obj)
        try:
            return super().default(obj)
        except TypeError:
            return repr(obj)


def _serialize_route(route) -> dict[str, Any]:
    """Serialize RouteMetadata to dict."""
    data = route.__dict__.copy()
    # Convert path_params to serializable format
    if "path_params" in data:
        data["path_params"] = [
            {"name": p.name, "converter": p.converter} for p in data["path_params"]
        ]
    # Remove non-serializable fields
    data.pop("view_callable", None)
    return data


# ---------------------------------------------------------------------------
# API Views
# ---------------------------------------------------------------------------
class DQSDashboardView(CORSEnabledAPIView):
    """API endpoint to list all discoverable routes (GET /dqs/)."""
    authentication_classes = []
    permission_classes = []

    @require_debug
    def get(self, request: Request) -> Response:
        try:
            introspector = DjangoIntrospector()
            routes = introspector.list_all_routes()
        except ImproperlyConfigured as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        routes_data = [_serialize_route(r) for r in routes]

        return Response({
            "routes": routes_data,
            "count": len(routes_data),
        })


class DQSTargetsView(CORSEnabledAPIView):
    """API endpoint to list all discoverable targets including views, tasks, consumers, signals (GET /dqs/targets/)."""
    authentication_classes = []
    permission_classes = []

    @require_debug
    def get(self, request: Request) -> Response:
        try:
            introspector = DjangoIntrospector()
            routes = introspector.list_all_routes()
            discovery = DjangoTargetDiscovery(introspector_routes=routes)
            targets = discovery.discover_all()
        except ImproperlyConfigured as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:
            logger.exception("Target discovery failed")
            return Response({"error": f"Target discovery failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        targets_data = [serialize_target(t) for t in targets]
        
        # Count by kind
        from collections import Counter
        counts = Counter(t.kind for t in targets)

        return Response({
            "targets": targets_data,
            "counts": dict(counts),
            "total": len(targets_data),
        })


class DQSProfileView(CORSEnabledAPIView):
    """API endpoint to profile a specific target (POST /dqs/profile/)."""
    authentication_classes = []
    permission_classes = []

    @require_debug
    def post(self, request: Request) -> Response:
        # DRF parses JSON automatically
        body = request.data

        target_id = body.get("target_id")
        kind = body.get("kind", "view")
        
        if not target_id:
            return Response({"error": "'target_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        # For non-view kinds, return static analysis only (not triggerable)
        if kind in ("task", "consumer", "signal"):
            return self._get_static_analysis(target_id, kind)

        # Existing view profiling logic
        route = body.get("route") or target_id.replace("view:", "", 1)
        if not route:
            return Response({"error": "'route' is required for view kind."}, status=status.HTTP_400_BAD_REQUEST)

        method = str(body.get("method", "GET")).upper()
        seed_count = max(0, int(body.get("seed_count") or 0))
        path_params = body.get("path_params") or {}
        target_model = body.get("target_model") or None
        relationships = body.get("relationships") or None

        try:
            runner = DjangoSandboxRunner()
            result = runner.execute_isolated(
                url_name_or_path=route,
                method=method,
                path_params=path_params,
                seed_count=seed_count,
                target_model=target_model,
                relationships=relationships,
            )
        except ImproperlyConfigured as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:  # noqa: BLE001
            return Response(
                {"error": f"Sandbox execution failed: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Serialize ExecutionResult
        result_dict = result.__dict__.copy()
        return Response(result_dict)

    def _get_static_analysis(self, target_id: str, kind: str) -> Response:
        """Return static analysis findings for non-view targets."""
        try:
            introspector = DjangoIntrospector()
            routes = introspector.list_all_routes()
            discovery = DjangoTargetDiscovery(introspector_routes=routes)
            targets = discovery.discover_all()
        except Exception as exc:
            logger.exception("Target discovery failed")
            return Response({"error": f"Target discovery failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        target = next((t for t in targets if t.id == target_id and t.kind == kind), None)
        if not target:
            return Response({"error": f"Target not found: {target_id}"}, status=status.HTTP_404_NOT_FOUND)

        # Return static findings in a format compatible with the profiler UI
        serialized = serialize_target(target)
        return Response({
            "target": serialized,
            "static_findings": target.static_findings,
            "metrics": {
                "total_queries": 0,
                "db_time_ms": 0,
                "total_time_ms": 0,
                "unique_fingerprints": 0,
                "n_plus_one_detected": False,
            },
            "queries": [],
            "analysis": target.static_findings,
            "side_effect_warnings": [],
            "response_body": None,
            "status_code": 0,
            "message": f"Static analysis for {kind} (not executable via HTTP)",
        })


class DQSHealthView(CORSEnabledAPIView):
    """Health check endpoint (GET /dqs/health/)."""
    authentication_classes = []
    permission_classes = []

    @require_debug
    def get(self, request: Request) -> Response:
        from dqs.adapters.drf.router import SHADOW_DB_ALIAS

        shadow_configured = SHADOW_DB_ALIAS in getattr(settings, "DATABASES", {})
        router_configured = "dqs.adapters.drf.router.DQSRouter" in getattr(settings, "DATABASE_ROUTERS", [])

        return Response({
            "status": "ok",
            "debug": getattr(settings, "DEBUG", False),
            "shadow_db_configured": shadow_configured,
            "router_configured": router_configured,
            "shadow_db_alias": SHADOW_DB_ALIAS,
        })