

## [0.3.4] - August 20, 2026

### Added

- **Execution Proxy (dqs/adapters/drf/execution/proxy.py)**: New single entry point for both workbench UI and MCP server. Validates targets, resolves path parameters without auto-seeding, attaches user context, dispatches through sandbox runner with toggleable rollback, and returns structured ProfileResult.

- **MCP Server (dqs/mcp/server.py)**: New Model Context Protocol server exposing the engine as tools for AI agents (Cursor, Claude Code, Windsurf). Tools: list_targets, get_static_findings, suggest_payload, execute_request, pply_fix, get_schema_guidelines. Resources and prompts for agentic loops.

- **PathConverterResolver simplification (dqs/adapters/drf/converters.py)**: Deprecated model-fallback logic that auto-resolved database records for path parameters. New behavior: resolves only explicit caller-supplied values; returns clear error if parameters missing — never auto-seeds DB.

- **Sandbox default change (dqs/adapters/drf/execution/runner.py)**: execute_request() sandbox default changed from True to False, allowing callers to run full CRUD cycles (POST -> PUT -> GET) by default. sandbox=True available as opt-in for strict rollback with shadow DB. Writes persist when sandbox=False.

### Changed

- **Architecture**: Two surfaces, one engine. Workbench UI and MCP server both consume the execution proxy (POST /profiler/execute) instead of calling runner directly.

- **Path parameter resolution**: Removed deprecated model-fallback logic. PathConverterResolver.resolve() now prioritizes explicit params, then returns url=None with reason if parameters missing — no database queries.

- **Auth**: Removed authentication implementation from proxy and MCP server. Surfaces operate without user impersonation for this release.

### Fixed

- **Path param resolution**: No longer attempts to query database for first record; requires explicit values from caller.

- **Sandbox semantics**: sandbox=False default allows writes to persist (shadow DB); sandbox=True guarantees rollback.

---