"""
The Target abstraction
======================

ELI5: Anything in your Django project that runs code in response to *something*
(an HTTP request, a Celery job, a database event) is a "target." This module
defines what a target looks like in DQS's eyes.

By giving every kind of triggerable code (views, signals, tasks, consumers)
the same shape, the rest of the system — the workbench sidebar, the MCP
`list_targets` tool, the static advisor — only has to handle ONE interface.
That's why a Target just has four fields:

- `id`: a unique string like `"view:/api/v1/books/"`. The workbench uses this
  as the key when the user picks something from the sidebar.
- `kind`: one of `"view"`, `"signal"`, `"task"`, `"consumer"`, `"static_only"`.
  Tells consumers which handler to dispatch to.
- `triggerable`: can we actually fire this thing from inside DQS right now?
  WebSocket consumers are discovered but not triggerable (no execution path
  yet), so they get `triggerable=False`.
- `trigger_spec`: a free-form dict with everything needed to fire the target
  (path, methods, model, etc.). The proxy uses this to build a real request.
- `static_findings`: a list of issues the AST advisor found in the source.
  Even when `triggerable=False`, we still have something to show.
"""

from dataclasses import dataclass, field
from typing import Any, Literal

# The five kinds of targets DQS knows about. `static_only` is a fallback
# for code we found but can't trigger AND can't cleanly classify as view/
# signal/task/consumer — we still report its static findings.
TargetKind = Literal["view", "signal", "task", "consumer", "static_only"]


@dataclass
class Target:
    """A unified description of one piece of triggerable code in the project."""

    id: str
    kind: TargetKind
    triggerable: bool
    trigger_spec: dict[str, Any] | None = None
    static_findings: list[dict[str, Any]] = field(default_factory=list)
