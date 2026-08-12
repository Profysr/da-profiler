"""
Query Interceptor & Analysis Engine
====================================

ELI5: The QueryInterceptor is the CCTV camera from the runner's story. While
a view is running, every SQL query Django sends to the database passes
through this wrapper. For each query, we record three things:

- the SQL text itself (so we can compare queries to each other),
- how long it took in milliseconds (so we can spot slow ones),
- where in YOUR code it came from (the file and line number — by walking
  Python's call stack at the exact moment the query fires).

The QueryAnalysisEngine is the post-processing step. Once execution finishes,
it groups queries by their "fingerprint" (a normalized version of the SQL
that ignores changing values like IDs) and flags any group that ran too many
times — that's an N+1 pattern. For each flagged pattern we emit a
copy-pasteable `.select_related()` / `.prefetch_related()` fix.
"""

from __future__ import annotations

import inspect
import json
import os
import time
from collections.abc import Callable
from typing import Any

from django.db import connection

from dqs.adapters.drf.types import ProfileResult
from dqs.core.analyzer import detect_n_plus_one, fingerprint


class QueryInterceptor:
    """
    Context manager that hooks Django's database driver so every SQL
    statement passes through our wrapper while the block is active.

    ELI5: We tell Django "for the next few seconds, every time you talk to
    the database, run it through THIS function first so we can take notes."
    When the block ends, we tell Django to stop.

    Framework/django-internal calls are filtered out so the file:line we
    report points to user code (views.py:42) instead of Django internals.
    """

    # Folders/paths we skip when walking the call stack — we want user code,
    # not framework plumbing.
    _EXCLUDE_PATH_FRAGMENTS: tuple[str, ...] = (
        "site-packages",
        f"django{os.sep}",
        f"rest_framework{os.sep}",
        f"dqs{os.sep}core{os.sep}",
        f"dqs{os.sep}adapters{os.sep}",
        "django/",
        "rest_framework/",
        "dqs/core/",
        "dqs/adapters/",
    )

    def __init__(self) -> None:
        self.captured_queries: list[dict[str, Any]] = []

    def __enter__(self) -> "QueryInterceptor":
        self._hook = connection.execute_wrapper(self._wrap)
        self._hook.__enter__()
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        self._hook.__exit__(exc_type, exc_value, traceback)

    def _wrap(
        self,
        execute: Callable[..., Any],
        sql: str,
        params: Any,
        many: bool,
        context: dict[str, Any],
    ) -> Any:
        """Run the query, time it, record it, and capture where it came from."""
        start = time.perf_counter()
        try:
            return execute(sql, params, many, context)
        finally:
            duration_ms = (time.perf_counter() - start) * 1000.0
            self.captured_queries.append({
                "sql": sql,
                "time_ms": duration_ms,
                "src_loc": self._extract_source_location(),
            })

    def _extract_source_location(self) -> str | None:
        """
        Walk Python's call stack and return the first user-code frame.

        ELI5: Right now, a query just fired. We look up the call stack —
        the chain of functions that called each other to get here — and
        skip past the boring framework parts (Django, DRF, DQS itself)
        until we find a frame in YOUR code. That's the file:line we
        report. If we can't find one (e.g. middleware fired it), we
        return None instead of guessing.
        """
        for frame_info in inspect.stack():
            filename = frame_info.filename
            if any(fragment in filename for fragment in self._EXCLUDE_PATH_FRAGMENTS):
                continue
            parts = filename.split(os.sep)
            short_path = "/".join(parts[-2:]) if len(parts) >= 2 else filename
            return f"{short_path}:{frame_info.lineno}"
        return None


class QueryAnalysisEngine:
    """
    Turns a list of raw captured queries into a structured ProfileResult.

    ELI5: The CCTV tape comes back with every query recorded. This engine
    rewatches the tape and answers three questions:

    1. "Which queries happened more than once with the same shape?" — N+1.
    2. "How long did the whole thing take, and how much was DB time?"
    3. "What fix would have prevented each N+1?" — we generate a one-line
       `.select_related('author')` suggestion based on the relationships
       in the SQL.
    """

    @staticmethod
    def parse_response_body(response: Any) -> Any | None:
        """Pull the parsed body out of a DRF or Django response object."""
        if hasattr(response, "data"):
            return response.data
        content = getattr(response, "content", None)
        if not content:
            return None
        try:
            return json.loads(content.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return None

    @classmethod
    def build_execution_result(
        cls,
        path: str,
        status_code: int,
        queries_captured: list[dict[str, Any]],
        db_duration_ms: float,
        response_body: Any,
        side_effect_warnings: list[str],
        request: dict[str, Any] | None = None,
        target_model: str | None = None,
        n_plus_one_threshold: int = 3,
    ) -> ProfileResult:
        """
        Build the final ProfileResult from everything we know about the run.

        ELI5: This is where all the separate pieces (queries, response,
        timing, warnings) get glued into the single receipt the workbench
        shows and the MCP agent reads.
        """
        formatted_queries = [
            {
                "sql": q["sql"],
                "fingerprint": fingerprint(q["sql"]),
                "time_ms": q["time_ms"],
                "src_loc": q.get("src_loc"),
            }
            for q in queries_captured
        ]

        n_plus_one_flags = detect_n_plus_one(
            formatted_queries,
            threshold=n_plus_one_threshold,
            target_model=target_model,
        )

        analysis_payload = [
            {
                "fingerprint": group["fingerprint"],
                "count": group["count"],
                "src_loc": group.get("src_loc"),
                "target_model": group.get("target_model") or target_model,
                "suggestion": group.get("suggestion"),
                "sample_queries": group.get("sample_queries", []),
            }
            for group in n_plus_one_flags
        ]

        unique_fingerprints = {q["fingerprint"] for q in formatted_queries}
        
        metrics = {
            "total_queries": len(queries_captured),
            "unique_fingerprints": len(unique_fingerprints),
            "db_time_ms": round(db_duration_ms, 2),
            "n_plus_one_detected": len(n_plus_one_flags) > 0,
            "n_plus_one_groups": [
                {
                    "fingerprint": g["fingerprint"],
                    "count": g["count"],
                    "src_loc": g.get("src_loc"),
                    "suggestion": g.get("suggestion"),
                }
                for g in n_plus_one_flags
            ],
        }

        return ProfileResult(
            path=path,
            status_code=status_code,
            metrics=metrics,
            queries=formatted_queries,
            analysis=analysis_payload,
            response_body=response_body,
            side_effect_warnings=side_effect_warnings,
            request=request,
        )
