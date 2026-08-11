# Da Profiler — Architecture & System Design 🏗️

> **Da Profiler** (package `dqs`) is an isolated query profiling engine and static code advisor for Django applications, exposed through **two surfaces**: a Postman-style workbench UI for humans (`fe/`) and an MCP server for AI agents (`dqs/mcp/`). Both surfaces drive the same **execution proxy** (`dqs/adapters/drf/execution/proxy.py`), which accepts user/agent-supplied payloads, runs them inside a toggleable atomic-rollback sandbox, intercepts queries at the DB-driver boundary, and normalizes SQL via AST fingerprinting to detect N+1 bottlenecks. Static code analysis runs against the whole codebase without execution.

---

## 1. Core Architectural Principles

Da Profiler is built around four fundamental design principles:

1. **Framework-Agnostic Core (`dqs/core/`)**:
   - The core engine contains **zero Django or framework-specific imports**.
   - Handles SQL AST fingerprinting (`sqlglot`), N+1 aggregation algorithms, target abstractions (`Target`), and framework-independent static AST code scanning (`StaticASTAdvisor`).

2. **Single Execution Engine, Two Surfaces**:
   - One engine (`dqs/adapters/drf/execution/`) is consumed by two surfaces:
     - The **workbench UI** (`fe/`) — human-facing, Postman-style request builder + response/SQL viewer.
     - The **MCP server** (`dqs/mcp/`) — agent-facing, exposes the engine as MCP tools.
   - Both surfaces call the **execution proxy** (`proxy.execute_request()`) — never the low-level runner directly. The proxy owns the request-shape contract; the runner is the internal engine.

3. **User/Agent-Supplied Payloads, Not Synthetic Ones**:
   - The execution proxy accepts whatever the caller wants to send.
   - A lean `payload_suggester.suggest_payload(target_id)` helper inspects the target's serializer and returns a JSON template as a *starting point* — it never writes to the DB.
   - The v0.3 mock-data generator and request-body inferrer are **deleted** in v0.35. Auto-seeding the DB before each request was the wrong abstraction: it polluted query counts, made destructive endpoints risky even in a sandbox, and forced both surfaces into a synthetic-data worldview.

4. **Zero Database Risk by Default, Toggleable When Needed**:
   - Profiled requests run inside `transaction.atomic()` savepoints and roll back automatically — the real database is never modified.
   - The caller can opt out per-call (`sandbox: False` in the proxy request) when it actually wants to verify a write persisted (e.g. the agent confirming a POST created a row).

---

## 2. System Component Overview

```
                        +-------------------+    +-------------------+
                        |  Workbench UI     |    |   MCP Server      |
                        |  (fe/) — human    |    |   (dqs/mcp/) —    |
                        |                   |    |   agent surface   |
                        +---------+---------+    +---------+---------+
                                  |                        |
                                  |  POST /dqs/api/...    |
                                  +-----------+------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------+
|                          Django Adapter (dqs/adapters/drf/)                       |
|                                                                                   |
|  +------------------------+    +-------------------------+    +----------------+  |
|  |   Execution Proxy      |    |      Auth Layer         |    | Target Discov. |
|  |  (execution/proxy.py)  | -- | (auth/impersonation.py, | -- | (discovery.py) |
|  |                        |    |  auth/audit.py)         |    |               |
|  +----------+-------------+    +-------------------------+    +----------------+  |
|             |                                                                |
|             v                                                                |
|  +------------------------+    +-------------------------+    +----------------+  |
|  |  Sandbox Runner        |    |   Query Interceptor     |    | Payload Suggs. |
|  |  (execution/runner.py) | -- | (query_interceptor.py)  |    |(payload_       |
|  |                        |    |                         |    | suggester.py)  |
|  +------------------------+    +-------------------------+    +----------------+  |
|                                                                                  |
+-----------------------------------------------------------------------------------+
              |                            |                          |
              v                            v                          v
+-----------------------------------------------------------------------------------+
|                              Da Profiler Core (dqs/core/)                          |
|                                                                                   |
|  +---------------------+   +--------------------------+   +--------------------+  |
|  |     Target Model    |   |     Static AST Advisor   |   |   AST Analyzer     |  |
|  |     (targets.py)    |   |   (static_advisor.py)    |   |   (analyzer.py)    |  |
|  +---------------------+   +--------------------------+   +--------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. High-Level Component Breakdown

### A. Core Engine (`dqs/core/`)

#### 1. `analyzer.py` (AST SQL Analyzer & N+1 Detector)
- **`fingerprint(sql)`**: Leverages `sqlglot` to parse raw SQL queries into ASTs. It strips dynamic literals (e.g. IDs, strings), normalizes dynamic `IN (...)` parameter lists, and canonicalizes table aliases (`T0`, `T1`).
- **`detect_n_plus_one(queries, threshold)`**: Groups queries by a composite key of `(SQL Fingerprint, source_location)` and flags N+1 patterns that exceed the threshold.
- **`suggest_fix(fingerprint, relationships)`**: Generates copy-pasteable Django ORM fixes (such as `.select_related()` or `.prefetch_related()`) that the workbench renders and the MCP `apply_fix` tool applies.

#### 2. `targets.py` (Unified Target Dataclass)
- Defines the `Target` dataclass (`id`, `kind`, `triggerable`, `trigger_spec`, `static_findings`).
- Provides a unified shape for HTTP views, signals, Celery tasks, and background functions, consumed identically by the workbench sidebar and the MCP `list_targets` tool.

#### 3. `static_advisor.py` (Framework-Agnostic AST Advisor)
- Scans user python code statically without importing or executing it.
- **ORM Call in Loop**: Detects `.filter()`, `.get()`, `.all()` calls inside `for` loops.
- **Blocking Calls**: Detects synchronous I/O (`requests.get`, `smtplib.SMTP`, `time.sleep`) and resolves `import X as Y` and `from X import Y` aliases.

### B. Django Adapter (`dqs/adapters/drf/`)

#### 1. `execution/proxy.py` (Execution Proxy — *new in v0.5*)
- **`execute_request(request: ProxyRequest) -> ProxyResponse`**: The **single entry point** for both the workbench UI and the MCP server.
- Validates the `target_id` resolves to a known `Target`, the method is allowed, and the path params match the converters (no auto-seeding — returns a clear `400` if a path param can't be resolved).
- Honors the per-call `sandbox: bool` toggle (default `True`).
- Attaches the requested user context via the auth layer, then dispatches to `SandboxRunner` underneath.

#### 2. `auth/impersonation.py` (Role Impersonation — *new in v0.5*)
- **`build_request_with_user(request, user_context, auth_mode)`**: Given a constructed WSGI request, attaches the right auth:
  - `auth_mode="session"` + `user_context=Impersonate(user_id)` → `request.user = User.objects.get(pk=user_id)` and `force_authenticate(request, user=user)`.
  - `auth_mode="bearer"` → generate a DRF token for the user, attach `Authorization: Token <token>` header.
  - `auth_mode="anonymous"` → leave `request.user = AnonymousUser()`.
- Powers the workbench's "Act As" dropdown and the MCP `execute_request` tool's `user_context` argument.

#### 3. `auth/audit.py` (AuthZ Audit Matrix — *new in v0.5*)
- **`audit_authz(target_id, user_ids[]) -> AccessMatrix`**: Runs the same target under N different user contexts in isolated transactions and returns a status matrix. Flags unexpected statuses as **Permission Leaks** or **Over-Restrictions**.
- Powers the workbench's "Audit Endpoint Access" button and the MCP `audit_authz` tool.

#### 4. `execution/discovery.py` (Target Discovery Engine)
- Discovers URL endpoints (`DjangoIntrospector`), Django signals (`post_save`, `pre_save`, `post_delete`), Celery tasks, and Channels ASGI consumers.
- Integrates static schema advisor checks (`schema_advisor.py`) for PK strategies and missing index detection.
- Populates `Target` instances and passes callables through `StaticASTAdvisor`. Consumed identically by the workbench sidebar and the MCP `list_targets` tool.

#### 5. `routing/introspector.py` (Route & URL Introspector)
- Recursively walks Django's `urlpatterns` tree.
- Categorizes views into DRF `ViewSet`, `APIView`, or standard Django function/class-based views.
- Safely reports `executable=False` when routes cannot be resolved statically.

#### 6. `execution/query_interceptor.py` (DB-Driver Boundary Interceptor)
- Context manager hooking into Django's `connection.execute_wrapper()`.
- Captures SQL, execution duration, and walks `inspect.stack()` to attribute each query to exact user code line numbers.
- Lives below the proxy — both surfaces benefit transparently because the proxy attaches it inside `profile_callable()`.

#### 7. `routing/converters.py` (Dynamic Path Converter Resolver)
- Extracts URL path converters (`int`, `slug`, `uuid`, `str`, `path`).
- Resolves path parameters against real DB rows first (`Model.objects.first()`); if no row exists and no explicit value is provided, returns `None` with `reason="no_record_found"` rather than auto-seeding.
- Deterministic fallback values (`int -> 1`, `uuid -> "123e4567-..."`, `slug -> "test-slug"`) are still available but are opt-in via `allow_synthetic_paths: bool = False` for tests/dev only.

#### 8. `payload_suggester.py` (Payload Suggester — *new in v0.35, replaces `mocking/`*)
- **`suggest_payload(target_id) -> { template, notes, warnings }`**: Inspects the target view's `serializer_class` / `get_serializer_class()` / `form_class` and returns a structured JSON template.
- Maps serializer field types (`CharField`, `EmailField`, `SlugField`, `IntegerField`, `DecimalField`, `DateTimeField`, `ChoiceField`, `PrimaryKeyRelatedField`, `NestedSerializer`, `JSONField`, `BooleanField`, `UUIDField`) to realistic placeholder values.
- Accepts an optional `field_overrides: dict` so the UI can pre-fill known values (e.g. the selected user's PK for `PrimaryKeyRelatedField`).
- **Never writes to the DB.** Powers the workbench's "Populate from schema" button and the MCP `suggest_payload` tool.

#### 9. `execution/runner.py` (Sandbox Execution Engine — low-level, called by the proxy)
- **`profile_callable(fn, *args, **kwargs)`**: Runs callables inside a `transaction.atomic()` savepoint with the `QueryInterceptor` active. This is the engine the proxy calls — both UI and MCP requests go through it transparently.
- **`execute_isolated()`**: Remains as a thin convenience wrapper that builds a request via `RequestFactory` and calls `profile_callable()`. Used internally by the proxy; not the public surface for v0.35+.

#### 10. `execution/schema_advisor.py` (Schema & Index Advisor)
- Analyzes Django ORM models to detect auto-increment PK strategies (recommends UUIDv7).
- Cross-references queried fields against model indexes to flag missing indexes.

### C. MCP Server (`dqs/mcp/` — *new in v0.4*)

- **`server.py`**: Native MCP server using the `mcp` SDK, exposing the engine over stdio and/or SSE transports.
- **Tools**: `list_targets`, `get_static_findings`, `suggest_payload`, `execute_request`, `audit_authz`, `apply_fix`.
- **Resources & Prompts**: `dqs://targets` resource, `fix_n_plus_one` and `audit_endpoint_access` prompt templates.
- Consumed by Cursor, Claude Code, Windsurf, and any other MCP-compatible IDE agent.

### D. Workbench UI (`fe/` — *promoted to primary human surface in v0.35*)

- React 18 + Vite + Tailwind CSS, dark Postman-inspired theme.
- Three-pane layout: route sidebar (left), request builder (center top), response + profiler (center bottom).
- Calls `/dqs/api/execute/`, `/dqs/api/audit/`, `/dqs/api/users/`, `/dqs/api/suggest-payload/` — the same HTTP surface the MCP server calls internally.
- See [`fe/README.md`](./fe/README.md) for component-level details.

---

## 4. Directory Structure Overview

```
dqs/
├── __init__.py
├── core/                              # Framework-agnostic engine (zero Django imports)
│   ├── analyzer.py                    # sqlglot-based SQL AST fingerprinting & N+1 detection
│   ├── static_advisor.py              # Pure AST static code scanner (loops, blocking I/O)
│   └── targets.py                     # Unified Target dataclass
├── adapters/
│   └── drf/                           # Django & DRF adapter
│       ├── __init__.py
│       ├── apps.py                    # DQS Django AppConfig (DEBUG guard)
│       ├── router.py                  # Shadow DB router & profiling_session context manager
│       ├── types.py                   # Shared dataclasses (ProxyRequest, ProxyResponse, AccessMatrix, ...)
│       ├── views.py                   # HTTP endpoints (/dqs/api/execute/, /dqs/api/audit/, /dqs/api/users/, /dqs/api/suggest-payload/)
│       ├── urls.py                    # URL configuration for the HTTP surface
│       ├── database/
│       │   └── db_manager.py          # Shadow DB validation & migration runner
│       ├── routing/
│       │   ├── introspector.py        # URL route pattern tree walker
│       │   └── converters.py          # Dynamic path parameter resolver (no auto-seeding)
│       ├── auth/                      # NEW in v0.5
│       │   ├── impersonation.py       # Session / Bearer / Anonymous user context injection
│       │   └── audit.py               # Multi-role AuthZ matrix runner
│       ├── payload_suggester.py       # NEW in v0.35 (replaces mocking/) — serializer→JSON template
│       └── execution/
│           ├── discovery.py           # Target discovery (views, signals, tasks, consumers)
│           ├── query_interceptor.py   # DB connection.execute_wrapper hook + QueryAnalysisEngine
│           ├── runner.py              # Savepoint execution & callable profiling (low-level engine)
│           ├── proxy.py               # NEW in v0.5 — single entry point for UI + MCP
│           └── schema_advisor.py      # Database schema & PK strategy recommendations
└── mcp/                               # NEW in v0.4
    ├── server.py                      # MCP server (stdio + SSE) + tool definitions
    └── tools/                         # Tool implementations grouped by concern
fe/                                    # React/Vite workbench UI (human surface)
```

> **Note:** The `dqs/adapters/drf/mocking/` directory and the `body_inferrer.py` module are **deleted** in v0.35. Their logic is folded into `payload_suggester.py`; their auto-seeding behavior is intentionally not preserved.

---

## 5. Class Sequence Diagrams

### 5.1 Core Classes

#### 5.1.1 `dqs.core.targets.Target` (Dataclass)

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Target as Target Dataclass

    Client->>Target: Create Target(id, kind, triggerable, trigger_spec, static_findings)
    Note right of Target: Fields:<br/>- id: str (e.g. "view:/api/books/")<br/>- kind: Literal["view","signal","task","consumer","static_only"]<br/>- triggerable: bool<br/>- trigger_spec: dict | None<br/>- static_findings: list[dict]
    Target-->>Client: Returns Target instance
```

#### 5.1.2 `dqs.core.analyzer.AST Analyzer`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Analyzer as analyzer.py Functions
    participant SQLGlot as sqlglot Parser

    Client->>Analyzer: fingerprint(raw_sql)
    Analyzer->>SQLGlot: parse_one(raw_sql)
    SQLGlot-->>Analyzer: Parsed AST
    Analyzer->>Analyzer: Strip literals to "?"
    Analyzer->>Analyzer: Collapse IN(...) to "?"
    Analyzer->>Analyzer: Canonicalize table aliases (T0, T1)
    Analyzer->>Analyzer: Sort WHERE conditions
    Analyzer-->>Client: Normalized SQL fingerprint string

    Client->>Analyzer: detect_n_plus_one(queries, threshold)
    Analyzer->>Analyzer: fingerprint() each query
    Analyzer->>Analyzer: Group by fingerprint
    Analyzer->>Analyzer: Filter groups >= threshold
    Analyzer->>Analyzer: suggest_fix() for each flagged group
    Analyzer-->>Client: List of N+1 flags with suggestions
```

#### 5.1.3 `dqs.core.static_advisor.StaticASTAdvisor`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Advisor as StaticASTAdvisor
    participant AST as Python AST Parser

    Client->>Advisor: StaticASTAdvisor(source_code, filename)
    Client->>Advisor: run()
    Advisor->>AST: ast.parse(source_code)
    AST-->>Advisor: AST Tree

    loop Visit AST Nodes
        Advisor->>Advisor: visit_Import / visit_ImportFrom
        Note right of Advisor: Build import_map for alias resolution

        Advisor->>Advisor: visit_For / visit_AsyncFor / visit_While
        Note right of Advisor: Track _loop_depth++

        Advisor->>Advisor: visit_Call
        Note right of Advisor: Check ORM call in loop<br/>Check blocking I/O calls<br/>Collect queried fields
    end

    Advisor-->>Client: List of findings (ORM_CALL_IN_LOOP, BLOCKING_EXTERNAL_CALL)
```

---

### 5.2 Django Adapter Classes

#### 5.2.1 `dqs.adapters.drf.routing.introspector.DjangoIntrospector`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Introspector as DjangoIntrospector
    participant Django as Django URL Resolver
    participant RouteMeta as RouteMetadata

    Client->>Introspector: DjangoIntrospector()
    Note right of Introspector: Validates DEBUG=True

    Client->>Introspector: list_all_routes()
    Introspector->>Django: get_resolver().url_patterns
    Django-->>Introspector: Root URL patterns

    loop Recursive _extract_patterns
        Introspector->>Introspector: _get_clean_path() - normalize route
        alt URLResolver
            Introspector->>Introspector: Recurse into url_patterns
        else URLPattern
            Introspector->>Introspector: _analyze_view()
            Note right of Introspector: Extract model via 5 strategies<br/>Extract path params<br/>Extract lookup_map<br/>Determine view_type & executable
            Introspector->>RouteMeta: Create RouteMetadata
            RouteMeta-->>Introspector: RouteMetadata instance
            Introspector->>Introspector: Append to routes list
        end
    end

    Introspector-->>Client: List[RouteMetadata]
```

#### 5.2.2 `dqs.adapters.drf.routing.converters.PathConverterResolver`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Resolver as PathConverterResolver
    participant Django as Django ORM
    participant RouteMeta as RouteMetadata

    Client->>Resolver: build_executable_url(route, explicit_params, allow_synthetic_paths=False)
    Resolver->>Resolver: resolve_params_for_route()
    Note right of Resolver: Get missing params from route.path_params

    alt Has target_model
        Resolver->>Django: Query model.objects.first() (shadow or default DB)
        alt Record exists
            Django-->>Resolver: Model instance
            Resolver->>Resolver: extract_from_model_instance() using lookup_map
        else No record & explicit_params provided
            Resolver->>Resolver: Use explicit value
        else No record & allow_synthetic_paths=True
            Note right of Resolver: Deterministic fallback value<br/>(int → 1, uuid → fixed UUID, slug → "test-slug")<br/>Tests/dev only — not the default
            Resolver->>Resolver: Use synthetic fallback
        else No record & nothing provided
            Resolver-->>Client: Return None with reason="no_record_found"
        end
    end

    Resolver->>Resolver: render_concrete_url() via reverse() or regex substitution
    Resolver-->>Client: (concrete_url, resolved_params, source)
```

#### 5.2.3 `dqs.adapters.drf.payload_suggester.PayloadSuggester`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code (UI or MCP)
    participant Suggester as PayloadSuggester
    participant Discovery as DjangoTargetDiscovery
    participant View as Target View

    Client->>Suggester: suggest_payload(target_id, field_overrides=None)
    Suggester->>Discovery: resolve_target(target_id)
    Discovery-->>Suggester: Target(view_class, ...)

    Suggester->>View: view_class.get_serializer_class() or serializer_class
    View-->>Suggester: Serializer instance

    loop Each serializer field
        Suggester->>Suggester: Map field type → placeholder value
        Note right of Suggester: CharField → "Sample X"<br/>EmailField → "user@example.com"<br/>IntegerField → 1<br/>DecimalField → "0.00"<br/>ChoiceField → first choice<br/>PrimaryKeyRelatedField → 1 (or override)<br/>NestedSerializer → recurse
        alt field_overrides provided
            Suggester->>Suggester: Apply override value
        end
    end

    Suggester->>Suggester: Collect notes & warnings
    Suggester-->>Client: { template: {...}, notes: [...], warnings: [...] }
```

#### 5.2.4 `dqs.adapters.drf.execution.query_interceptor.QueryInterceptor`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code (proxy/runner)
    participant Interceptor as QueryInterceptor
    participant DjangoDB as django.db.connection
    participant Stack as inspect.stack()

    Client->>Interceptor: with QueryInterceptor() as interceptor:
    Interceptor->>DjangoDB: connection.execute_wrapper(_wrapper)

    loop Each SQL Query Execution
        DjangoDB->>Interceptor: _wrapper(execute, sql, params, many, context)
        Interceptor->>Interceptor: start_time = perf_counter()
        Interceptor->>DjangoDB: execute(sql, params, many, context)
        DjangoDB-->>Interceptor: Query result
        Interceptor->>Interceptor: duration = perf_counter() - start_time
        Interceptor->>Stack: inspect.stack()
        Stack-->>Interceptor: Call frames
        Interceptor->>Interceptor: _extract_source_location() - skip framework frames
        Interceptor->>Interceptor: Append {sql, time_ms, src_loc} to captured_queries
    end

    Client->>Interceptor: Exit context manager
    Interceptor->>DjangoDB: __exit__ - remove wrapper
    Interceptor-->>Client: captured_queries available
```

#### 5.2.5 `dqs.adapters.drf.execution.query_interceptor.QueryAnalysisEngine`

```mermaid
sequenceDiagram
    autonumber
    participant Runner as SandboxRunner / Proxy
    participant Engine as QueryAnalysisEngine
    participant Analyzer as dqs.core.analyzer

    Runner->>Engine: build_result(target, status_code, queries_captured, http_response)
    Engine->>Engine: parse_response_body() - extract JSON from response

    loop Format each query
        Engine->>Analyzer: fingerprint(q.sql)
        Analyzer-->>Engine: Normalized fingerprint
        Engine->>Engine: Build formatted_queries list
    end

    Engine->>Analyzer: detect_n_plus_one(formatted_queries, threshold=3)
    Analyzer-->>Engine: N+1 flags with suggestions
    Engine->>Engine: Calculate metrics (total_time, db_time, query_count, unique_fingerprints)
    Engine->>Engine: Build ProxyResponse dataclass
    Engine-->>Runner: ProxyResponse
```

#### 5.2.6 `dqs.adapters.drf.execution.runner.DjangoSandboxRunner`

```mermaid
sequenceDiagram
    autonumber
    participant Proxy as ExecutionProxy
    participant Runner as DjangoSandboxRunner
    participant Router as profiling_session / DQSRouter
    participant Converter as PathConverterResolver
    participant Interceptor as QueryInterceptor
    participant Analysis as QueryAnalysisEngine
    participant Django as Django / DRF

    Proxy->>Runner: profile_callable(_build_and_dispatch_request, request, target, user_context)
    Runner->>Router: with profiling_session() if sandbox=True

    alt sandbox=True
        Runner->>Django: transaction.atomic() + savepoint()
        Runner->>Interceptor: with QueryInterceptor():
        Runner->>Django: Dispatch RequestFactory request to view
        Interceptor-->>Runner: captured_queries, db_duration
        Runner->>Django: savepoint_rollback()
    else sandbox=False
        Runner->>Interceptor: with QueryInterceptor():
        Runner->>Django: Dispatch RequestFactory request to view
        Interceptor-->>Runner: captured_queries, db_duration
        Note right of Runner: Writes persist — caller opted out of rollback
    end

    Runner->>Analysis: build_result(target, queries, http_response)
    Analysis-->>Runner: ProxyResponse
    Runner-->>Proxy: ProxyResponse
```

#### 5.2.7 `dqs.adapters.drf.execution.proxy.ExecutionProxy` *(new in v0.5)*

```mermaid
sequenceDiagram
    autonumber
    participant UI as Workbench UI / MCP Tool
    participant Proxy as ExecutionProxy
    participant Discovery as DjangoTargetDiscovery
    participant Auth as auth/impersonation.py
    participant Converter as PathConverterResolver
    participant Runner as DjangoSandboxRunner
    participant Interceptor as QueryInterceptor
    participant Analysis as QueryAnalysisEngine

    UI->>Proxy: execute_request(ProxyRequest)
    Note right of Proxy: ProxyRequest:<br/>- target_id<br/>- method<br/>- path_params, query_params, headers, body<br/>- user_context (Impersonate / Anonymous)<br/>- auth_mode (session / bearer / anonymous)<br/>- sandbox: True (default)

    Proxy->>Discovery: resolve_target(target_id)
    Discovery-->>Proxy: Target or 404

    Proxy->>Proxy: Validate method in target.allowed_methods
    Proxy->>Converter: build_executable_url(target, path_params)
    alt Resolved URL
        Converter-->>Proxy: concrete_url
    else No record found
        Converter-->>Proxy: None + reason
        Proxy-->>UI: 400 { error: "no_record_found", path_param: "pk" }
    end

    Proxy->>Proxy: Build WSGI request via RequestFactory
    Proxy->>Auth: build_request_with_user(request, user_context, auth_mode)
    Auth-->>Proxy: request with attached user / token / anonymous

    Proxy->>Runner: profile_callable(_dispatch_view, request, sandbox=sandbox)
    Runner->>Interceptor: attach QueryInterceptor
    Runner->>Runner: dispatch view, capture queries, rollback if sandbox
    Runner-->>Proxy: raw response + captured_queries

    Proxy->>Analysis: build_result(target, raw_response, captured_queries)
    Analysis-->>Proxy: ProxyResponse
    Proxy-->>UI: ProxyResponse
```

#### 5.2.8 `dqs.adapters.drf.auth.audit.audit_authz` *(new in v0.5)*

```mermaid
sequenceDiagram
    autonumber
    participant UI as Workbench UI / MCP Tool
    participant Audit as auth/audit.py
    participant Proxy as ExecutionProxy
    participant Runner as DjangoSandboxRunner

    UI->>Audit: audit_authz(target_id, user_ids[])
    Audit->>Audit: For each method in target.allowed_methods

    loop For each (method, user_id) pair
        Audit->>Audit: Open fresh transaction.atomic()
        Audit->>Proxy: execute_request(ProxyRequest with user_context=Impersonate(user_id), sandbox=True)
        Proxy->>Runner: profile_callable(...) — isolated per call
        Runner-->>Proxy: ProxyResponse
        Proxy-->>Audit: status_code
        Audit->>Audit: record_matrix_row(method, user_id, status_code)
        Audit->>Audit: Rollback transaction
    end

    Audit->>Audit: Compare observed statuses to expected baseline
    Note right of Audit: Flag unexpected statuses as<br/>PERMISSION_LEAK or OVER_RESTRICTION
    Audit-->>UI: AccessMatrix { rows: [...], leaks: [...], over_restrictions: [...] }
```

#### 5.2.9 `dqs.adapters.drf.execution.discovery.DjangoTargetDiscovery`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Discovery as DjangoTargetDiscovery
    participant Introspector as DjangoIntrospector
    participant SchemaAdv as schema_advisor
    participant StaticAdv as StaticASTAdvisor
    participant Celery as Celery App
    participant Channels as ASGI Application
    participant Target as dqs.core.targets.Target

    Client->>Discovery: discover_all()

    Note over Discovery: 1. Discover URL Routes
    Discovery->>Introspector: list_all_routes()
    Introspector-->>Discovery: List[RouteMetadata]

    loop For each route
        Discovery->>SchemaAdv: check_pk_strategy(route.target_model)
        Discovery->>StaticAdv: StaticASTAdvisor(view_source).run()
        Discovery->>SchemaAdv: check_missing_indexes(target_model, queried_fields)
        Discovery->>Target: Create Target(id="view:path", kind="view", ...)
    end

    Note over Discovery: 2. Discover Celery Tasks
    Discovery->>Celery: current_app.tasks.items()
    Celery-->>Discovery: Task registry
    loop For each task
        Discovery->>StaticAdv: _analyze_callable_statically(task_func)
        Discovery->>Target: Create Target(id="task:name", kind="task", ...)
    end

    Note over Discovery: 3. Discover Channels Consumers
    Discovery->>Channels: ASGI_APPLICATION -> websocket routes
    Channels-->>Discovery: Consumer routes
    loop For each consumer
        Discovery->>StaticAdv: _analyze_callable_statically(consumer_class)
        Discovery->>Target: Create Target(id="consumer:name", kind="consumer", triggerable=False)
    end

    Discovery-->>Client: List[Target]
```

#### 5.2.10 `dqs.adapters.drf.router.DQSRouter` & `profiling_session`

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Code
    participant Session as profiling_session()
    participant Router as DQSRouter
    participant ThreadLocal as threading.local
    participant Django as Django DB Router

    Client->>Session: with profiling_session():
    Session->>Router: DQSRouter.set_active(True)
    Router->>ThreadLocal: _local.active = True

    Note over Client: Django ORM operations now route to dqs_shadow DB

    Client->>Django: Model.objects.create(...)
    Django->>Router: db_for_read/write(model)
    Router->>Router: is_active() == True
    Router-->>Django: Return "dqs_shadow"
    Django->>Django: Execute on shadow database

    Client->>Session: Exit context
    Session->>Router: DQSRouter.set_active(False)
    Router->>ThreadLocal: _local.active = False
```

---

## 6. End-to-End Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Workbench UI / MCP Agent
    participant Disc as Target Discovery Engine
    participant Adv as Static AST Advisor
    participant Sug as Payload Suggester
    participant Proxy as Execution Proxy
    participant Auth as Auth Layer
    participant Run as Sandbox Runner
    participant Inter as Query Interceptor & DB
    participant Ana as AST Analyzer

    Caller->>Disc: list_targets() / open workbench
    Disc->>Adv: Statically analyze view / signal / task AST
    Adv-->>Disc: Return static findings
    Disc-->>Caller: List of Target objects

    Caller->>Sug: suggest_payload(target_id) (optional)
    Sug-->>Caller: JSON template + notes

    Caller->>Proxy: execute_request(target_id, payload, user_context, sandbox=True)
    Proxy->>Proxy: Validate target + method + path params
    Proxy->>Auth: build_request_with_user(user_context, auth_mode)
    Auth-->>Proxy: request with attached user
    Proxy->>Run: profile_callable(dispatch, sandbox=True)
    Run->>Inter: Open transaction.atomic() savepoint
    Run->>Inter: Attach QueryInterceptor to DB driver connection
    Run->>Run: Dispatch RequestFactory request to endpoint view
    Inter-->>Run: Record queries, execution times, and call stack origins
    Run->>Inter: savepoint_rollback() (when sandbox=True)
    Run->>Ana: Pass captured queries & locations
    Ana-->>Run: N+1 flags, SQL fingerprints, and ORM fixes
    Run-->>Proxy: ProxyResponse
    Proxy-->>Caller: { http_response, profiling_summary }
```

---

## 7. Security & Isolation Model

- **Toggleable Sandbox (default ON)**: Every request runs inside an atomic savepoint and is rolled back automatically. The caller can opt out per-call (`sandbox: False`) when it actually wants a write to persist.
- **`DEBUG=True` Guardrail**: Profiling runs only in development environments — enforced in `apps.py` and `DjangoIntrospector`.
- **Sanitized SQL**: AST fingerprinting strips user data/literals before rendering analysis reports.
- **Shadow Database** *(legacy / opt-out path)*: Optional isolated database (`dqs_shadow`) for cases when sandbox is off and the caller wants writes routed away from `default`. Configured via `DATABASE_ROUTERS` and `profiling_session()`.
- **No Network Roundtrip for Auth**: `force_authenticate` short-circuits the auth backend so user impersonation is instant. Tokens are generated in-process when `auth_mode="bearer"`.
- **No Auto-Seeding**: The proxy never writes to the DB on the caller's behalf. If a path param can't be resolved against real data, the request fails loudly with a clear reason — the UI surfaces this as "Pick a record or enter a value," the MCP agent gets a structured 400.

---

## 8. Installation & Testing

### Development Installation

```bash
# From source (editable install)
pip install -e "C:\Users\mprof\OneDrive\Desktop\da-profiler"

# Or build and install
pip install dist/da_profiler-0.3.0-py3-none-any.whl
```

### Demo Project Setup

```bash
# 1. Go to demo project
cd demos/drf

# 2. Install dependencies
pip install -e "..[django]"

# 3. Configure settings (DEBUG=True, dqs_shadow DB, DATABASE_ROUTERS)

# 4. Run migrations on shadow DB
python manage.py migrate --database=dqs_shadow

# 5. Run tests
pytest -m core        # Pure Python tests (fast, no DB)
pytest -m django      # Django/DRF adapter tests (requires DB)
pytest                # All tests
```

### Using in Your Own Project

```bash
# Install from PyPI
pip install da-profiler[django]

# Add to settings.py (development only)
if DEBUG:
    INSTALLED_APPS += ["dqs.adapters.drf"]
    DATABASE_ROUTERS = ["dqs.adapters.drf.router.DQSRouter"]

# Configure shadow database
DATABASES = {
    "default": {...},
    "dqs_shadow": {...},  # Same engine as default
}

# Run shadow migrations
python manage.py migrate --database=dqs_shadow
```

---

## 9. Key Data Flow Summary

| Stage | Input | Component | Output |
|-------|-------|-----------|--------|
| **Discovery** | Django URL patterns + signal/task registries | `DjangoTargetDiscovery` | `List[Target]` (consumed by workbench sidebar AND `list_targets` MCP tool) |
| **Static analysis** | Target source code | `StaticASTAdvisor` | `static_findings` (N+1 candidates, blocking I/O) |
| **Payload suggestion** | `target_id`, optional `field_overrides` | `PayloadSuggester` | `{ template, notes, warnings }` — never writes to DB |
| **Path-param resolution** | Route + explicit params | `PathConverterResolver` | Concrete URL, or `None + reason` if no record found |
| **Execution proxy** | `ProxyRequest` (target_id, payload, user_context, sandbox) | `ExecutionProxy` | `ProxyResponse` (http_response + profiling_summary) |
| **Auth injection** | request + user_context + auth_mode | `auth/impersonation.py` | request with `force_authenticate` / token / anonymous |
| **Sandbox execution** | View callable + WSGI request | `DjangoSandboxRunner.profile_callable` | HTTP response + captured queries |
| **Interception** | DB queries | `QueryInterceptor` | Queries with origin (file:line) + duration |
| **AuthZ audit** | target_id + user_ids[] | `auth/audit.py` | `AccessMatrix` with leak/over-restriction flags |
| **Analysis** | Captured queries | `QueryAnalysisEngine` + `analyzer.py` | N+1 flags + ORM fixes |
| **Agent loop** | N+1 flag + suggested fix | MCP `apply_fix` tool | AST-edited source; re-profile to verify |

---

## 10. Complete Flow Diagrams

For detailed visual flow diagrams covering:
- Route discovery & workbench sidebar loading
- Complete profiling execution (request builder click to results)
- Query interception & N+1 detection
- AuthZ audit matrix generation
- High-level component interactions
- Simplified flow summary

See **[Flow Diagrams](./docs/flow-diagrams.md)**.
