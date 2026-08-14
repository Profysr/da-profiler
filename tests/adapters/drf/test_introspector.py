"""
tests/adapters/drf/test_introspector.py
=========================================
Unit tests for DjangoIntrospector — URL route discovery and parameter extraction.

ELI5: These tests confirm the introspector correctly walks a project's URL
tree, classifies each route (DRF view vs. ViewSet vs. unexecutable), and
extracts the path-parameter metadata the runner needs to build concrete URLs.
"""

from __future__ import annotations

import pytest
from django.core.exceptions import ImproperlyConfigured

from dqs.adapters.drf.routing.introspector import DjangoIntrospector
from dqs.adapters.drf.types import Route


class TestDjangoIntrospector:

    def test_initialization_requires_debug(self, settings: object) -> None:
        """The introspector must raise when DEBUG=False — introspection in prod is a leak."""
        settings.DEBUG = False  # type: ignore[attr-defined]
        with pytest.raises(ImproperlyConfigured):
            DjangoIntrospector()

    def test_list_all_routes_discovers_endpoints(self, introspector: DjangoIntrospector) -> None:
        """Every DRF route in the test project should be discoverable."""
        routes = introspector.list_all_routes()
        assert len(routes) > 0
        paths = [r.path for r in routes]
        assert any("books-drf" in p for p in paths) or any("books-set" in p for p in paths)

    def test_route_is_correct_type(self, introspector: DjangoIntrospector) -> None:
        """Every discovered route must be a Route instance."""
        routes = introspector.list_all_routes()
        assert all(isinstance(r, Route) for r in routes)
        assert all(isinstance(r.methods, list) for r in routes)

    def test_drf_viewset_classification(self, introspector: DjangoIntrospector) -> None:
        """DRF ViewSets must be classified with kind='viewset' and a resolved model."""
        routes = introspector.list_all_routes()
        viewset_route = next((r for r in routes if "books-set" in r.path), None)
        if viewset_route is not None:
            assert viewset_route.is_drf is True
            assert viewset_route.kind == "viewset"
            assert viewset_route.model == "sample_app.Book"

    def test_profiler_routes_are_excluded(self, introspector: DjangoIntrospector) -> None:
        """Internal /profiler/ routes must never appear in discovered targets — no recursion."""
        routes = introspector.list_all_routes()
        for route in routes:
            assert not route.path.startswith("/profiler/"), f"Profiler route leaked: {route.path}"

    def test_unresolvable_routes_mark_themselves_non_executable(self, introspector: DjangoIntrospector) -> None:
        """Routes we can't statically analyze must report executable=False with a reason."""
        routes = introspector.list_all_routes()
        for route in routes:
            if not route.executable:
                assert route.skip_reason is not None
                assert route.methods == []  # no methods when we can't safely run it


class TestLookupMapExtraction:
    """The lookup-map extraction lives in PathConverterResolver (moved in the v0.35 cleanup)."""

    def test_lookup_map_standard_pk(self) -> None:
        """Standard DRF view (no custom lookup_field) must return pk -> pk."""
        from rest_framework.generics import RetrieveAPIView
        from dqs.adapters.drf.routing.converters import PathConverterResolver
        assert PathConverterResolver.build_lookup_map(RetrieveAPIView) == {"pk": "pk"}

    def test_lookup_map_custom_kwarg_and_field(self) -> None:
        """A view overriding lookup_url_kwarg + lookup_field must report both."""
        from rest_framework.generics import RetrieveAPIView
        from dqs.adapters.drf.routing.converters import PathConverterResolver

        class ArticleView(RetrieveAPIView):
            lookup_url_kwarg = "article_slug"
            lookup_field = "slug"

        assert PathConverterResolver.build_lookup_map(ArticleView) == {"article_slug": "slug"}

    def test_lookup_map_none_returns_empty(self) -> None:
        """None / falsy input must return an empty mapping without raising."""
        from dqs.adapters.drf.routing.converters import PathConverterResolver
        assert PathConverterResolver.build_lookup_map(None) == {}
