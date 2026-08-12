"""
Shared data shapes for the DRF adapter.

ELI5: This file is the project's "vocabulary list." Every module speaks using
the same nouns (Route, ResolvedPath, ProfileResult, UrlParam) so they can be
passed around without translating between each other. When you read other
files in this adapter and see one of these names, you can jump here to remind
yourself exactly what fields it has.

If you change a field name here, grep the codebase for the old name — these
types are serialized to JSON and shipped to the workbench UI and the MCP
server, so a rename is a breaking change for both.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Literal


# ---------------------------------------------------------------------------
# Path placeholders
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class UrlParam:
    """
    One `<name:converter>` slot inside a URL like `/books/<int:pk>/`.

    Example: for `/books/<int:pk>/` the UrlParam is `UrlParam(name="pk", converter="int")`.
    The workbench uses `name` to label the input box and `converter` to pick
    the right input type (number vs text).

    Fields:
        name: the placeholder name as it appears in the URL template.
        converter: the converter type — one of `int`, `str`, `slug`, `uuid`, `path`.
    """

    name: str
    converter: str


# ---------------------------------------------------------------------------
# A discovered Django/DRF URL route
# ---------------------------------------------------------------------------
@dataclass
class Route:
    """
    Everything we know about a single Django/DRF URL route.

    ELI5: Think of this as the route's business card. It tells us the path,
    what HTTP methods it accepts, what Django model it cares about, and
    whether the path has any `<...>` placeholders we need to fill in before
    we can actually call it. `executable=False` means "we found the route
    but we don't trust ourselves to call it correctly" — the workbench UI
    will dim it out.

    Fields:
        path: the URL template, e.g. `/api/v1/books/<int:pk>/`.
        methods: accepted HTTP methods as a list of uppercase strings.
        name: the URL name (for `reverse()` lookup), or empty.
    kind: one of `"api_view"`, `"viewset"`, `"django_cbv"`, `"function_view"`.
    is_drf: True when the view is a DRF APIView, ViewSet, or @api_view FBV.
        executable: True when we trust ourselves to fire this route safely.
        url_params: the `<...>` placeholders to fill before calling.
        model: "app_label.ModelName" (e.g. "books.Book"), if discoverable.
        skip_reason: why we marked executable=False (None when executable=True).
        view: the underlying view class (for introspector-internal use).
        url_kwarg_to_field: maps URL kwarg name → model field name,
            e.g. `{"article_slug": "slug"}` for views with a custom lookup.
    """

    path: str
    methods: list[str]
    name: str
    kind: Literal["api_view", "viewset", "django_cbv", "function_view"] = "api_view"
    is_drf: bool = False
    executable: bool = True
    url_params: list[UrlParam] = field(default_factory=list)
    model: str | None = None
    skip_reason: str | None = None
    view: Callable | None = None
    url_kwarg_to_field: dict[str, str] = field(default_factory=dict)

    @property
    def has_url_params(self) -> bool:
        """True when the route contains at least one `<...>` placeholder."""
        return len(self.url_params) > 0


# ---------------------------------------------------------------------------
# The result of running one request through the engine
# ---------------------------------------------------------------------------
@dataclass
class ProfileResult:
    """
    The full answer the engine returns when the workbench (or MCP agent) calls
    `POST /profiler/execute/` for one target.

    ELI5: This is the receipt from one profiling run. It has two halves:
    - `http_response`: what came back from the view itself (status code, body).
    - `profiling_summary`: everything we learned by watching the view run —
      every SQL query that fired, which file:line triggered each one, the
      total time, and any N+1 patterns we spotted.

    The workbench renders both halves side-by-side; the MCP agent reads the
    profiling_summary to decide what to fix next.

    Fields:
        path: the resolved URL that was actually called (after path-param
            substitution).
        status_code: the HTTP status the view returned.
        metrics: high-level numbers — total queries, db time, n+1 detected, etc.
        queries: every captured SQL statement with file:line origin.
        analysis: N+1 flags with copy-pasteable `.select_related()` fixes.
        error: a human-readable error message, or None on success.
        side_effect_warnings: warnings about blocking I/O calls in the view.
        response_body: the parsed JSON body the view returned.
        request: a snapshot of the request that was sent (for debugging).
    """

    path: str
    status_code: int
    metrics: dict[str, Any] = field(default_factory=dict)
    queries: list[dict[str, Any]] = field(default_factory=list)
    analysis: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None
    side_effect_warnings: list[str] = field(default_factory=list)
    response_body: Any | None = None
    request: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# The result of trying to resolve a parameterized URL
# ---------------------------------------------------------------------------
@dataclass
class ResolvedPath:
    """
    The answer to "can we actually build a real URL for this route?"

    ELI5: Some routes need values in their URL (like `/books/42/` — the `42`
    has to be a real book's id). This dataclass tells the workbench either
    "here's the concrete URL we built and the values we used" (when
    `url` is set), or "we couldn't build it because <reason>" (when
    `url is None` and `reason` is set). The UI uses the reason to show
    "Pick a record or enter a value" instead of silently failing.

    Fields:
        url: the concrete URL string, or None when resolution failed.
        params: the placeholder values that were used (or collected so far).
        reason: a human-readable explanation of why resolution failed, or None.
    """

    url: str | None
    params: dict[str, Any]
    reason: str | None = None


# ---------------------------------------------------------------------------
# Errors raised by the adapter when something is structurally wrong
# ---------------------------------------------------------------------------
class TargetNotFoundError(Exception):
    """Raised when a request asks about a target id we don't recognize."""


class UnresolvablePathError(Exception):
    """Raised when a route's path parameters can't be resolved from existing data
    and no explicit value was supplied. The caller should pick a record, ask the
    user, or supply an explicit value.
    """
