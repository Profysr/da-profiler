"""
Target Discovery Engine
========================

ELI5: Django code can be triggered in three different ways:

- A URL hits a **view** (the common case).
- A **signal** fires when a model is saved/deleted (e.g. `post_save`).
- A **Celery task** runs in the background.

This module walks all three sources and converts each one into the same
shape — a `Target` record — so the rest of DQS doesn't have to care which
kind of executable code it's looking at. The workbench sidebar shows one
list with views, signals, and tasks all mixed together; the MCP `list_targets`
tool returns the same list.

It also runs static analysis on each target's source code so even when we
can't trigger something (e.g. a signal with no sender model we know about),
we still have *something* to show the user — the static findings list.
"""

from __future__ import annotations

import importlib
import inspect
import logging
from typing import Any

from django.conf import settings

from dqs.adapters.drf.routing.introspector import DjangoIntrospector
from dqs.core.static_advisor import StaticASTAdvisor
from dqs.core.targets import Target

logger = logging.getLogger("dqs.discovery")


def serialize_target(target: Target) -> dict[str, Any]:
    """
    Convert a Target dataclass into a JSON-ready dict for the workbench / MCP.

    ELI5: Target objects are nice Python dataclasses but they can't be
    sent over the wire as-is. This function turns them into plain
    dictionaries with display-friendly extra fields (name)
    so the UI can show "POST /api/v1/books/" in the sidebar.
    """
    data: dict[str, Any] = {
        "id": target.id,
        "kind": target.kind,
        "can_execute": target.can_execute,
        "target_details": target.target_details,
        "static_findings": target.static_findings,
    }

    spec = target.target_details or {}

    if target.kind == "view":
        data["name"] = spec.get("path", target.id.split(":")[-1])
    elif target.kind == "task":
        data["name"] = spec.get("task_name", target.id.split(":")[-1])
    elif target.kind == "consumer":
        data["name"] = spec.get("consumer", target.id.split(":")[-1])
    elif target.kind == "signal":
        data["name"] = f"{spec.get('signal', '')}:{spec.get('receiver', '')}"

    return data


class DjangoTargetDiscovery:
    """
    Walks all three trigger sources (URL routes, Celery tasks, Channels
    consumers) and returns a unified list of `Target` records.

    Signal discovery is currently deferred — the user-facing impact is that
    signal receivers don't appear in the workbench sidebar yet, only their
    static findings (when reachable via a view's source). This will be
    re-enabled when v0.5 lands the signal trigger execution path.
    """

    def __init__(self, introspector_routes: list[Any] | None = None) -> None:
        self.introspector_routes = introspector_routes or []

    # ------------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------------
    @staticmethod
    def _static_analyze(func: Any) -> list[dict[str, Any]]:
        """
        Run the AST advisor on a callable's source. Returns [] if we can't
        read the source for any reason.
        """
        if not callable(func):
            return []
        try:
            source = inspect.getsource(func)
            filename = inspect.getfile(func)
            advisor = StaticASTAdvisor(source, filename=filename)
            return advisor.run()
        except (TypeError, OSError, Exception):
            return []

    # ------------------------------------------------------------------------
    # The main entry point
    # ------------------------------------------------------------------------
    def discover_all(self) -> list[Target]:
        """
        Discover every profileable target and return them as Target records.

        ELI5: One call returns everything — views, tasks, consumers — in
        one flat list. The workbench renders the whole list in its sidebar.
        """
        targets: list[Target] = []
        targets.extend(self._discover_views())
        targets.extend(self._discover_celery_tasks())
        targets.extend(self._discover_consumers())
        return targets

    # ------------------------------------------------------------------------
    # 1. Views (from URL introspection)
    # ------------------------------------------------------------------------
    def _discover_views(self) -> list[Target]:
        """Convert introspected URL routes into Target(kind="view") records."""
        # If we weren't given routes up front, ask the introspector now.
        routes = self.introspector_routes
        if not routes:
            routes = DjangoIntrospector().list_all_routes()

        targets: list[Target] = []
        for route in routes:
            view_callable = getattr(route, "view", None)
            
            targets.append(
                Target(
                    id=f"view:{route.path}",
                    kind="view",
                    can_execute=route.executable,
                    target_details={
                        "path": route.path,
                        "methods": route.methods,
                        "url_params": [p.__dict__ for p in route.url_params],
                        "target_model": route.model,
                    },
                    static_findings=self._static_analyze(view_callable),
                )
            )
        return targets

    # ------------------------------------------------------------------------
    # 2. Celery tasks (from the task registry)
    # ------------------------------------------------------------------------
    def _discover_celery_tasks(self) -> list[Target]:
        """
        Walk Celery's task registry and emit a Target(kind="task") for each.

        ELI5: Celery keeps a registry of every task the app has defined
        (anywhere in the codebase). We loop over it and record each one.
        Built-in Celery tasks (those whose names start with `celery.`) are
        skipped — we only care about user-defined tasks.
        """
        targets: list[Target] = []
        try:
            from celery import current_app

            for task_name, task_func in current_app.tasks.items():
                if task_name.startswith("celery."):
                    continue
                targets.append(
                    Target(
                        id=f"task:{task_name}",
                        kind="task",
                        can_execute=True,
                        target_details={"task_name": task_name},
                        static_findings=self._static_analyze(task_func),
                    )
                )
        except ImportError:
            # Celery isn't installed — that's fine, no tasks to discover.
            pass
        except Exception as exc:
            logger.debug("Celery task discovery failed: %s", exc)
        return targets

    # ------------------------------------------------------------------------
    # 3. Channels WebSocket consumers (discovery only, not executable yet)
    # ------------------------------------------------------------------------
    def _discover_consumers(self) -> list[Target]:
        """
        Find WebSocket consumer classes declared in the project's ASGI routing.

        ELI5: Django Channels lets you write WebSocket handlers. We can
        list them, but we can't actually trigger them with a request yet —
        triggering a WebSocket needs a fundamentally different mechanism
        than RequestFactory. So consumers appear in the list with
        `can_execute=False` and only their static findings show up in the
        workbench for now. Full consumer execution is genuinely v2.0+ scope.
        """
        targets: list[Target] = []
        try:
            asgi_path = getattr(settings, "ASGI_APPLICATION", None)
            if not asgi_path:
                return targets

            module_path, app_attr = asgi_path.rsplit(".", 1)
            asgi_module = importlib.import_module(module_path)
            asgi_app = getattr(asgi_module, app_attr, None)
            if asgi_app is None:
                return targets

            websocket_router = getattr(asgi_app, "application_mapping", {}).get(
                "websocket"
            )
            routes = getattr(websocket_router, "routes", [])

            for route in routes:
                callback = getattr(route, "callback", None)
                consumer_class = (
                    getattr(callback, "consumer_class", None) or callback
                )
                if consumer_class is None:
                    continue
                name = getattr(consumer_class, "__name__", "UnknownConsumer")
                targets.append(
                    Target(
                        id=f"consumer:{name}",
                        kind="consumer",
                        can_execute=False,
                        target_details={
                            "consumer": name,
                            "path": str(getattr(route, "pattern", "")),
                        },
                        static_findings=self._static_analyze(consumer_class),
                    )
                )
        except Exception as exc:
            logger.debug("Could not discover Channels consumers: %s", exc)
        return targets

    # ------------------------------------------------------------------------
    # 4. TODO Signals
    # ------------------------------------------------------------------------