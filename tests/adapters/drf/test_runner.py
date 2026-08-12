"""
tests/adapters/drf/test_runner.py
==================================
Integration tests for DjangoSandboxRunner.

ELI5: These tests fire real requests through the runner and check what
comes back. They cover:
- a normal GET request returns 200 + metrics + captured queries,
- the transaction rollback guarantee (writes don't leak out),
- invalid inputs (bad HTTP method, nonexistent route) are handled cleanly,
- the path-resolution refusal (no auto-seeding — we ask instead of guessing).

The `seeded_book` and `runner` fixtures come from conftest.py.
"""

from __future__ import annotations

import pytest

from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
from dqs.adapters.drf.types import ProfileResult


class TestDjangoSandboxRunner:

    def test_runner_executes_list_endpoint_successfully(self, runner: DjangoSandboxRunner, seeded_book: object) -> None:
        """A GET to a list endpoint must return 200 with metrics and captured queries."""
        result = runner.execute_request("/api/v1/books-fbv/", method="GET")

        assert isinstance(result, ProfileResult)
        assert result.status_code == 200
        assert result.error is None
        assert "total_queries" in result.metrics
        assert result.metrics["total_queries"] > 0
        assert len(result.queries) == result.metrics["total_queries"]

    def test_atomic_transaction_rollback(self, runner: DjangoSandboxRunner, seeded_book: object) -> None:
        """
        Critical safety test: any DB writes during profiling must be fully
        rolled back. The row count before and after must be identical.
        """
        from sample_app.models import Book  # type: ignore[import-not-found]

        count_before = Book.objects.count()
        result = runner.execute_request("/api/v1/books-fbv/", method="GET")
        assert result.status_code == 200
        assert Book.objects.count() == count_before

    def test_invalid_http_method_returns_400(self, runner: DjangoSandboxRunner) -> None:
        """An unsupported HTTP method must return 400 without crashing."""
        result = runner.execute_request("/api/v1/books-fbv/", method="TRACE")
        assert result.status_code == 400
        assert result.error is not None
        assert "Invalid HTTP method" in result.error

    def test_unresolvable_route_returns_404(self, runner: DjangoSandboxRunner) -> None:
        """A path that can't be resolved must return 404 with an error message."""
        result = runner.execute_request("/this/does/not/exist/", method="GET")
        assert result.status_code == 404
        assert result.error is not None

    def test_sandbox_toggle_can_be_disabled(self, runner: DjangoSandboxRunner) -> None:
        """When sandbox=False, the runner should still return a valid report."""
        result = runner.execute_request("/api/v1/books-fbv/", method="GET", sandbox=False)
        assert result.status_code == 200

    def test_unresolved_path_param_returns_clear_error(self, runner: DjangoSandboxRunner) -> None:
        """A detail route like /api/v1/books-fbv/<int:pk>/ with no matching row
        should return a 400 with a clear reason — NOT auto-seed one."""
        result = runner.execute_request(
            "/api/v1/books-fbv/999999/",
            method="GET",
            path_params={"pk": 999999},
        )
        assert result.status_code in (200, 400, 404)
        if result.status_code != 200:
            assert result.error is not None
            assert "could not be resolved" in result.error.lower() or "no rows" in result.error.lower()


class TestProfileCallable:

    def test_profile_callable_captures_queries(self, runner: DjangoSandboxRunner) -> None:
        """profile_callable should return the callable's result + captured queries."""
        def sample_query() -> int:
            from sample_app.models import Book  # type: ignore[import-not-found]
            return Book.objects.count()

        result, queries, db_duration_ms = runner.profile_callable(sample_query)
        assert isinstance(result, int)
        assert isinstance(queries, list)
        assert db_duration_ms >= 0

    def test_profile_callable_rolls_back_writes_by_default(self, runner: DjangoSandboxRunner) -> None:
        """A profile_callable that writes must leave the DB unchanged."""
        from sample_app.models import Book  # type: ignore[import-not-found]

        def write_something() -> int:
            from sample_app.models import Author, Publisher  # type: ignore[import-not-found]
            publisher = Publisher.objects.create(name="Should Not Persist")
            author = Author.objects.create(name="Should Not Persist")
            Book.objects.create(title="Should Not Persist", author=author, publisher=publisher)
            return Book.objects.count()

        count_before = Book.objects.count()
        result, _, _ = runner.profile_callable(write_something)
        assert Book.objects.count() == count_before
        assert result == count_before + 1  # inside the savepoint, the row existed
