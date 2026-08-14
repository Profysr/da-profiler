"""
DQS HTTP API (Workbench-facing)
================================

ELI5: This is the front door of DQS. The workbench UI (and the MCP agent,
internally) talks to Django by hitting these URLs:

- GET  /profiler/manage/routes     — list every discoverable target
- POST /profiler/execute           — run a single request, return HTTP response + SQL trace
- GET  /profiler/connection/health — am I configured correctly?

Everything is gated on `DEBUG=True` — these endpoints return 403 if the
project is running in production. DQS is a development tool, period.

CORS is enabled automatically so the Vite dev server (running on a
different port) can hit these endpoints during development.
"""

from __future__ import annotations

import logging
from collections import Counter
from typing import Any

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from dqs.adapters.drf.execution.discovery import DjangoTargetDiscovery, serialize_target
from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
from dqs.adapters.drf.routing.introspector import DjangoIntrospector

logger = logging.getLogger("dqs")


# ---------------------------------------------------------------------------
# CORS support for the workbench dev server (different port = different origin)
# ---------------------------------------------------------------------------
_DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _add_cors_headers(response: Response, request: Any) -> Response:
    """Attach permissive CORS headers when the request is from an allowed dev origin."""
    origin = None
    if hasattr(request, "headers"):
        origin = request.headers.get("Origin")
    elif hasattr(request, "META"):
        origin = request.META.get("HTTP_ORIGIN")

    if not origin:
        return response

    allowed = getattr(settings, "DQS_ALLOWED_ORIGINS", _DEFAULT_CORS_ORIGINS)
    is_debug = getattr(settings, "DEBUG", False)

    # In non-DEBUG mode, check if origin is explicitly allowed
    if not is_debug and origin not in allowed:
        return response

    response["Access-Control-Allow-Origin"] = origin
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization, X-Requested-With"
    response["Vary"] = "Origin"
    return response


class CORSEnabledAPIView(APIView):
    """Base view that handles OPTIONS preflight, enforces DEBUG=True, and adds CORS headers."""

    authentication_classes: list = []
    permission_classes: list = []

    def dispatch(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        """Block requests immediately if DEBUG is False before running any view logic."""
        if not getattr(settings, "DEBUG", False):
            response = Response(
                {"error": "Da Profiler is disabled in production. Set DEBUG=True in local settings."},
                status=status.HTTP_403_FORBIDDEN,
            )
            return _add_cors_headers(response, request)
        return super().dispatch(request, *args, **kwargs)

    def options(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        response = Response(status=status.HTTP_200_OK)
        return _add_cors_headers(response, request)

    def finalize_response(self, request: Any, response: Response, *args: Any, **kwargs: Any) -> Response:
        response = super().finalize_response(request, response, *args, **kwargs)
        return _add_cors_headers(response, request)

# ---------------------------------------------------------------------------
# GET /profiler/manage/routes
# ---------------------------------------------------------------------------
class ManageRoutesView(CORSEnabledAPIView):
    """List every discoverable target (views, tasks, consumers) plus their static findings."""

    def get(self, request: Request) -> Response:
        try:
            routes = DjangoIntrospector().list_all_routes()
            targets = DjangoTargetDiscovery(introspector_routes=routes).discover_all()
        except ImproperlyConfigured as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:
            logger.exception("Target discovery failed")
            return Response({"error": f"Target discovery failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serialized = [serialize_target(t) for t in targets]
        counts = dict(Counter(t.kind for t in targets))
        return Response({"targets": serialized, "counts": counts, "total": len(serialized)})

# ---------------------------------------------------------------------------
# POST /profiler/execute
# ---------------------------------------------------------------------------
class ExecuteView(CORSEnabledAPIView):
    """
    Run a single request through the engine and return the ProfileResult.
    """

    def post(self, request: Request) -> Response:
        body = request.data or {}
        target_id = body.get("target_id")
        kind = body.get("kind", "view")

        if not target_id:
            return Response({"error": "'target_id' is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # if the target is a Celery task, Channels consumer, or Django signal, we don't execute it via HTTP; we just return static analysis. TODO: in the future, we might support executing tasks via Celery and signals via a test harness, but for now we only support HTTP views.
        if kind in ("task", "consumer", "signal"):
            return _static_analysis_response(target_id, kind)

        route_path = body.get("path") or target_id.replace("view:", "", 1)

        # headers_raw = body.get("headers")
        # if isinstance(headers_raw, list):
        #     headers = {}
        #     for item in headers_raw:
        #         if isinstance(item, (list, tuple)) and len(item) >= 2:
        #             headers[item[0]] = item[1]
        #         elif isinstance(item, dict):
        #             headers.update(item)
        # elif isinstance(headers_raw, dict):
        #     headers = headers_raw
        # else:
        #     headers = {}

        try:
            result = DjangoSandboxRunner().execute_request(
                url_name_or_path=route_path,
                method=body.get("method", "GET"),
                path_params=body.get("path_params") or {},
                query_params=body.get("query_params") or {},
                headers=body.get("headers"),
                body=body.get("body"),
                sandbox=bool(body.get("sandbox", True)),
            )
        except ImproperlyConfigured as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:
            logger.exception("Sandbox execution failed")
            return Response({"error": f"Sandbox execution failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(_profile_result_to_dict(result))


# ---------------------------------------------------------------------------
# GET /profiler/connection/health
# ---------------------------------------------------------------------------
class ConnectionHealthView(CORSEnabledAPIView):
    """Quick sanity check: is DQS configured? Is DEBUG on?"""

    def get(self, request: Request) -> Response:
        from dqs.adapters.drf.router import SHADOW_DB_ALIAS

        return Response({
            "status": "ok",
            "debug": getattr(settings, "DEBUG", False),
            "shadow_db_configured": SHADOW_DB_ALIAS in getattr(settings, "DATABASES", {}),
            "shadow_db_alias": SHADOW_DB_ALIAS,
        })


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _profile_result_to_dict(result: Any) -> dict[str, Any]:
    """Convert a ProfileResult dataclass into a JSON-serializable dict."""
    return result.__dict__.copy()


def _static_analysis_response(target_id: str, kind: str) -> Response:
    """Build a 'static-analysis-only' response for non-view targets."""
    try:
        routes = DjangoIntrospector().list_all_routes()
        targets = DjangoTargetDiscovery(introspector_routes=routes).discover_all()
    except Exception as exc:
        logger.exception("Target discovery failed")
        return Response({"error": f"Target discovery failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    target = next((t for t in targets if t.id == target_id and t.kind == kind), None)
    if not target:
        return Response({"error": f"Target not found: {target_id}"}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "target": serialize_target(target),
        "static_findings": target.static_findings,
        "message": f"Static analysis for {kind} (not executable via HTTP yet)",
    })
