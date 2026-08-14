"""
tests/adapters/drf/test_runner_integration.py
==============================================

ELI5: The single most important guarantee in DQS is "writes during profiling
must not leak out." This integration test exercises that guarantee end-to-end:

1. We wrap a write in `profile_callable()` (which uses an atomic savepoint
   that rolls back automatically).
2. Inside the block the row appears (the count goes up).
3. Outside the block the row is gone (the count is back to where it was).

If this test ever fails, it means real DB writes are happening during a
profile run — the single biggest safety property DQS provides.
"""

from __future__ import annotations

import pytest


@pytest.mark.django_db(transaction=True)
def test_profile_callable_writes_roll_back(runner: object) -> None:
    """
    Validates the core isolation guarantee:
    - Inside `profile_callable()`, a write succeeds (savepoint is active).
    - After the block exits, the write is gone (savepoint rolled back).
    """
    from sample_app.models import Author, Book, Publisher  # type: ignore[import-not-found]

    def write_some_books() -> int:
        publisher = Publisher.objects.create(name="Rollback Publisher")
        author = Author.objects.create(name="Rollback Author")
        Book.objects.create(title="Rollback Book", author=author, publisher=publisher)
        return Book.objects.count()

    count_before = Book.objects.count()
    inside_count, queries, db_duration_ms = runner.profile_callable(write_some_books)
    after_count = Book.objects.count()

    # Inside the savepoint, the row existed — count went up by 1.
    assert inside_count == count_before + 1

    # After rollback, the row is gone.
    assert after_count == count_before

    # Timing info is always returned and non-negative.
    assert db_duration_ms >= 0
    assert isinstance(queries, list)


@pytest.mark.django_db(transaction=True)
def test_profile_callable_with_sandbox_false_persists(runner: object) -> None:
    """
    When `sandbox=False`, writes MUST persist (caller asked us to skip
    the rollback). This is the opt-out path for the agent's "verify a
    POST actually created a row" workflow.
    """
    from sample_app.models import Author, Book, Publisher  # type: ignore[import-not-found]

    def write_a_book() -> int:
        publisher = Publisher.objects.create(name="Persist Publisher")
        author = Author.objects.create(name="Persist Author")
        Book.objects.create(title="Persist Book", author=author, publisher=publisher)
        return Book.objects.count()

    count_before = Book.objects.count()
    inside_count, _, _ = runner.profile_callable(write_a_book, sandbox=False)
    after_count = Book.objects.count()

    # Inside and outside, the write persists — no rollback happened.
    assert inside_count == count_before + 1
    assert after_count == count_before + 1
