"""
Static AST Code Advisor
========================

ELI5: Before we ever run a view, we can already tell a lot about it just by
reading its source code. This module does that reading — it walks the Python
AST (the tree-shaped representation of your code that Python builds when it
parses a file) and looks for risky patterns:

1. **ORM calls inside loops** — the classic N+1. `.filter()` or `.get()`
   inside a `for` block means you'll run one query per loop iteration.

2. **Blocking I/O calls** — `requests.post(...)`, `smtplib.SMTP(...)`,
   `time.sleep(...)`. These freeze the request thread; in an async view
   they should be `await`ed instead, and in a worker they should usually
   be offloaded to a background task.

We resolve import aliases (`import requests as r; r.post(...)` → `requests.post`)
so we catch the call regardless of how the developer named the import.

This module is framework-agnostic: no Django, no DRF, no DB connection
required. It just parses Python.
"""

from __future__ import annotations

import ast
from typing import Any

# Django ORM method names we recognize. We match on the bare method name
# because the receiver might not be obviously a queryset (e.g. a local var
# named `qs` that holds a queryset).
#
# Note: these names also appear on non-Django classes (e.g. any class with
# a `.get()` method). That's why we have a separate "confidence" check —
# matches where the receiver's name hints at a queryset/manager are high
# confidence; bare method-name matches are low.
DJANGO_ORM_METHODS: set[str] = {
    "get", "filter", "exclude", "all", "first", "last",
    "create", "update", "delete", "count", "exists",
    "select_related", "prefetch_related", "values", "values_list",
}

# Substring prefixes we consider "blocking I/O" patterns. We match on the
# fully-qualified call name (after alias resolution), so `requests.post(...)`
# and `r.post(...)` both get caught because we resolve `r` back to `requests`.
BLOCKING_CALL_PREFIXES: set[str] = {
    "requests.get", "requests.post", "requests.put", "requests.delete", "requests.patch",
    "urllib.request", "smtplib.SMTP", "time.sleep",
}


class StaticASTAdvisor(ast.NodeVisitor):
    """
    Walks a Python source file's AST and emits findings for risky patterns.

    Usage:
        advisor = StaticASTAdvisor(source_code, filename="myapp/views.py")
        findings = advisor.run()
        # findings is a list of dicts: {type, message, line, severity}
    """

    # Receiver-name fragments that strongly suggest a Django queryset/manager.
    # Used to bump confidence when the method name is generic (e.g. `.get()`).
    _QUERYSET_HINT_FRAGMENTS = ("queryset", "_set", "qs", "manager")

    def __init__(self, source_code: str, filename: str = "<string>") -> None:
        self.source_code = source_code
        self.filename = filename
        self.findings: list[dict[str, Any]] = []
        self._loop_depth = 0
        self.import_map: dict[str, str] = {}
        # Field names the code queries via .filter()/.exclude()/.order_by() —
        # consumed by schema_advisor.py to flag missing indexes.
        self.queried_fields: list[str] = []

    # ------------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------------
    def run(self) -> list[dict[str, Any]]:
        """
        Parse the source, walk the tree, return findings.

        If the source can't be parsed (syntax error, etc.) we don't crash —
        we emit a single AST_PARSE_ERROR finding so the caller knows we
        tried and failed.
        """
        try:
            tree = ast.parse(self.source_code, filename=self.filename)
            self.visit(tree)
        except Exception as exc:
            self.findings.append({
                "type": "AST_PARSE_ERROR",
                "message": f"Could not parse source code: {exc}",
                "line": 0,
            })
        return self.findings

    # ------------------------------------------------------------------------
    # Import tracking (so later calls can be resolved back to their module)
    # ------------------------------------------------------------------------
    def visit_Import(self, node: ast.Import) -> None:
        """Track `import X` / `import X as Y` so later calls resolve correctly."""
        for alias in node.names:
            local_name = alias.asname or alias.name.split(".")[0]
            self.import_map[local_name] = alias.name
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        """Track `from X import Y` / `from X import Y as Z` for alias resolution."""
        module = node.module or ""
        for alias in node.names:
            local_name = alias.asname or alias.name
            self.import_map[local_name] = f"{module}.{alias.name}" if module else alias.name
        self.generic_visit(node)

    # ------------------------------------------------------------------------
    # Loop tracking (to detect ORM calls inside loops)
    # ------------------------------------------------------------------------
    def visit_For(self, node: ast.For) -> None:
        self._enter_loop(node)

    def visit_AsyncFor(self, node: ast.AsyncFor) -> None:
        self._enter_loop(node)

    def visit_While(self, node: ast.While) -> None:
        self._enter_loop(node)

    def _enter_loop(self, node: ast.AST) -> None:
        self._loop_depth += 1
        self.generic_visit(node)
        self._loop_depth -= 1

    # ------------------------------------------------------------------------
    # Call detection — the heart of the advisor
    # ------------------------------------------------------------------------
    def visit_Call(self, node: ast.Call) -> None:
        """Inspect every function/method call against our two rule sets."""
        call_repr = self._get_call_name(node)

        # Rule 1: ORM call inside a loop → potential N+1.
        if self._loop_depth > 0:
            is_orm, confidence = self._is_orm_call(node, call_repr)
            if is_orm:
                severity = "high" if confidence == "high" else "low"
                if confidence == "high":
                    message = (
                        f"Potential N+1 query pattern: ORM call '{call_repr}' "
                        f"detected inside a loop at line {node.lineno}."
                    )
                else:
                    message = (
                        f"Possible N+1 query pattern: '{call_repr}' inside a loop at "
                        f"line {node.lineno} — method name matches common ORM calls, but "
                        f"the receiver isn't confirmed as a queryset/manager."
                    )
                self.findings.append({
                    "type": "ORM_CALL_IN_LOOP",
                    "message": message,
                    "line": node.lineno,
                    "severity": severity,
                })

        # Rule 2: blocking I/O — anything that freezes the thread.
        if self._is_blocking_call(call_repr):
            self.findings.append({
                "type": "BLOCKING_EXTERNAL_CALL",
                "message": (
                    f"Blocking network/IO call '{call_repr}' detected inside code "
                    f"path at line {node.lineno}."
                ),
                "line": node.lineno,
                "severity": "medium",
            })

        # Side-effect (used by schema_advisor.py): record every field name passed
        # to .filter()/.exclude()/.order_by() so the index checker can compare
        # against the model's actual indexes.
        method_name = node.func.attr if isinstance(node.func, ast.Attribute) else None
        if method_name in ("filter", "exclude", "order_by"):
            for kw in node.keywords:
                if kw.arg:
                    self.queried_fields.append(kw.arg)
            for arg in node.args:
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                    self.queried_fields.append(arg.value)

        self.generic_visit(node)

    # ------------------------------------------------------------------------
    # Detection helpers
    # ------------------------------------------------------------------------
    def _is_orm_call(self, node: ast.Call, call_repr: str) -> tuple[bool, str | None]:
        """
        Decide whether a call looks like a Django ORM query.

        Returns `(True, "high"|"low")` if it does, `(False, None)` otherwise.

        ELI5: Two confidence levels:
        - "high" — we're sure it's ORM (e.g. `Book.objects.all()`).
        - "low" — it MIGHT be ORM (e.g. a variable called `qs` calling
          `.filter()`). We still report low-confidence matches, but at
          a reduced severity so the developer can skim past the false
          positives.
        """
        # Explicit manager access — unambiguous Django pattern.
        if ".objects." in call_repr or call_repr.startswith("objects."):
            return True, "high"

        if isinstance(node.func, ast.Attribute):
            method_name = node.func.attr
            if method_name in DJANGO_ORM_METHODS:
                receiver = self._unparse_node(node.func.value).lower()
                if any(hint in receiver for hint in self._QUERYSET_HINT_FRAGMENTS):
                    return True, "high"
                return True, "low"

        return False, None

    def _is_blocking_call(self, call_repr: str) -> bool:
        """Return True if `call_repr` looks like a known blocking I/O pattern."""
        return any(call_repr.startswith(prefix) for prefix in BLOCKING_CALL_PREFIXES)

    # ------------------------------------------------------------------------
    # AST → string helpers (with import alias resolution)
    # ------------------------------------------------------------------------
    def _get_call_name(self, node: ast.Call) -> str:
        """Build a dot-notation name for the call (e.g. `requests.post`)."""
        if isinstance(node.func, ast.Attribute):
            value = self._unparse_node(node.func.value)
            resolved_value = self._resolve_alias(value)
            return f"{resolved_value}.{node.func.attr}"
        if isinstance(node.func, ast.Name):
            return self._resolve_alias(node.func.id)
        return ""

    def _unparse_node(self, node: ast.AST) -> str:
        """Render an AST expression node back to source text."""
        if hasattr(ast, "unparse"):
            return ast.unparse(node)
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            return f"{self._unparse_node(node.value)}.{node.attr}"
        return ""

    def _resolve_alias(self, name: str) -> str:
        """
        Translate a local name back to its real import path.

        ELI5: If the developer wrote `import requests as r; r.post(...)`,
        the AST sees the call as `r.post` — not very informative. We use
        the import map we built in `visit_Import` to translate `r` back to
        `requests`, so the call shows up as `requests.post(...)` in findings.

        Caveat: visits happen in source order, so an import that appears
        AFTER its use won't be resolved. This is rare in practice (imports
        are usually at the top) but worth knowing.
        """
        base = name.split(".")[0]
        if base in self.import_map:
            resolved_base = self.import_map[base]
            remainder = name[len(base):]  # preserve any trailing ".suffix"
            return f"{resolved_base}{remainder}"
        return name
