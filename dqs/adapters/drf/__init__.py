"""
Django REST Framework adapter for Da Profiler.

ELI5: This package is the bridge between Da Profiler's framework-agnostic
core (`dqs.core`) and a real Django project. The core knows how to analyze
SQL and AST patterns; this adapter knows how to talk to Django — discover
URLs, run views in a sandbox, intercept queries at the DB-driver boundary,
expose the whole thing over HTTP for the workbench UI and MCP server.

Public surface (what other code is expected to import):
- `DjangoIntrospector` — walks Django's URL tree.
- `DjangoSandboxRunner` — low-level engine that runs one request under
  observation. Usually called via the `ExecuteView` HTTP endpoint.
- `PathConverterResolver` — fills in `<...>` URL placeholders from real
  DB rows or explicit values.
- `DjangoTargetDiscovery` — collects views, Celery tasks, and Channels
  consumers into one Target list.
- `Route`, `UrlParam`, `ProfileResult`, `ResolvedPath` — the shared data
  shapes (defined in `types.py`).
"""

from dqs.adapters.drf.execution.discovery import DjangoTargetDiscovery, serialize_target
from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
from dqs.adapters.drf.routing.converters import PathConverterResolver
from dqs.adapters.drf.routing.introspector import DjangoIntrospector
from dqs.adapters.drf.types import (
    ProfileResult,
    ResolvedPath,
    Route,
    TargetNotFoundError,
    UnresolvablePathError,
    UrlParam,
)

__all__ = [
    "DjangoIntrospector",
    "DjangoSandboxRunner",
    "DjangoTargetDiscovery",
    "PathConverterResolver",
    "ProfileResult",
    "ResolvedPath",
    "Route",
    "TargetNotFoundError",
    "UnresolvablePathError",
    "UrlParam",
    "serialize_target",
]
