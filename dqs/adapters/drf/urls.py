"""
DQS URL Configuration
=====================

Mount in your project's root urls.py:

    from django.urls import path, include

    if settings.DEBUG:
        urlpatterns += [path("dqs/api/", include("dqs.adapters.drf.urls"))]

Endpoints exposed:
  GET  /dqs/api/targets/  → List all discoverable targets
  POST /dqs/api/execute/  → Run one request, return HTTP response + SQL trace
  GET  /dqs/api/health/   → Sanity check DQS configuration
"""

from django.urls import path

from dqs.adapters.drf.views import (
    ExecuteView,
    HealthView,
    TargetsView,
)

app_name = "drf"

urlpatterns = [
    path("targets/", TargetsView.as_view(), name="targets"),
    path("execute/", ExecuteView.as_view(), name="execute"),
    path("health/", HealthView.as_view(), name="health"),
]
