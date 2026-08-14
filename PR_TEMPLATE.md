## Description

This PR represents a fundamental shift in the da-profiler architecture: migrating from an auto-seeded mock generation model to a workbench-driven UI approach. The core change eliminates the old `mock_generator.py` that auto-created fake database records, replacing it with a "what you see is what ran" philosophy. Users now profile against real requests, and the UI provides workbench-style analysis of actual response data, queries, and queries.

Key objectives:
- Remove implicit database seeding that masked real performance issues
- Provide transparent path parameter resolution that fails clearly when values aren't available
- Shift from generated mock data to real request profiling in the workbench UI
- Maintain framework-agnostic core while enhancing Django DRF adapter capabilities

## Related Issue

Closes #1

## Type of Change

- [x] ✨ New feature (non-breaking change that adds functionality)
- [x] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected) — auto-seeded mocks removed, path resolution now requires explicit values
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] 📝 Documentation update
- [ ] ♻️ Refactor (no functional changes)
- [ ] 🔍 Fingerprinting / N+1 detection logic change
- [ ] 🧩 New or modified framework adapter (Django, or a new one)
- [ ] 🧪 Test coverage
- [ ] 🔧 Chore / tooling / CI

## What Changed

- **Removed** `dqs/adapters/drf/mock_generator.py` (244 lines) — eliminated auto-seeded mock data generation
- **New workbench UI** (split to separate repo at <https://github.com/Profysr/da-profile-fe>) — React components for split-pane request/response analysis, tabbed query/summary/side effects views, and connection management
- **SQL fingerprinting engine** in `dqs/core/analyzer.py` — normalizes queries by replacing literals with `?`, collapsing `IN (...)` lists, canonicalizing table aliases, AND-sorting conditions for N+1 pattern detection
- **Static AST advisor** in `dqs/core/static_advisor.py` — detects ORM calls in loops (N+1 patterns) and blocking I/O calls (requests.post, smtplib.SMTP, time.sleep, etc.)
- **DRF adapter rewrites** — introspector, converters, runner, types, views, db_manager, router all updated for the new paradigm
- **Path parameter resolution** in `converters.py` — explicitly does NOT seed the database; fails gracefully with clear error messages when values unavailable
- **Shadow database** optional configuration for profiling against a separate DB copy
- **New test suite** — core analyzer tests (pure Python), DRF adapter integration tests, end-to-end rollback guarantee tests

## Which layer does this touch?

- [x] `dqs/core/` (framework-agnostic — analyzer, dashboard)
- [x] `dqs/adapters/drf/` (Django-specific)
- [ ] `demo_project/` (dev/test scaffolding only, not shipped)
- [ ] Docs only (`README.md`, `ROADMAP.md`, `CHANGELOG.md`)

## Fingerprinting Impact

- [x] This changes how queries are fingerprinted or grouped
- [x] I checked `CHANGELOG.md` #7 to confirm this isn't reversing a deliberate scope cut (subqueries, OR-clause reordering, etc.) — if it is, I've explained why below
- [x] I tested this against the AND-sort, IN-collapse, and alias-canonicalization cases already covered in `tests/test_analyzer.py` to confirm no regressions

## How Has This Been Tested?

- [x] Ran `pytest` (`docker compose run --rm web pytest`)
- [x] Ran `ruff check dqs/`
- [x] Manually tested against `demo_project`'s sample endpoints in Docker (`docker compose up`)
- [x] Confirmed `tests/test_analyzer.py` still passes without requiring Django (core/adapter boundary intact)

**Test steps:**
1. Ran `pytest` — all core tests pass (analyzer, static_advisor) without Django dependency
2. Ran `ruff check dqs/` — no linting errors
3. Tested end-to-end profiling via `docker compose up` — shadow DB rollback guarantee verified
4. Confirmed path parameter resolution fails clearly (no more auto-seeding) when values unavailable
5. Verified SQL fingerprinting: AND-sort, IN-collapse, and alias-canonicalization all work as expected

## Checklist

- [x] My code follows the project's coding standards (see [CONTRIBUTING.md](../CONTRIBUTING.md))
- [x] I have performed a self-review of my own code
- [x] I have commented my code where necessary, particularly in hard-to-understand areas (e.g. the AST normalization steps in `analyzer.py`)
- [x] `dqs/core/` contains no Django (or other framework) imports
- [x] I have made corresponding changes to the documentation — see the [Documentation Map](../CONTRIBUTING.md#documentation-map) to find the right file for your change
- [x] If this is an architectural decision or a tradeoff, I've added a note to `CHANGELOG.md`
- [x] My changes generate no new warnings or linter errors
- [x] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes
- [x] I have checked that no secrets, API keys, or `.env` files are included in this PR
- [x] Any dependent changes have been merged and published

## Additional Notes

This is a deliberate architectural shift: the old mock generation model implicitly guaranteed passing results by auto-creating data, which masked real N+1 and performance issues. The new workbench UI approach requires users to profile against actual requests, providing transparent feedback but requiring valid test data. The core boundary (`dqs/core/`) remains framework-agnostic with zero Django imports. Trade-off: users must now provide real request data or seed data explicitly, but the payoff is genuine performance insight rather than artificially guaranteed results.