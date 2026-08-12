"""
DQS URL Configuration
=====================

Mount in your project's root urls.py:

    from django.urls import path, include

    if settings.DEBUG:
        urlpatterns += [path("profiler/", include("dqs.adapters.drf.urls"))]

Endpoints exposed under /profiler/:
  GET  /profiler/manage/routes     → List all discoverable targets
  POST /profiler/execute           → Run one request, return HTTP response + SQL trace
  GET  /profiler/connection/health → Sanity check DQS configuration
"""

from django.urls import path

from dqs.adapters.drf.views import (
    ConnectionHealthView,
    ExecuteView,
    ManageRoutesView,
)

app_name = "drf"

urlpatterns = [
    path("manage/routes", ManageRoutesView.as_view(), name="manage-routes"),
    path("execute", ExecuteView.as_view(), name="execute"),
    path("connection/health", ConnectionHealthView.as_view(), name="connection-health"),
]
