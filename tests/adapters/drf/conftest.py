"""
tests/adapters/drf/conftest.py — DRF adapter test suite configuration.

ELI5: This file sets up shared fixtures for every test in the DRF adapter
test package:

- `seeded_book` — a minimal relational dataset (Publisher → Author → Book)
  so tests that need existing rows have them ready.
- `runner` — a pre-initialized DjangoSandboxRunner ready to fire requests.
- `introspector` — a pre-initialized DjangoIntrospector for route tests.

Every test in this package is auto-marked `django` + `drf` so pytest
knows they need a Django/DB environment.

NOTE: The `sample_app` Django app (Publisher/Author/Book models) used to
live in a separate `demo_project/` package. That demo project has been
removed in the v0.35 cleanup pass; these fixtures are kept as a template
for when a new demo project is reintroduced.
"""

from __future__ import annotations

import pytest
from django.conf import settings

# Force DEBUG=True for every test in this package — DQS's safety guards
# refuse to run otherwise.
_enforce_debug_marker = pytest.mark.django


@pytest.fixture(autouse=True)
def enforce_debug_mode(settings: settings) -> None:
    """Every DRF adapter test runs with DEBUG=True."""
    settings.DEBUG = True


@pytest.fixture
def introspector() -> "object":
    """A DjangoIntrospector instance for use in introspector tests.

    Imports are deferred so this conftest can be loaded even before the
    DQS package is installed in the test environment.
    """
    from dqs.adapters.drf.routing.introspector import DjangoIntrospector
    return DjangoIntrospector()


@pytest.fixture
def runner(db: object) -> "object":
    """A DjangoSandboxRunner instance for use in runner/profile tests."""
    from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
    return DjangoSandboxRunner()


# ---------------------------------------------------------------------------
# Model fixtures — kept as a template for the new demo project.
# These are skipped automatically if `sample_app` isn't installed, so
# they don't break unrelated test runs.
# ---------------------------------------------------------------------------
def _import_sample_models() -> tuple[type, type, type] | None:
    """Try to import the demo models. Return None if the demo project isn't installed."""
    try:
        from sample_app.models import Author, Book, Publisher  # type: ignore[import-not-found]
    except ImportError:
        return None
    return Publisher, Author, Book


@pytest.fixture
def seeded_book(db: object):
    """Create a minimal relational dataset (Publisher → Author → Book).

    Skipped automatically if the demo `sample_app` models aren't installed.
    """
    models = _import_sample_models()
    if models is None:
        pytest.skip("sample_app demo models not installed; skipping fixture.")
    Publisher, Author, Book = models
    publisher = Publisher.objects.create(name="Test Publisher")
    author = Author.objects.create(name="Test Author")
    book = Book.objects.create(title="Test Book", author=author, publisher=publisher)
    return book
