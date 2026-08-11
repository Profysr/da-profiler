"""
AST-Based SQL Analyzer & N+1 Detector
======================================

ELI5: SQL queries are strings, and two queries that look very different
might actually be doing the same thing — `WHERE id = 1` vs `WHERE id = 42`
are identical from the database's point of view. If we're going to spot
N+1 patterns (where the same query runs 50 times in a loop), we need a way
to say "these 50 queries are really the same query."

This module:
1. Takes a raw SQL string and returns a "fingerprint" — a normalized
   version where numbers are replaced by `?`, `IN (1, 2, 3)` becomes
   `IN (?)`, and table aliases are canonicalized so `T0` and `T1` line up.
2. Groups a list of queries by their fingerprint and flags any group
   bigger than a threshold (default 3) as an N+1 candidate.
3. For each flag, generates a copy-pasteable `.select_related('author')`
   or `.prefetch_related('author')` suggestion the developer can drop
   straight into their view.

We use `sqlglot` under the hood — it parses SQL into a real AST so the
normalization isn't fooled by clever formatting or reordered clauses.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

import sqlglot
import sqlglot.expressions as exp

logger = logging.getLogger("dqs.analyzer")


def _contains_or(condition: exp.Expression) -> bool:
    """Return True if any OR appears anywhere in this condition subtree."""
    return any(True for _ in condition.find_all(exp.Or))


def _sorted_and_chain(condition: exp.Expression) -> exp.Expression:
    """
    Flatten a pure AND chain, sort its parts by SQL text, and rebuild it.

    ELI5: SQL like `WHERE a = 1 AND b = 2` and `WHERE b = 2 AND a = 1` are
    the same query, just written in different orders. Sorting the parts
    alphabetically makes their fingerprints identical so we group them
    together. We can't do this when there's an OR in the mix (because
    `a=1 OR b=2` is NOT the same as `b=2 OR a=1`'s component ordering in
    a way that affects detection).
    """
    parts = list(condition.flatten()) if isinstance(condition, exp.And) else [condition]
    parts_sorted = sorted(parts, key=lambda c: c.sql())
    rebuilt = parts_sorted[0]
    for part in parts_sorted[1:]:
        rebuilt = exp.and_(rebuilt, part)
    return rebuilt


def fingerprint(raw_sql: str) -> str:
    """
    Turn a raw SQL string into a normalized form that ignores changing values.

    ELI5: This is the "shape" of the query. Two queries with different IDs,
    different IN-list sizes, or different table aliases will produce the
    same fingerprint if they're otherwise the same query — which is exactly
    what we need to detect "this query ran 50 times."

    Steps:
    1. Replace every literal (number, string) with `?`.
    2. Collapse `IN (1, 2, 3)` to `IN (?)` (lists always have one element).
    3. Renumber table aliases to T0, T1, T2... so aliases line up.
    4. Sort WHERE clause conditions alphabetically (when all ANDs).
    """
    try:
        parsed = sqlglot.parse_one(raw_sql)
    except Exception:
        # Couldn't parse — return the raw SQL stripped of whitespace.
        return raw_sql.strip()

    if parsed is None:
        return raw_sql.strip()

    # Step 1: replace every literal value with "?" so 1 and 42 look the same.
    for node in parsed.find_all(exp.Literal):
        node.replace(exp.Literal.string("?"))

    # Step 2: collapse dynamic IN lists down to a single placeholder.
    for node in parsed.find_all(exp.In):
        node.set("expressions", [exp.Literal.string("?")])

    # Step 3a: rewrite table aliases to a canonical T0/T1/... sequence.
    alias_map: dict[str, str] = {}
    for node in parsed.find_all(exp.TableAlias):
        original = node.this.name
        if original not in alias_map:
            alias_map[original] = f"T{len(alias_map)}"
        node.this.set("this", alias_map[original])

    # Step 3b: rewrite every column's table qualifier to match the new alias.
    for col in parsed.find_all(exp.Column):
        table_identifier = col.args.get("table")
        if table_identifier and table_identifier.name in alias_map:
            table_identifier.set("this", alias_map[table_identifier.name])

    # Step 4: sort AND-chain conditions (skip if any OR is present).
    where = parsed.find(exp.Where)
    if where is not None and not _contains_or(where.this):
        where.set("this", _sorted_and_chain(where.this))

    return parsed.sql()


def suggest_fix(
    fp: str,
    relationships: dict[str, dict[str, str]] | None = None,
    src_loc: str | None = None,
    target_model: str | None = None,
) -> str:
    """
    Generate a human-readable ORM fix recommendation for a flagged N+1.

    ELI5: When we spot an N+1, we also tell the developer how to fix it —
    usually by adding `.select_related('author')` or `.prefetch_related('tags')`
    to the queryset that triggers the loop. The exact recommendation depends
    on what model we think is involved.
    """
    loc_prefix = f" at `{src_loc}`" if src_loc else ""

    if target_model:
        return (
            f"Potential N+1 query detected on model '{target_model}'{loc_prefix}. "
            f"Use `.select_related('{target_model}')` for Foreign Keys / One-to-One, "
            f"or `.prefetch_related('{target_model}')` for Many-to-Many / Reverse FKs."
        )

    return (
        f"Potential N+1 query detected{loc_prefix}. "
        f"Consider optimizing your queryset using `.select_related()` or `.prefetch_related()`."
    )


def detect_n_plus_one(
    queries: list[dict[str, Any]],
    threshold: int = 3,
    relationships: dict[str, str] | dict[str, dict[str, str]] | None = None,
    target_model: str | None = None,
) -> list[dict[str, Any]]:
    """
    Group queries by fingerprint and flag any group larger than `threshold`.

    ELI5: This is the actual N+1 detector. Each captured query comes in
    with its SQL text; we fingerprint it (normalize away the changing
    values), bucket all queries with the same fingerprint together, and
    report any bucket that ran `threshold` or more times. We only flag
    SELECT queries — INSERT/UPDATE/DELETE happening many times is
    usually intentional, not an N+1.

    Each flag includes:
    - the fingerprint (so the developer can grep for it),
    - the count (how many times it ran),
    - where it came from (file:line),
    - a copy-pasteable fix suggestion.
    """
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for query in queries:
        groups[fingerprint(query["sql"])].append(query)

    flags: list[dict[str, Any]] = []
    for fp, group in groups.items():
        # Only flag SELECTs that ran too many times — repeated writes
        # are usually intentional (bulk inserts, batched updates).
        if len(group) < threshold or not fp.strip().upper().startswith("SELECT"):
            continue

        source_loc = group[0].get("src_loc")
        flags.append({
            "fingerprint": fp,
            "count": len(group),
            "src_loc": source_loc,
            "target_model": target_model,
            "suggestion": suggest_fix(fp, relationships, src_loc=source_loc, target_model=target_model),
            "sample_queries": [q["sql"] for q in group[:2]],
        })

    return flags
