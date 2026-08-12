# Da Profiler — Roadmap & Build Status

*Source of truth for project execution. Tracks what is completed, currently under construction, and planned — and, in this section, why any of it matters.*

> **Revision note (this update):** A second structural pivot. DQS is repositioning from "auto-profile every target with synthetic data" to **two surfaces, one engine**:
> - A **human-facing workbench** (Postman-style UI in `fe/`) for exploration and one-off debugging.
> - An **agent-facing MCP server** that runs the same loop headlessly — discover → execute → detect N+1 → apply the suggested fix → re-verify, with no human in the loop.
>
> Both surfaces send requests through one shared **execution proxy** that takes user/agent-supplied payloads, attaches the v0.25 query interceptor inside a toggleable atomic-rollback sandbox, and returns the HTTP response alongside the captured SQL trace. The mock data generator and request-body inferrer from v0.3 are **deleted** — payloads are user/agent-supplied through `POST /profiler/execute`, with a `suggest_payload()` helper (deferred to a later release) planned as an opt-in starting-point template. Auth becomes first-class (user impersonation + multi-role AuthZ audit matrix). The phase order is reshuffled: the workbench UI ships first (v0.35) so the engine has a UI proving the proxy works, then the MCP server (v0.4) so agents can drive the same engine, then auth + the execution proxy itself as a hardened v0.5, then v1.0 ships both surfaces together.
>
> **Naming cleanup:** the type names in `dqs/adapters/drf/types.py` were tightened for clarity — `RouteMetadata` → `Route`, `PathParam` → `UrlParam`, `PathResolution` → `ResolvedPath`, `ProfileReport` → `ProfileResult`, `SeedDataRequiredError` → `UnresolvablePathError`. HTTP endpoints were renamed from `/dqs/*` to `/profiler/*` (`/profiler/manage/routes`, `/profiler/execute`, `/profiler/connection/health`) to give the tool a stable, brand-aligned namespace.

---

## North Star — What We're Actually Building

**The one-sentence version:** DQS turns "why is this endpoint slow, and what else in this codebase is quietly writing bad queries or doing something risky?" from a manual, browser-clicking investigation into something an AI coding agent (or a human) can drive through a Postman-style workbench or an MCP tool surface, with zero risk to the developer's real database.

**The end state, concretely:**
- **Two surfaces, one engine.** A developer opens the workbench UI, picks an endpoint from an auto-discovered sidebar, edits the request (path params, query params, headers, auth context, JSON body), and hits Execute. An AI agent in Cursor/Claude Code calls the equivalent MCP tool. Both go through the same `proxy.execute_request()` underneath.
- **User/agent-supplied payloads, not synthetic ones.** The execution proxy accepts whatever the caller wants to send. A `suggest_payload(target_id)` helper is available when the caller has no idea what to put in the body — it inspects the target's serializer and returns a JSON template, but never auto-seeds the DB.
- **Auth is first-class.** Both surfaces can impersonate any user (via `force_authenticate`), pick a session/bearer/anonymous mode, and run a **multi-role AuthZ audit** against any target — same endpoint, N different users, results returned as an access matrix.
- **Sandbox is toggleable.** DB writes are rolled back by default (zero footprint). The caller can opt out per-call when it actually wants to verify a write persisted.
- **Profile what actually ran.** The v0.25 query interceptor captures every query at the DB-driver boundary, walks the call stack to the originating file:line, and the AST analyzer flags N+1s with a prescriptive `.select_related()` / `.prefetch_related()` fix.
- **Agent closes the loop itself.** Detect N+1 → read the suggested fix → apply it → re-profile → confirm the query count dropped. No human re-testing anything by hand.

**Why this order (v0.35 → v0.4 → v0.5 → v1.0):** the workbench UI (v0.35) ships first because it's the fastest way to prove the new execution proxy works end-to-end with real requests — the UI becomes the integration test for the proxy. The MCP server (v0.4) lands next so the same engine gets an agent-facing surface. v0.5 then **introduces the hardened execution proxy and auth layer** retroactively — the UI and MCP both consume it, and the auth surface (impersonation, AuthZ audit) becomes available to both. v1.0 ships both surfaces together with auth as a first-class feature. This ordering keeps each phase demoable on its own.

**A guiding rule for whoever picks up any task below:** if you're ever unsure whether something belongs in v1 scope, ask "does this get us closer to a trustworthy, zero-risk profiling result an agent or a human can drive through the proxy?" If yes, it's in scope. If it's about polish, multi-framework support, or UI flourishes, it's very likely a "Later Release" item further down this file — check there before building it early.

---

## Why the Django/Python version floors are what they are

`pyproject.toml` currently specifies `django>=4.2` and `python>=3.10`, with no upper ceiling. This is a **deliberate reach decision, not a stability one**:

- The goal is the widest possible adoption across the existing Django community without maintaining compatibility shims for versions old enough to require special-casing.
- 4.2/3.10 is treated as the boundary before which supporting older ORM/typing behavior would meaningfully slow down development.
- The tradeoff being accepted: an open floor means a fresh install could resolve onto whatever the newest Django release is at install time, including one that later turns out to have breaking changes for DQS. That's accepted risk here, not an oversight — if it ever actually breaks something, that's the moment to add a ceiling, not before.

---

## Current Status Overview

| Phase | Description | Status |
| :--- | :--- | :--- |
| **v0.1.0** | Infra Scaffolding & Core AST Analyzer | ✅ **COMPLETED** |
| **v0.2.0** | Django Introspector & Isolated Sandbox Execution | ✅ **COMPLETED** |
| **v0.25.0** | Query Interceptor, `Target` Abstraction & Static AST Advisor | ✅ **COMPLETED** |
| **v0.3.0** | Dynamic Path Converter Engine, Mock Data Generator & Request-Body Inference | ✅ **COMPLETED** *(deprecated by v0.35 — see below)* |
| **v0.35.0** | Workbench UI + `suggest_payload()` (Human Surface) | 🔲 **PLANNED** |
| **v0.4.0** | MCP Server & Agentic Loop (Agent Surface) | 🔲 **PLANNED** |
| **v0.5.0** | Auth Impersonation, AuthZ Audit Matrix & Hardened Execution Proxy | 🔲 **PLANNED** |
| **v1.0.0** | Launch: Workbench UI + MCP + Auth, together | 🔮 **FUTURE** |

---

## v0.1.0 — Infra Scaffolding & Core AST Analyzer

> Status: COMPLETED ✅

- [x] `analyzer.py` — `fingerprint(sql)`, `detect_n_plus_one(queries, threshold)`, `suggest_fix(fingerprint, relationships)`.
- [x] `test_analyzer.py` — unit tests for literal stripping, `IN` clause collapsing, alias canonicalization, threshold detection.
- [x] Repository layout, docs, packaging spec, Docker setup.

---

## v0.2.0 — Django Introspector & Isolated Sandbox Execution

> Status: COMPLETED ✅

### Django Adapter (`dqs/adapters/drf/`)
- [x] `apps.py` — registers `dqs.adapters.django`, hard `DEBUG=True` guardrail in `ready()`.
- [x] `introspector.py` — `DjangoIntrospector.list_all_routes()`: recursively walks `url_patterns`, returns `Route` objects. Excludes `/profiler/` routes, enforces `DEBUG=True`.
- [x] `introspector.py` — FBV and CBV cases correctly return `executable=False` + `skip_reason` when methods can't be statically resolved, rather than guessing.
- [x] `introspector.py` — DRF ViewSet case (Case A) now matches the "skip, don't guess" behavior already applied to FBV/CBV.
- [x] `runner.py` — `DjangoSandboxRunner.execute_isolated()`: builds WSGI requests via `RequestFactory`, wraps execution in `transaction.atomic()`. *(Renamed to `execute_request()` in the v0.35 cleanup.)*
- [x] `runner.py` — `execute_request()` now accepts an explicit `user` parameter.

### Demo Project (`demo_project/`)
- [x] `demo_project/` settings, URLs, Postgres 16 config.
- [x] `sample_app/models.py` — `Author`, `Book`, `Publisher` with FK relationships.
- [x] `sample_app/views.py` — intentionally flawed endpoints for integration testing.

---

## v0.25.0 — Query Interceptor, `Target` Abstraction & Static AST Advisor

> Status: COMPLETED ✅

### Core (`dqs/core/`)
- [x] `targets.py` — new `Target` dataclass: `id`, `kind` (`"view" | "signal" | "task" | "consumer" | "static_only"`), `can_execute: bool`, `target_details: dict | None`, `static_findings: list`.
- [x] `static_advisor.py` — whole-project AST scanner (framework-agnostic, no execution, no DB connection required):
  - [x] ORM-call-inside-loop detection.
  - [ ] Schema-level checks (*deferred to future phase as noted in known limitations*).
  - [ ] PK strategy advice (*deferred to future phase*).
  - [x] Blocking-call detection.

### Django Adapter (`dqs/adapters/drf/`)
- [x] `query_interceptor.py` — wraps `connection.execute_wrapper()`. Captures `(sql, duration, origin_file, origin_function, origin_line)` per query by walking `inspect.stack()`.
- [x] `runner.py` — refactored `execute_request()` (was `execute_isolated`) to use `query_interceptor`; added new general-purpose `profile_callable(fn, *args, sandbox: bool = True, **kwargs)`.
- [x] Signal-receiver discovery — walked `Signal.receivers` to populate `Target(kind="signal")`.
- [x] Celery task discovery — walked `celery.app.tasks` registry to populate `Target(kind="task")`.
- [ ] WebSocket/Channels consumer discovery — (*deferred to v2.0+ scope*).

---

## v0.3.0 — Dynamic Path Converter Engine, Mock Data Generator & Request-Body Inference

> Status: COMPLETED ✅ *(deprecated by v0.35 — see Migration Notes below)*

### Django Adapter (`dqs/adapters/drf/`)
- [x] `converters.py` — parses `pattern.pattern.converters` to detect `int`, `str`, `slug`, `uuid` path converters.
- [x] `converters.py` — model resolution: explicit `view_class.queryset.model`/`view_class.model` first, FBV token-matching fallback.
- [x] `mock_generator.py` — `ModelBakeryGenerator.generate()`, Validation Recovery Flow, Uniqueness Guard, In-Memory Sample Cache. *(Deleted in the v0.35 cleanup.)*
- [x] **Path substitution helper** — pulls a real PK from a generated mock row and substitutes it into a `has_url_params: True` route.
- [x] **Request-body inference** — for POST/PUT/PATCH targets, read the view's `serializer_class` or `form_class` to determine expected field names/types to auto-populate `data=`.

### Migration Notes (superseded by v0.35)

The v0.3 deliverables above were **deleted or repurposed** as part of the v0.35 cleanup:
- **`dqs/adapters/drf/mocking/generator.py` (`ModelBakeryGenerator`)** — **deleted.** Auto-seeding the DB before each request is no longer the default execution strategy. Auto-seeding polluted query counts, made destructive endpoints risky even in a sandbox, and forced the agent into a synthetic-data worldview.
- **`body_inferrer.infer_request_body()`** — **deleted.** Payloads are now caller-supplied via `POST /profiler/execute`. A `suggest_payload()` helper for serializer-derived templates is **deferred to a later release**, not part of v0.35.
- **`PathConverterResolver`** — **kept, refactored.** Path-parameter resolution remains useful (the UI and the agent both need to render concrete URLs like `/books/42/`), but it no longer falls back to auto-seeding when no record exists — it returns `ResolvedPath(url=None, reason="no_record_found")` and asks the caller to pick a row or provide a value.
- **`DjangoSandboxRunner.execute_request()`** *(was `execute_isolated`)* — the public runner method that both surfaces call today. v0.5 will keep this as the low-level engine and wrap it in a new `execution/proxy.py` orchestration layer.

---

## v0.35.0 — Workbench UI + Code Cleanup (Human Surface)

> Status: PLANNED 🔲 (code-cleanup portion ✅ COMPLETED — see `Migration Notes` above)
> **Why this comes first:** the workbench UI is the fastest way to prove the new payload-driven execution model end-to-end with real requests. The UI becomes the integration test for the proxy. Once the UI drives requests through the engine cleanly, we know exactly what surface the MCP server needs to expose.

### A. Backend cleanup — ✅ COMPLETED
- [x] **Delete** `dqs/adapters/drf/mocking/` directory (`generator.py`, `__init__.py`, any related test fixtures).
- [x] **Delete** `dqs/adapters/drf/body_inferrer.py` — payloads are now caller-supplied via `POST /profiler/execute`.
- [x] **Delete** `dqs/adapters/drf/process_log.py` — the noisy step-by-step logger; the runner's flow is now linear and self-explanatory.
- [x] **Delete** the auto-seeding `setup` parameter from `runner.profile_callable()`; replace with a clean `sandbox: bool = False` toggle.
- [x] **`PathConverterResolver.resolve()`** — returns `ResolvedPath(url=None, reason="no_record_found")` instead of auto-seeding when no record exists and no explicit value was provided.
- [x] **Rename** all stale types in `dqs/adapters/drf/types.py` — `RouteMetadata` → `Route`, `PathParam` → `UrlParam`, `PathResolution` → `ResolvedPath`, `ProfileReport` → `ProfileResult`, `SeedDataRequiredError` → `UnresolvablePathError`.
- [x] **Rename** HTTP endpoints from `/dqs/*` to `/profiler/*` (`/profiler/manage/routes`, `/profiler/execute`, `/profiler/connection/health`).
- [x] **Update tests** — remove mock-data tests, fix bad imports, update to renamed types.
- [x] **Update frontend** — endpoint paths, vite proxy, empty-state placeholders.

### B. Workbench UI request builder in `fe/`
- [ ] **Route sidebar** (already exists, mostly works): searchable, filterable list of all discovered `Target(kind="view")` records, grouped by app/module. Show kind badge (view / signal / task) so non-view targets surface too.
- [ ] **Request builder panel** (new):
  - Method picker (auto-derived from the route's allowed methods, editable).
  - Path params editor (auto-populated from converters; "Pick existing record" button calls the proxy's record-lookup helper).
  - Query params editor (key/value pairs).
  - Headers editor (key/value pairs; pre-populated with content-type hints).
  - **Auth & Impersonation** section (placeholder for v0.5, but the panel exists now and ships with "Session: anonymous" by default).
  - **Body editor** — Monaco/CodeMirror JSON editor. The user types the body directly; a future `suggest_payload()` helper will be the "Populate from schema" button.
  - **Sandbox toggle** (placeholder for v0.5; ships checked by default, with a tooltip explaining what it does).
  - **Execute button** — calls `POST /profiler/execute` and renders the `ProfileResult`.
- [ ] **Response + Profiler panel** (already partially exists):
  - Status, time, query count, duplicate count.
  - Response body (formatted JSON).
  - SQL trace (one row per query, with file:line, duration, "copy" button).
  - N+1 warnings with copy-pasteable fix suggestions.
- [ ] **Persistence**: save request collections to localStorage so the developer can build up a library of common test cases.
- [ ] **Keyboard shortcuts** (already exists): `/` focus, `Enter` execute, `Cmd/Ctrl+B` sidebar, etc.

### C. Tests
- [ ] `fe/` component tests for the new request builder panels.
- [ ] Integration test: `runner.execute_request()` returns a valid `ProfileResult` with `metrics`, `queries`, `analysis` populated.

---

## v0.4.0 — MCP Server & Agentic Loop (Agent Surface)

> Status: PLANNED 🔲
> **Why this comes second:** the workbench UI in v0.35 has proven the request-shape contract. The MCP server just exposes that same contract as tools an agent can call. The agent becomes the primary consumer of the engine, with a human occasionally driving the UI to inspect what the agent did.

### MCP Layer (`dqs/mcp/`)
- [ ] `server.py` — native MCP server (`mcp` SDK, stdio and/or SSE transport).
- [ ] **MCP Tools** (the agent's interface to the engine):
  - `list_targets` — returns all discovered `Target` records with their kinds, static findings, and **target_details**. *(unchanged from prior plan)*
  - `get_static_findings` — returns the static AST findings for a target or for the whole project. *(unchanged)*
  - `suggest_payload(target_id)` — calls the v0.35 payload suggester. Lets the agent ask "what would a sensible JSON body look like for this endpoint?" without writing to the DB.
  - `execute_request(target_id, payload, headers, query_params, path_params, user_context, sandbox)` — runs a request through the engine. Returns HTTP response + SQL trace + N+1 flags. **Replaces** the old `profile_target` tool — the agent now builds its own payloads instead of having the engine synthesize them.
  - `audit_authz(target_id, user_ids[])` — **new in this pivot.** Runs the same target under N different user contexts and returns an access matrix (see v0.5 for the full implementation; this tool is registered here so agents can start using it as soon as v0.5 lands).
  - `apply_fix(target_id, fix_type, params)` — **new.** Lets the agent read a `suggest_fix()` output and apply it (e.g. add `.select_related('author')` to a queryset). Uses AST-level source edits, not string replacement, so it's safe to re-apply.
- [ ] **MCP Resources & Prompts**:
  - Resource: `profiler://targets` — the live target list.
  - Resource: `profiler://target/{id}` — a single target's full metadata + static findings.
  - Prompt: `fix_n_plus_one` — standard prompt template: "Here are the N+1 findings from this profile run, here are the suggested fixes, pick one, apply it via `apply_fix`, then re-profile to verify."
  - Prompt: `audit_endpoint_access` — standard prompt template for AuthZ audits.

### Out of scope for v0.4 (deferred to v0.5 or later)
- [ ] `seed_mock_data` tool — **deleted from the planned surface.** Auto-seeding is gone; the agent builds its own payloads via `suggest_payload` or hand.
- [ ] User impersonation internals — `audit_authz` is **registered** here but its implementation lands in v0.5. Until v0.5 ships, the tool returns `501 Not Implemented` with a clear message.

### Tests
- [ ] `tests/mcp/` — tool-level contract tests using the `mcp` SDK's test client.
- [ ] End-to-end agent loop test: feed a fake N+1 view to the engine, simulate an agent calling `list_targets` → `execute_request` → reading the N+1 warning → calling `apply_fix` → re-running `execute_request` → asserting the query count dropped.

---

## v0.5.0 — Auth Impersonation, AuthZ Audit Matrix & Hardened Execution Proxy

> Status: PLANNED 🔲
> **Why this comes third:** the workbench UI and the MCP server both exist, but they're currently calling `DjangoSandboxRunner.execute_request()` directly. v0.5 introduces the proper **execution proxy** (`dqs/adapters/drf/execution/proxy.py`) that both surfaces consume going forward, plus the entire auth surface (impersonation, AuthZ audit) that the UI's placeholder panel and the MCP's `audit_authz` tool have been waiting for.

### A. Execution Proxy (`dqs/adapters/drf/execution/proxy.py`) — *new module*
- [ ] `ExecutionProxy.execute_request(request: ProxyRequest) -> ProfileResult` — single entry point for both UI and MCP.
  - `ProxyRequest`: `target_id`, `method`, `path_params`, `query_params`, `headers`, `body`, `user_context` (user_id OR `Anonymous` OR `Impersonate(user_id)`), `sandbox: bool = True`, `auth_mode: Literal["session", "bearer", "anonymous"] = "session"`.
  - Returns the same `ProfileResult` shape that `DjangoSandboxRunner.execute_request()` already returns today.
- [ ] Internally calls `runner.profile_callable()` — the proxy is the orchestration layer, the runner stays the low-level engine.
- [ ] Per-call sandbox toggle (`sandbox=True` wraps in `transaction.atomic()` with rollback; `sandbox=False` lets writes persist — for when the agent wants to verify a POST actually created a row).
- [ ] Validates the `target_id` resolves to a known `Route`, the method is in the target's allowed methods, and the path params match the converters (no auto-seeding — reports `400` with a clear reason if a path param can't be resolved).
- [ ] Thread-safe under concurrent UI/MCP calls (the proxy is stateless; each call opens its own transaction + interceptor).
- [ ] HTTP endpoint: `POST /profiler/execute` is already in place; v0.5 wires the view layer to the new proxy instead of calling the runner directly.

### B. Auth Impersonation (`dqs/adapters/drf/auth/impersonation.py`) — *new module*
- [ ] `build_request_with_user(request, user_context, auth_mode)` — given a constructed WSGI request, attach the right auth:
  - `auth_mode="session"` + `user_context=Impersonate(user_id)` → `request.user = User.objects.get(pk=user_id)` and `force_authenticate(request, user=user)`.
  - `auth_mode="bearer"` + `user_context=Impersonate(user_id)` → generate a DRF token for the user, attach `Authorization: Token <token>` header.
  - `auth_mode="anonymous"` → leave `request.user = AnonymousUser()`, no `force_authenticate`.
  - `user_context=Anonymous` → same as `anonymous` regardless of `auth_mode`.
- [ ] **User picker UI data** — new endpoint `GET /profiler/manage/users` returning a paginated, filterable list of `User` rows (`is_active=True`, optional `group`, `is_superuser` filters). Used by both the UI's impersonation dropdown and the MCP agent's user discovery.
- [ ] No network roundtrip for token generation — `force_authenticate` short-circuits the auth backend entirely, so impersonation is instant.

### C. AuthZ Audit Matrix (`dqs/adapters/drf/auth/audit.py`) — *new module*
- [ ] `audit_authz(target_id, user_ids[]) -> AccessMatrix`:
  - Iterates the target's allowed methods.
  - For each `(method, user_id)` pair, runs `proxy.execute_request()` with that user context.
  - Each pair runs in its **own** atomic transaction (so user A's state can't leak into user B's profile).
  - Returns a matrix:
    ```
    | Method | Role / User       | Status | Result              |
    |--------|-------------------|--------|---------------------|
    | POST   | Anonymous         | 401    | Passthrough         |
    | POST   | Standard User     | 403    | Passthrough         |
    | POST   | Store Manager     | 201    | Passthrough         |
    | POST   | Admin             | 201    | Passthrough         |
    | GET    | Anonymous         | 200    | ⚠️ Permission Leak   |
    ```
  - Flags any unexpected status as a **Permission Leak** or **Over-Restriction**.
- [ ] HTTP endpoint: `POST /profiler/audit` taking `{ "target_id": ..., "user_ids": [...] }`.
- [ ] MCP `audit_authz` tool (registered in v0.4) becomes fully functional.

### D. Wire both surfaces to the proxy
- [ ] `fe/` request builder — replace the direct `runner.execute_request()` call with `POST /profiler/execute` through the new proxy. The Auth & Impersonation panel becomes live (Session / Bearer / Anonymous + user picker).
- [ ] MCP `execute_request` tool — the proxy's request shape already matches what the MCP tool returns; the MCP tool just calls the proxy directly instead of the runner.

### E. Tests
- [ ] `tests/adapters/drf/test_proxy.py` — request-shape contract, sandbox toggle behavior, method validation, path-param validation, concurrent-call safety.
- [ ] `tests/adapters/drf/auth/test_impersonation.py` — each auth mode, anonymous handling, missing-user error.
- [ ] `tests/adapters/drf/auth/test_audit.py` — matrix generation, leak detection, transaction isolation between roles.
- [ ] End-to-end: UI fires a request through the proxy, MCP fires the same request, results match byte-for-byte.

---

## v1.0.0 — Launch: Workbench UI + MCP + Auth

> Status: FUTURE 🔮

- [ ] Production-ready build of `fe/` with optimized bundle, error boundaries, telemetry-free deployment.
- [ ] MCP server with both stdio and SSE transports documented and tested across Cursor, Claude Code, and Windsurf.
- [ ] Auth (impersonation + AuthZ audit) shipped and discoverable in both surfaces from day one.
- [ ] Comprehensive end-to-end docs: quickstart, "How to use the workbench," "How to wire the MCP server into your IDE," "How to write an agentic loop against the MCP tools."
- [ ] Demo video showing an AI agent autonomously detecting an N+1, applying the fix, and re-verifying.
- [ ] PyPI release: `da-profiler>=1.0.0` with the full surface area.

---

## Later Releases (v2.0+)

> Status: FUTURE 🔮

- **FastAPI / SQLAlchemy Adapter** — second concrete framework adapter. The `proxy` abstraction in v0.5 is framework-agnostic in shape, so this becomes mostly an adapter problem.
- **Abstract Base Classes (`BaseProxy`, `BaseRunner`, `BaseInterceptor`)** — formalize adapter contracts once adapter #2 actually exists to generalize from.
- **Postman-spec import** — read a Postman collection JSON and seed the workbench's saved-request library. Convenience only; not core to the engine.
- **OpenAPI integration** — alternate route discovery source via `drf-spectacular` schema parsing, supplementing the URL-resolver tree walk.
- **Workbench collections sharing** — export/import a `profiler_collections.json` between developers.
- **Workbench environment variables** — `{{base_url}}`, `{{token}}` style substitution, Postman-style.
- **Workbench request history** — show the last N executions per target, diff query counts across runs.
- **Terminal CLI linter** — `dqs scan` / `dqs check --max-queries-per-route=N` for CI gating. Uses the same proxy under the hood but with no UI.
- **Schema-level static advisor checks** — cross-reference `Meta.indexes`/`db_index` against `.filter()`/`.exclude()`/`.order_by()` call sites (deferred from v0.25).
- **PK strategy advice** — flag auto-increment integer PKs on write-heavy models, suggest UUIDv7 (deferred from v0.25).
- **WebSocket / Channels execution support** — discovery exists as of v0.25 (`Target(kind="consumer", can_execute=False)`), but no execution path. A fundamentally different trigger mechanism than `RequestFactory`/direct-call is needed — genuinely v2 scope.
- **Signal & Celery task execution paths** — `target_details` from v0.25 lets us synthesize signal-firing events and invoke tasks by name, but the actual invocation code is not built. Needed for the workbench to support non-view targets beyond static analysis.
