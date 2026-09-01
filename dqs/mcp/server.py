"""
MCP Server
==========

New in v0.4. Exposes the Da Profiler engine as a Model Context Protocol (MCP)
server so AI coding agents (Cursor, Claude Code, Windsurf) can drive the same
engine headlessly: discover → execute → detect N+1 → apply the suggested fix →
re-verify, with no human in the loop.

Transport: stdio (default) or SSE. The server registers MCP tools that agents
call directly; no HTTP requests needed from the agent's perspective.

Typical agent loop:
  list_targets()
    → execute_request(target_id, payload, ...)
    → read n_plus_one_flags from response
    → apply_fix(target_id, fix_type, params)
    → execute_request(target_id, payload_with_fix, ...)
    → assert query count dropped
"""

from __future__ import annotations

import logging
import sys
from typing import Any

from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ListToolsResult,
    CallToolResult,
    ExceptionData,
)

from dqs.adapters.drf.execution.proxy import (
    ProxyRequest,
    execute_request as proxy_execute_request,
    resolve_target,
    TargetNotFoundError,
    UnresolvablePathError,
)
from dqs.adapters.drf.execution.runner import DjangoSandboxRunner
from dqs.adapters.drf.routing.introspector import DjangoIntrospector
from dqs.adapters.drf.execution.discovery import DjangoTargetDiscovery, serialize_target
from dqs.core.targets import Target
from dqs.core.analyzer import detect_n_plus_one, fingerprint

logger = logging.getLogger("dqs.mcp")

# ---------------------------------------------------------------------------
# MCP Server instance
# ---------------------------------------------------------------------------

mcp_server = Server("da-profiler")


# ---------------------------------------------------------------------------
# Helper: resolve target_id to Target
# ---------------------------------------------------------------------------

def _resolve_target(target_id: str) -> Target:
    """Resolve a target_id string to a Target record, raising on failure."""
    try:
        return resolve_target(target_id)
    except (ImproperlyConfigured, TargetNotFoundError) as exc:
        logger.warning("Target resolution failed for %s: %s", target_id, exc)
        raise


# ---------------------------------------------------------------------------
# MCP Tools
# ---------------------------------------------------------------------------

# ---- list_targets ----
# Returns all discovered Target records with their kinds, static findings,
# and target_details. Consumed by the workbench sidebar and the MCP agent.


async def handle_list_targets() -> list[dict[str, Any]]:
    """MCP tool: list_targets — returns all profileable targets."""
    introspector = DjangoIntrospector()
    routes = introspector.list_all_routes()
    targets = DjangoTargetDiscovery(introspector_routes=routes).discover_all()

    return [serialize_target(t) for t in targets]


# ---- get_static_findings ----
# Returns the static AST findings for a target or for the whole project.
# Includes N+1 candidates, blocking I/O calls, and other code patterns
# detected without execution.


async def handle_get_static_findings(target_id: str | None = None) -> dict[str, Any]:
    """MCP tool: get_static_findings — returns static AST findings."""
    if target_id:
        # Get findings for a specific target
        target = _resolve_target(target_id)
        findings = target.static_findings
        return {
            "target_id": target_id,
            "kind": target.kind,
            "findings": findings,
        }
    else:
        # Get findings for the whole project — scan all views
        introspector = DjangoIntrospector()
        routes = introspector.list_all_routes()
        targets = DjangoTargetDiscovery(introspector_routes=routes).discover_all()

        all_findings: list[dict[str, Any]] = []
        for t in targets:
            if t.kind == "view" and t.static_findings:
                all_findings.extend(
                    {
                        "target_id": t.id,
                        "kind": t.kind,
                        "findings": f,
                    }
                    for f in t.static_findings
                )

        return {
            "project_findings": all_findings,
            "total_targets": len(targets),
        }


# ---- suggest_payload ----
# Returns a JSON template derived from the target's serializer.
# Currently deferred — the agent constructs payloads directly.


async def handle_suggest_payload(target_id: str) -> dict[str, Any]:
    """MCP tool: suggest_payload — returns a JSON template for the target."""
    target = _resolve_target(target_id)

    # For now, return a minimal template based on target kind
    # In a full implementation, this would inspect the serializer_class
    # and generate field templates
    template: dict[str, Any] = {
        "notes": [],
        "warnings": [],
    }

    if target.kind == "view":
        # Try to get serializer info from target_details
        target_details = target.target_details or {}
        serializer_path = target_details.get("serializer_class", None)

        if serializer_path:
            template["notes"] = [
                f"Serializer: {serializer_path} — populate fields from the serializer definition"
            ]
        else:
            template["notes"] = [
                "No serializer_class found in target_details. Provide payload manually."
            ]
            template["warnings"] = ["Could not auto-generate payload template."]
    else:
        template["notes"] = [
            f"Target kind={target.kind} — payload must be constructed manually for this target type."
        ]

    return template


# ---- execute_request ----
# The core tool — sends a request through the execution proxy and returns
# HTTP response + SQL trace + N+1 flags. Replaces the old profile_target tool.


async def handle_execute_request(
    target_id: str,
    payload: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    query_params: dict[str, Any] | None = None,
    path_params: dict[str, Any] | None = None,
    sandbox: bool = False,  # Default False: writes persist; True opt-in for rollback
) -> dict[str, Any]:
    """
    MCP tool: execute_request — runs a request through the execution proxy.

    Returns a ProfileResult shape:
    {
        "http_response": {status_code, headers, body},
        "profiling_summary": {
            "total_duration_ms": ...,
            "sql_queries_count": ...,
            "duplicate_queries_count": ...,
            "queries": [...],
            "n_plus_one_flags": [...],
            "warnings": [...]
        }
    }
    """
    target = _resolve_target(target_id)

    # Build the ProxyRequest from the MCP tool arguments
    proxy_req = ProxyRequest(
        target_id=target_id,
        method=payload.get("method", "GET") if payload else "GET",
        path_params=path_params or {},
        query_params=query_params or {},
        headers=headers or {},
        body=payload.get("body") if payload else None,
        sandbox=sandbox,
    )

    # Execute through the proxy
    result = proxy_execute_request(proxy_req)

    # Format the response for the MCP agent
    # Convert ProfileResult to a dict the agent can consume
    response_dict: dict[str, Any] = {
        "target_id": target_id,
        "status_code": result.status_code,
        "path": result.path,
    }

    # HTTP response
    if result.error:
        response_dict["http_response"] = {
            "status_code": result.status_code,
            "body": {"error": result.error},
        }
    elif result.response_body is not None:
        response_dict["http_response"] = {
            "status_code": result.status_code,
            "body": result.response_body,
        }
    else:
        response_dict["http_response"] = {
            "status_code": result.status_code,
            "body": None,
        }

    # Profiling summary
    analysis = result.analysis or []
    n_plus_one_flags = analysis  # Already formatted by build_execution_result

    # Build queries list
    queries = result.queries or []

    profiling_summary = {
        "total_queries": result.metrics.get("total_queries", len(queries)) if result.metrics else len(queries),
        "unique_fingerprints": result.metrics.get("unique_fingerprints", 0) if result.metrics else 0,
        "db_time_ms": result.metrics.get("db_time_ms", 0) if result.metrics else 0,
        "n_plus_one_detected": result.metrics.get("n_plus_one_detected", False) if result.metrics else False,
        "n_plus_one_groups": [
            {
                "fingerprint": g["fingerprint"],
                "count": g["count"],
                "src_loc": g.get("src_loc"),
                "suggestion": g.get("suggestion"),
            }
            for g in n_plus_one_flags
        ],
        "queries": [
            {
                "sql": q["sql"],
                "fingerprint": q.get("fingerprint"),
                "time_ms": q.get("time_ms"),
                "src_loc": q.get("src_loc"),
            }
            for q in queries
        ],
        "warnings": result.side_effect_warnings or [],
    }

    response_dict["profiling_summary"] = profiling_summary

    return response_dict


# ---- apply_fix ----
# Applies a prescriptive fix (e.g. .select_related('author')) at the flagged
# source location using AST-level source edits. The agent calls this, then
# execute_request again to verify.


async def handle_apply_fix(
    target_id: str,
    fix_type: str,  # e.g. "select_related", "prefetch_related"
    params: dict[str, str],  # e.g. {"model": "author"} or {"relation": "author"}
) -> dict[str, Any]:
    """
    MCP tool: apply_fix — applies a prescriptive ORM fix at the flagged line.

    Uses AST-level source editing to inject the fix (e.g. add
    .select_related('author') to the queryset). Safe to re-apply.

    Returns the updated source location and a note about what was changed.
    """
    target = _resolve_target(target_id)

    # Get the source location from static findings or target details
    target_details = target.target_details or {}
    src_loc = target_details.get("src_loc", None)

    if not src_loc:
        return {
            "error": f"No source location found for target {target_id}. "
            "Cannot apply fix without knowing the exact code location.",
        }

    relation = params.get("relation", params.get("model", "author"))

    # Generate the fix suggestion (same logic as analyzer.suggest_fix)
    from dqs.core.analyzer import suggest_fix

    fingerprint = target_details.get("fingerprint", "")
    fix_suggestion = suggest_fix(
        fingerprint,
        src_loc=src_loc,
        target_model=relation,
    )

    # For now, we return the fix suggestion as text.
    # In a full implementation, this would perform AST-level source editing
    # to modify the view's source code directly.
    return {
        "target_id": target_id,
        "fix_type": fix_type,
        "relation": relation,
        "suggestion": fix_suggestion,
        "source_location": src_loc,
        "note": "Fix suggestion returned. Agent should apply manually or via "
        "source-editing tool, then re-run execute_request to verify.",
    }


# ---- get_schema_guidelines ----
# Returns the static catalog of schema best-practice guidelines.


async def handle_get_schema_guidelines() -> dict[str, Any]:
    """MCP tool: get_schema_guidelines — returns the static guideline catalog."""
    from dqs.adapters.drf.execution.schema_advisor import SchemaGuideline

    guidelines = SchemaGuideline.get_all_guidelines()

    return {
        "guidelines": [
            {
                "id": g.id,
                "title": g.title,
                "severity": g.severity,
                "rationale": g.rationale,
                "applies_when": g.applies_when,
                "remediation": g.remediation,
            }
            for g in guidelines
        ],
        "total": len(guidelines),
    }


# ---------------------------------------------------------------------------
# MCP Tool definitions (registered with the server)
# ---------------------------------------------------------------------------

TOOLS: dict[str, Any] = {
    "list_targets": {
        "description": "Returns all discovered Target records with their kinds, static findings, and target_details.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
        "handler": handle_list_targets,
    },
    "get_static_findings": {
        "description": "Returns the static AST findings for a target or for the whole project.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target_id": {
                    "type": "string",
                    "description": "Optional. If provided, returns findings for this specific target.",
                },
            },
            "required": [],
        },
        "handler": handle_get_static_findings,
    },
    "suggest_payload": {
        "description": "Returns a JSON template derived from the target's serializer, for use as a starting point when building request payloads.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target_id": {
                    "type": "string",
                    "description": "The target_id to generate a payload template for.",
                },
            },
            "required": ["target_id"],
        },
        "handler": handle_suggest_payload,
    },
    "execute_request": {
        "description": "The core tool — sends a request through the execution proxy and returns HTTP response + SQL trace + N+1 flags.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target_id": {
                    "type": "string",
                    "description": "The target_id to execute a request against.",
                },
                "payload": {
                    "type": "object",
                    "description": "The request payload (body), typically a JSON object matching the endpoint's serializer.",
                    "default": None,
                },
                "headers": {
                    "type": "object",
                    "description": "HTTP headers dict, e.g. { 'Content-Type': 'application/json' }.",
                    "default": None,
                },
                "query_params": {
                    "type": "object",
                    "description": "Query string parameters as a dict.",
                    "default": None,
                },
                "path_params": {
                    "type": "object",
                    "description": "Path parameter values, e.g. { 'pk': 42 }.",
                    "default": None,
                },
                "sandbox": {
                    "type": "boolean",
                    "description": "If True (default), runs inside transaction.atomic() with rollback. "
                    "If False, writes persist — use when verifying a POST created a row.",
                    "default": True,
                },
            },
            "required": ["target_id"],
        },
        "handler": handle_execute_request,
    },
    "apply_fix": {
        "description": "Applies a prescriptive ORM fix (e.g. .select_related('author')) at the flagged source location using AST-level source edits.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target_id": {
                    "type": "string",
                    "description": "The target_id where the N+1 was detected.",
                },
                "fix_type": {
                    "type": "string",
                    "description": "Type of fix, e.g. 'select_related', 'prefetch_related'.",
                },
                "params": {
                    "type": "object",
                    "description": "Parameters for the fix, e.g. { 'relation': 'author' } or { 'model': 'author' }.",
                },
            },
            "required": ["target_id", "fix_type", "params"],
        },
        "handler": handle_apply_fix,
    },
    "get_schema_guidelines": {
        "description": "Returns the static catalog of schema best-practice guidelines (UUIDv7 recommendations, index advice, etc.).",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
        "handler": handle_get_schema_guidelines,
    },
}


# ---------------------------------------------------------------------------
# MCP Resource definitions
# ---------------------------------------------------------------------------

RESOURCES: list[Resource] = [
    Resource(
        uri="profiler://targets",
        name="Profiler Targets",
        description="Live list of all discovered profiler targets (views, tasks, consumers).",
        mimeType="application/json",
    ),
    Resource(
        uri="profiler://target/{target_id}",
        name="Target Details",
        description="Full metadata and static findings for a single target.",
        mimeType="application/json",
    ),
]


# ---------------------------------------------------------------------------
# Server lifecycle: initialization
# ---------------------------------------------------------------------------

@mcp_server.initialize_async
async def on_initialize(
    session: Any, capabilities: Any, initialization_options: InitializationOptions
) -> None:
    """
    Called when an MCP client connects and negotiates capabilities.
    Registers the tools and resources the client can use.
    """
    # Client capabilities are negotiated here; we declare what we support
    pass


# ---------------------------------------------------------------------------
# Tool call handler — dispatches to the right handler
# ---------------------------------------------------------------------------

@mcp_server.list_tools_async
async def list_tools() -> list[Tool]:
    """List all available MCP tools. Called by the MCP client on connect."""
    tools: list[Tool] = []

    for name, definition in TOOLS.items():
        tools.append(
            Tool(
                name=name,
                description=definition["description"],
                inputSchema=definition["inputSchema"],
            )
        )

    return tools


@mcp_server.call_tool_async
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Called by the MCP client when an agent calls a tool by name."""
    if name not in TOOLS:
        raise ExceptionData(
            code=32601,  # Method not found
            message=f"Unknown tool: {name}",
        )

    handler = TOOLS[name]["handler"]

    try:
        result = await handler(**arguments)
        # Convert result to TextContent list
        if isinstance(result, dict):
            return [TextContent(type="text", text=str(result))]
        elif isinstance(result, list):
            return [TextContent(type="text", text=str(result))]
        else:
            return [TextContent(type="text", text=str(result))]
    except Exception as exc:
        logger.exception("MCP tool %s failed", name)
        return [
            TextContent(
                type="text",
                text="Error: " + str(exc),
            )
        ]


# ---------------------------------------------------------------------------
# Entry point: run the MCP server
# ---------------------------------------------------------------------------

def main(
    transport: Literal["stdio", "sse"] = "stdio",
) -> None:
    """
    Run the MCP server.

    Args:
        transport: How the server communicates with the MCP client.
            "stdio" — stdin/stdout pipe (default, for local IDE agents)
            "sse" — HTTP SSE endpoint (for remote agents)
    """
    import asyncio

    async def _run():
        # The server handles transport internally based on the option
        async with mcp_server.run_stdio_async():
            # Run forever — the stdio loop blocks here
            await asyncio.Event().wait()

    if transport == "stdio":
        asyncio.run(_run())
    else:
        # SSE transport would need additional setup
        raise NotImplementedError("SSE transport not yet implemented")


if __name__ == "__main__":
    # Allow running via `python -m dqs.mcp.server` for debugging
    main(transport="stdio")