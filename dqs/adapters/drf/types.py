"""
Shared data shapes for the DRF adapter.

ELI5: This file is the project's "vocabulary list." Every module speaks using
the same nouns (RouteMetadata, PathParam, ProfileReport) so they can be passed
around without translating between each other. When you read other files in
this adapter and see one of these names, you can jump here to remind yourself
exactly what fields it has.

If you change a field name here, grep the codebase for the old name — these
types are serialized to JSON and shipped to the workbench UI and the MCP
server, so a rename is a breaking change for both.
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class PathParam:
    """
    One `<name:converter>` slot inside a URL like `/books/<int:pk>/`.

    Example: for `/books/<int:pk>/` the PathParam is `PathParam(name="pk", converter="int")`.
    The workbench uses `name` to label the input box and `converter` to pick the
    right input type (number vs text).
    """

    name: str
    converter: str


@dataclass
class RouteMetadata:
    """
    Everything we know about a single Django/DRF URL route.

    ELI5: Think of this as the route's business card. It tells us the path,
    what HTTP methods it accepts, what Django model it cares about, and whether
    the path has any `<...>` placeholders we need to fill in before we can
    actually call it. `executable=False` means "we found the route but we don't
    trust ourselves to call it correctly" — the workbench UI will dim it out.
    """

    path: str
    methods: list[str]
    view_name: str
    view_type: str  # "DRF_APIView" or "DRF_ViewSet"
    is_drf: bool = True
    executable: bool = True
    path_params: list[PathParam] = field(default_factory=list)
    target_model: str | None = None  # "app_label.ModelName", e.g. "books.Book"
    reason_unexecutable: str | None = None
    view_callable: Callable | None = None
    lookup_map: dict[str, str] = field(default_factory=dict)

    @property
    def has_path_params(self) -> bool:
        """True when the route contains at least one `<...>` placeholder."""
        return len(self.path_params) > 0


@dataclass
class ProfileReport:
    """
    The full answer the engine returns when the workbench (or MCP agent) calls
    `POST /dqs/api/execute/` for one target.

    ELI5: This is the receipt from one profiling run. It has two halves:
    - `http_response`: what came back from the view itself (status code, headers, body).
    - `profiling_summary`: everything we learned by watching the view run —
      every SQL query that fired, which file:line triggered each one, the
      total time, and any N+1 patterns we spotted.

    The workbench renders both halves side-by-side; the MCP agent reads the
    profiling_summary to decide what to fix next.
    """

    route: str
    status_code: int
    metrics: dict[str, Any] = field(default_factory=dict)
    queries: list[dict[str, Any]] = field(default_factory=list)
    analysis: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None
    side_effect_warnings: list[str] = field(default_factory=list)
    response_body: Any | None = None
    request_spec: dict[str, Any] | None = None


@dataclass
class PathResolution:
    """
    The answer to "can we actually build a real URL for this route?"

    ELI5: Some routes need values in their URL (like `/books/42/` — the `42`
    has to be a real book's id). This dataclass tells the workbench either
    "here's the concrete URL we built and the values we used" (when
    `concrete_url` is set), or "we couldn't build it because <reason>"
    (when `concrete_url is None` and `reason` is set). The UI uses the
    reason to show "Pick a record or enter a value" instead of silently
    failing.
    """

    concrete_url: str | None
    params: dict[str, Any]
    reason: str | None = None


class TargetNotFoundError(Exception):
    """Raised when a request asks about a target id we don't recognize."""


class InvalidPathParamError(Exception):
    """Raised when a path parameter can't be resolved and no value was provided."""
