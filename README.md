<p align="center">
  <img src="imgs/logo.webp" alt="Da Profiler Logo" width="120">
</p>

[![PyPI version](https://img.shields.io/badge/pypi-v0.3.0-blue.svg)](https://pypi.org/project/da-profiler/)
[![Python Version](https://img.shields.io/badge/python-3.10%20|%203.11%20|%203.12-blue)](https://www.python.org/)
[![Django Support](https://img.shields.io/badge/django-4.2%20|%205.0%20|%205.1%20|%205.2-green)](https://www.djangoproject.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Code Style: Ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

![Da Profiler Banner](imgs/da-profile-social-banner.png)

> **Two surfaces, one engine. The interactive Django API workbench + profiler, with an MCP server for AI agents.**

`Da Profiler` (package `dqs`) discovers your Django project's endpoints automatically and exposes them through **two surfaces over one execution engine**:

- A **Postman-style workbench** (`fe/`) — pick an endpoint, build a request, send it, see the HTTP response and the SQL trace side-by-side.
- An **MCP server** — AI agents in Cursor, Claude Code, and Windsurf drive the same engine headlessly: discover → execute → detect N+1 → apply the suggested fix → re-verify, with no human in the loop.

Both surfaces send requests through a shared **execution proxy** that captures every query at the DB-driver boundary inside a toggleable atomic-rollback sandbox, flags N+1 queries with AST-based SQL fingerprinting, and returns a prescriptive, copy-pasteable ORM fix. Payloads are user/agent-supplied — a lean `suggest_payload()` helper gives both surfaces a starting-point template derived from the target's serializer, but never auto-seeds your DB.

---

## ⚡ Quick Navigation

- [Key Features](#-key-features)
- [Why Da Profiler?](#-why-da-profiler)
- [Feature Comparison](#-feature-comparison)
- [Architecture & Design](#-architecture--design)
- [How It Works](#-how-it-works)
- [Request Builder & Payload Suggester](#-request-builder--payload-suggester)
- [AI Agent Integration (MCP)](#-ai-agent-integration-mcp)
- [Installation & Quickstart](#-installation--quickstart)
- [Running Tests](#-running-tests)
- [Project Documentation](#-project-documentation)
- [Contributing & License](#-contributing--license)

---

## ✨ Key Features

- 🖥️ **Postman-Style Workbench UI** — searchable sidebar of every discovered endpoint, request builder with method/path/headers/auth/body editors, side-by-side HTTP response and SQL trace panels. Dark mode, keyboard shortcuts, saved collections.
- 🤖 **Agent-First MCP Server** — exposes the engine as MCP tools (`list_targets`, `execute_request`, `suggest_payload`, `audit_authz`, `apply_fix`) so an AI coding agent can run the discover → execute → fix → re-verify loop without a human in the loop.
- 🛡️ **Toggleable Transaction Sandbox** — wraps execution in `transaction.atomic()` with rollback by default. The caller can opt out per-request when it actually wants a write to persist (e.g. the agent verifying a POST created a row).
- 🧬 **AST-Based SQL Fingerprinting** — powered by `sqlglot`. Strips numeric/string literals, normalizes dynamic `IN (...)` parameter lists, canonicalizes table aliases — eliminates false positives that plague Django Silk.
- 🎯 **Target Discovery Engine** — auto-discovers Django views (FBV, CBV, DRF ViewSets), signal receivers, Celery tasks, and Channels ASGI consumers. Both surfaces consume the same `Target` list.
- 👤 **Role Impersonation & AuthZ Audit Matrix** *(v0.5)* — pick any user from a dropdown to impersonate, switch between Session / Bearer / Anonymous auth modes, and run a multi-role access audit against any endpoint with a single click. Flags permission leaks and over-restrictions.
- 🔮 **Payload Suggestions, Not Auto-Seeding** — `suggest_payload(target_id)` inspects the target's `serializer_class` and returns a JSON template the caller can edit. Never writes to the DB. Replaces the old mock-data generator.
- 💡 **Prescriptive Fix Suggestions** — N+1 origins are pinpointed to the exact user code line, with copy-pasteable `.select_related()` / `.prefetch_related()` remediation. The agent applies the fix via `apply_fix()` and re-runs to verify.
- 🧱 **Decoupled Engine Design** — strict separation between framework-agnostic analysis (`dqs/core/`) and Django/DRF adapters (`dqs/adapters/drf/`). One execution proxy serves both the workbench and the MCP server.

---

## 💡 Why Da Profiler?

Traditional API tools force a tradeoff: **Postman** gives you a great UI for crafting requests but is blind to what Django does under the hood — no SQL trace, no N+1 detection, no role-aware testing. **Django Silk** gives you deep query introspection but only as passive middleware that logs traffic you've already produced by clicking around in a browser. **Django Debug Toolbar** is the same idea, per-request, in the browser.

`Da Profiler` collapses that tradeoff into one tool:

- **For humans** — open the workbench, pick an endpoint, edit the body, hit Execute. You get the HTTP response and the SQL trace (with file:line origins) in the same view. Switch users from a dropdown. Run a multi-role AuthZ audit without writing test code.
- **For AI agents** — wire the MCP server into your IDE. The agent calls `execute_request`, reads the response, detects the N+1, calls `apply_fix`, re-runs, and confirms the query count dropped. No human re-testing anything.
- **For both** — payloads are user/agent-supplied, not synthesized. What you test is what your users actually send. Sandbox is on by default, opt-out per call. One execution proxy, one query interceptor, one analyzer.

---

## 📊 Feature Comparison

| Feature | Postman | Django Silk | Da Profiler (`dqs`) |
|---|---|---|---|
| **Request builder UI** | Excellent | None | **Postman-style workbench** |
| **Discovery** | Manual import | Passive traffic logging | **Active URL/signal/task/consumer tree** |
| **DB footprint** | None | High (persists log rows) | **Zero (toggleable atomic rollback)** |
| **N+1 detection** | None | Manual SQL review | **Automated AST fingerprinting (`sqlglot`)** |
| **Fix generation** | None | None | **Prescriptive ORM (`.select_related()`) + agent `apply_fix()`** |
| **Role impersonation** | Manual token copy-paste | Not supported | **Native dropdown (Session/Bearer/Anonymous)** |
| **Multi-role AuthZ audit** | Not supported | Not supported | **`audit_authz` tool — one click, full matrix** |
| **Payload source** | User-typed | n/a | **User/agent-supplied, with `suggest_payload()` template** |
| **AI agent integration** | None | None | **Native MCP server (Cursor, Claude Code, Windsurf)** |
| **CI gating** | Collection runner (limited) | Not supported | **Same proxy, CLI linter in v2.0+** |

---

## 🏗️ Architecture & Design

Da Profiler enforces a clean architectural separation. One execution engine, two surfaces.

```
                       ┌────────────────────┐      ┌────────────────────┐
                       │  Workbench UI (fe/) │      │   MCP Server        │
                       │   Human surface     │      │   Agent surface     │
                       └─────────┬──────────┘      └─────────┬──────────┘
                                 │                            │
                                  │   POST /profiler/execute   │
                                  │   POST /profiler/audit     │
                                 └────────────┬───────────────┘
                                              │
                                              ▼
                    ┌────────────────────────────────────────────────┐
                    │       Execution Proxy  (dqs/adapters/drf/      │
                    │              execution/proxy.py)               │
                    │  • Validates target + request shape            │
                    │  • Builds WSGI request with user context       │
                    │  • Toggleable atomic-rollback sandbox          │
                    └────────────────────┬───────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────────┐
                    │            Sandbox Runner (runner.py)          │
                    │          QueryInterceptor (query_interceptor)  │
                    │            StaticASTAdvisor (static_advisor)   │
                    │            ASTAnalyzer (sqlglot fingerprints)  │
                    └────────────────────────────────────────────────┘
```

### Directory Structure

```
dqs/
├── __init__.py
├── core/                              # Framework-agnostic engine (zero Django imports)
│   ├── analyzer.py                    # sqlglot-based SQL AST fingerprinting & N+1 detection
│   ├── static_advisor.py              # Pure AST static code scanner (loops & blocking I/O)
│   └── targets.py                     # Unified Target dataclass
├── adapters/
│   └── drf/                           # Django & DRF adapter
│       ├── apps.py                    # DQS Django AppConfig (DEBUG guard)
│       ├── router.py                  # Shadow DB router & profiling_session context manager
│       ├── types.py                   # Shared dataclasses
│       ├── views.py                   # Workbench & profiling endpoints
│       ├── urls.py                    # URL config (/profiler/manage/routes, /profiler/execute, /profiler/connection/health)
│       ├── database/
│       │   └── db_manager.py          # Shadow DB validation & migrations (legacy / opt-out)
│       ├── routing/
│       │   ├── introspector.py        # URL route pattern tree walker
│       │   └── converters.py          # Dynamic path parameter resolver (no auto-seeding)
│       ├── auth/                      # NEW in v0.5
│       │   ├── impersonation.py       # Session / Bearer / Anonymous user context injection
│       │   └── audit.py               # Multi-role AuthZ matrix runner
│       └── execution/
│           ├── discovery.py           # Target discovery (views, signals, tasks, consumers)
│           ├── query_interceptor.py   # DB connection.execute_wrapper hook + QueryAnalysisEngine
│           ├── runner.py              # Savepoint execution & callable profiling (low-level engine)
│           └── proxy.py               # NEW in v0.5 — single entry point for UI + MCP
└── mcp/                               # NEW in v0.4
    └── server.py                      # MCP server (stdio + SSE) + tool definitions
fe/                                    # React/Vite workbench UI (human surface)
```

> 📖 For full system diagrams and execution sequence specifications, check out [`ARCHITECTURE.md`](./architecture.md).

---

## 🔍 How It Works

### Step-by-Step N+1 Identification

#### 1. Unoptimized View Code
```python
# sample_app/views.py
from django.http import JsonResponse
from .models import Book

def list_books(request):
    books = Book.objects.all()  # Initial query
    data = [
        {"title": book.title, "author": book.author.name}  # N+1 queries in loop
        for book in books
    ]
    return JsonResponse(data, safe=False)
```

#### 2. Request Hits the Proxy

The workbench UI (or the MCP agent) builds a request:
```json
{
  "target_id": "view:/api/v1/books/",
  "method": "GET",
  "headers": {},
  "query_params": {},
  "body": null,
  "user_context": { "type": "anonymous" },
  "auth_mode": "session",
  "sandbox": true
}
```

The proxy validates the target, attaches the requested user context (`AnonymousUser` here), opens `transaction.atomic()` with rollback, attaches the `QueryInterceptor`, and dispatches the request via `RequestFactory`.

#### 3. Captured SQL Execution
```sql
SELECT "id", "title", "author_id" FROM "sample_app_book";
SELECT "id", "name" FROM "sample_app_author" WHERE "id" = 10;
SELECT "id", "name" FROM "sample_app_author" WHERE "id" = 25;
SELECT "id", "name" FROM "sample_app_author" WHERE "id" = 42;
```

#### 4. AST Normalization (`dqs.core.analyzer`)
Queries parse into AST representations and collapse to a single fingerprint:
```sql
SELECT "id", "name" FROM "sample_app_author" WHERE "id" = ?
```

#### 5. Prescriptive Report Returned to the Caller

The proxy returns the HTTP response **and** the profiling summary in one payload:

```json
{
  "http_response": {
    "status_code": 200,
    "headers": { "content-type": "application/json" },
    "body": [{ "title": "...", "author": "..." }, "..."]
  },
  "profiling_summary": {
    "total_duration_ms": 34.2,
    "sql_queries_count": 4,
    "duplicate_queries_count": 3,
    "queries": [
      { "sql": "SELECT ... FROM auth_user WHERE id = 1", "time_ms": 1.2, "origin": "django/contrib/auth/models.py:120" },
      { "sql": "SELECT ... FROM store_author WHERE id = 4", "time_ms": 0.8, "origin": "sample_app/views.py:7" }
    ],
    "n_plus_one_flags": [
      {
        "fingerprint": "SELECT \"id\", \"name\" FROM \"sample_app_author\" WHERE \"id\" = ?",
        "count": 3,
        "source_location": "sample_app/views.py:7",
        "suggestion": "Add .select_related('author') to your QuerySet."
      }
    ],
    "warnings": [
      "N+1 Query detected on Author model during serialization.",
      "Sandbox mode: all writes rolled back."
    ]
  }
}
```

The workbench renders the response and the trace side-by-side. The MCP agent reads the `n_plus_one_flags`, calls `apply_fix` to inject `.select_related('author')` at the flagged line, then calls `execute_request` again to confirm the query count dropped.

---

## 🛠️ Request Builder & Payload Suggester

The workbench's **request builder** is the human-facing half of the engine. The MCP agent constructs equivalent requests programmatically.

> **Note:** The payload suggester is **deferred to a later release**. Today, payloads are caller-supplied via the `body` field of `POST /profiler/execute`. Both the workbench and the MCP agent construct or hand-write the request body directly. When the suggester lands it will follow this shape:
  "notes": [
    "author_id is a PrimaryKeyRelatedField — pick an existing Author row or leave 1 for the dev DB.",
    "isbn uses SlugField — value above passes the slug pattern."
  ],
  "warnings": []
}
```

The UI's **"Populate from schema"** button calls this and drops the template into the body editor. The MCP agent calls it via `suggest_payload()` tool when constructing its own request. In neither case does DQS write to the database — the template is just a starting point.

**Path parameters** (e.g. `/books/<int:pk>/`) are resolved against real DB rows first (`Model.objects.first()`), and if no row exists, the proxy returns a clear error rather than auto-seeding one. The UI surfaces this as "Pick a record or enter a value"; the agent gets a structured 400 response.

---

## 🤖 AI Agent Integration (MCP)

Da Profiler ships a native Model Context Protocol (MCP) server so AI coding agents (Cursor, Claude Code, Windsurf) can drive the same engine headlessly.

### Tool Surface (v0.4 + v0.5)

| Tool | Purpose |
|---|---|
| `list_targets` | Returns all discovered `Target` records (views, signals, tasks, consumers) with their kinds and static findings. |
| `get_static_findings` | Returns AST findings for a target or the whole project — N+1 candidates, blocking I/O, missing indexes (when implemented). |
| `suggest_payload(target_id)` | **Deferred.** Will return a JSON template derived from the target's serializer. Currently the agent constructs payloads directly. |
| `execute_request(target_id, payload, headers, query_params, path_params, user_context, sandbox)` | The core tool — sends a request through the execution proxy and returns HTTP response + SQL trace + N+1 flags. |
| `audit_authz(target_id, user_ids[])` | Runs the same target under N different user contexts and returns an access matrix. Flags permission leaks. *(Implementation lands in v0.5; tool is registered in v0.4 and returns 501 until then.)* |
| `apply_fix(target_id, fix_type, params)` | Applies a prescriptive fix (e.g. `.select_related('author')`) at the flagged source location using AST-level source edits. The agent calls this, then `execute_request` again to verify. |

### The Agentic Loop

```
+------------------+         list_targets()                +------------------+
|                  | -------------------------------------> |                  |
|   AI IDE Agent   |        execute_request(target)         |   Da Profiler    |
| (Cursor / Claude)| -------------------------------------> |    MCP Server    |
|                  | <------------------------------------- |                  |
|                  |         Response + SQL trace           |                  |
|                  | -------------------------------------> |                  |
|                  |         apply_fix(target, fix)         |                  |
|                  | -------------------------------------> |                  |
|                  |         execute_request(target)        |                  |
|                  | <------------------------------------- |                  |
|                  |         Query count dropped (4 → 1)    |                  |
+------------------+                                        +------------------+
```

The agent detects N+1, reads the suggested fix, applies it via `apply_fix`, re-runs, and confirms the query count dropped — entirely without a human re-testing anything by hand.

---

## 🚀 Installation & Quickstart

### Installation

```bash
pip install da-profiler[django]
```

Add `dqs.adapters.drf` to your `INSTALLED_APPS` (development environment only):

```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ["dqs.adapters.drf"]
    DATABASE_ROUTERS = ["dqs.adapters.drf.router.DQSRouter"]
```

### ⚙️ Shadow Database Setup & Telemetry Isolation

To isolate your default database from profiling writes (when sandbox is opted out), configure a `'dqs_shadow'` entry in your `settings.DATABASES` matching your backend engine:

```python
# settings.py
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "my_db",
        "USER": "db_user",
        "PASSWORD": "db_password",
        "HOST": "localhost",
        "PORT": "5432",
    },
    "dqs_shadow": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "my_db_shadow",
        "USER": "db_user",
        "PASSWORD": "db_password",
        "HOST": "localhost",
        "PORT": "5432",
    },
}
```

To initialize or update your shadow database schema, execute migrations against the `dqs_shadow` database:

```bash
python manage.py migrate --database=dqs_shadow
```

> **Note:** With sandbox mode on (the default), writes are rolled back regardless of which DB is in use. The shadow DB is only relevant when sandbox is opted out per-call, or for the `profiling_session()` context manager's pre-v0.5 workflows.

---

### Development Setup (Docker)

```bash
# 1. Clone repository
git clone https://github.com/Profysr/query-profiler.git
cd query-profiler

# 2. Configure environment
cp .env.example .env

# 3. Build containers and start Postgres
docker compose build
docker compose up -d db

# 4. Start stack and run migrations
docker compose up -d
docker compose exec web python manage.py migrate
```

---

## 🧪 Running Tests

Da Profiler uses **pytest** with a marker-based test architecture.

### Test Architecture

```
tests/
├── conftest.py                      # Root: marker registration
├── core/                            # Marker: `core` — pure Python, no DB
│   ├── conftest.py                  # Auto-marks all tests as `core`
│   ├── test_analyzer.py             # SQL AST fingerprinting & N+1 detection
│   └── test_static_advisor.py       # Python AST static code scanning
├── adapters/
│   └── drf/                         # Marker: `django` + `drf` — requires DB
│       ├── conftest.py              # Shared fixtures: runner, introspector, seeded_book
│       ├── test_proxy.py            # NEW — hardened execution proxy (v0.5)
│       ├── test_converters.py       # PathConverterResolver unit tests
│       ├── test_discovery.py        # Signal & task discovery tests
│       ├── test_introspector.py     # URL route scanning and lookup map tests
│       ├── test_query_interceptor.py# DB execute_wrapper SQL capture tests
│       ├── test_runner.py           # SandboxRunner & step-driven pipeline tests
│       ├── test_runner_integration.py # Setup isolation & savepoint rollback test
│       └── auth/                    # NEW in v0.5
│           ├── test_impersonation.py
│           └── test_audit.py
└── mcp/                             # NEW in v0.4
    └── test_server.py               # MCP tool contract tests
```

### Marker Taxonomy

| Marker | Meaning | Requires DB? | Speed |
|---|---|---|---|
| `core` | Pure Python (`dqs/core/`) — no Django, no ORM | No | ⚡ Fastest |
| `django` | Django ORM + DB access (`dqs/adapters/drf/`) | Yes | 🐢 Slower |
| `drf` | DRF adapter subset of django tests | Yes | 🐢 Slower |

### Running the Test Commands

#### Option 1: From Source Repository (Recommended)

```bash
# 1. Install package in editable mode with dev dependencies
pip install -e ".[dev]"

# 2. Go to demo project for Django tests
cd demos/drf

# 3. Run migrations on shadow database
python manage.py migrate --database=dqs_shadow

# 4. Run tests
pytest -m core        # Pure Python tests (fastest — no DB, no Django setup)
pytest -m django      # Django/DRF adapter tests
pytest -v             # All tests with verbose output
```

#### Option 2: Docker Compose (Full Stack)

```bash
# From repository root
docker compose build
docker compose up -d db
docker compose up -d

# Run tests inside container
docker compose exec web pytest -m core
docker compose exec web pytest -m django
```

#### Option 3: Install Built Package in Demo Project

```bash
# 1. Build the package
pip install build
python -m build

# 2. Install in demo project
cd demos/drf
pip install ../../dist/da_profiler-0.3.0-py3-none-any.whl[django]

# 3. Run migrations and tests
python manage.py migrate --database=dqs_shadow
pytest -m core
pytest -m django
```

---

## 📚 Project Documentation

- 📄 [`ARCHITECTURE.md`](./architecture.md) — System design, sequence flows, and component breakdown.
- 🗺️ [`ROADMAP.md`](./ROADMAP.md) — Development milestones, planned phases, and the structural pivot from auto-mock-data to two-surface engine.
- 📋 [`CHANGELOG.md`](./CHANGELOG.md) — Detailed version history, releases, and architectural decisions.
- 🔄 [`docs/Flow Diagram.md`](./docs/Flow%20Diagram.md) — Complete visual flow diagrams (route discovery, profiling execution, query interception).
- 🤝 [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Contribution guidelines, dev setup, and commit standards.
- 🔒 [`SECURITY.md`](./SECURITY.md) — Security policy and vulnerability reporting.
- 📜 [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — Community guidelines.
- 🚀 [`docs/Quickstart.md`](./docs/Quickstart.md) — 5-minute getting started guide.
- 💡 [`docs/How it work.md`](./docs/How%20it%20work.md) — ELI5 explanations of core concepts.
- 🧪 [`docs/Test and Publish Guide.md`](./docs/Test%20and%20Publish%20Guide.md) — Integration, profiling & testing guide.
- 🛠️ [`docs/Developer Onboarding.md`](./docs/Developer%20Onboarding.md) — File-by-file codebase reference.
- 🖥️ [`fe/README.md`](./fe/README.md) — Frontend workbench UI documentation.

---

## 📄 Contributing & License

Contributions are welcome! Please review [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.
