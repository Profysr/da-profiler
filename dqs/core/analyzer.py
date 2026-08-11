import logging
from collections import defaultdict
from typing import Any

import sqlglot
import sqlglot.expressions as exp

logger = logging.getLogger("analyzer")
# ==============================
# Helper Functions
# ==============================
def _contains_or(condition: exp.Expression) -> bool:
    """True if an OR appears anywhere in this condition subtree."""
    return any(True for _ in condition.find_all(exp.Or))


def _sorted_and_chain(condition: exp.Expression) -> exp.Expression:
    """
    Flattens a pure AND chain into its individual conditions, sorts them by
    their normalized SQL text for a stable order, and rebuilds the chain.
    """
    if isinstance(condition, exp.And):
        parts = list(condition.flatten())
    else:
        parts = [condition]

    parts_sorted = sorted(parts, key=lambda c: c.sql())

    rebuilt = parts_sorted[0]
    for part in parts_sorted[1:]:
        rebuilt = exp.and_(rebuilt, part)
    return rebuilt


# ==============================
# Main Defs
# ==============================
def fingerprint(raw_sql: str) -> str:
    """
    Parses raw SQL using sqlglot and normalizes syntactic variations.
    """
    try:
        parsed = sqlglot.parse_one(raw_sql)
    except Exception:
        return raw_sql.strip()

    if parsed is None:
        return raw_sql.strip()

    # 1. Strip individual literals
    for node in parsed.find_all(exp.Literal):
        node.replace(exp.Literal.string("?"))

    # 2. Collapse IN (...) lists to a single placeholder
    for node in parsed.find_all(exp.In):
        node.set("expressions", [exp.Literal.string("?")])

    # 3a. Canonicalize table alias definitions
    alias_map = {}
    for node in parsed.find_all(exp.TableAlias):
        original_alias = node.this.name
        if original_alias not in alias_map:
            alias_map[original_alias] = f"T{len(alias_map)}"
        node.this.set("this", alias_map[original_alias])

    # 3b. Update all column table qualifiers
    for col in parsed.find_all(exp.Column):
        table_identifier = col.args.get("table")
        if table_identifier and table_identifier.name in alias_map:
            table_identifier.set("this", alias_map[table_identifier.name])

    # 4. Sort top-level AND-chained WHERE conditions
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
    """Generates a plain-English Django ORM optimization recommendation.

    :param fp: The AST fingerprint string of the repeated query.
    :param relationships: Mapping from table names to model relationship
      metadata.
    :param src_loc: File and line number where the query originated
      (e.g., 'views.py:42').
    :param target_model: Model or task name passed down from execution context.
    """
    loc_prefix = f" at `{src_loc}`" if src_loc else ""

    if target_model:
        return (
            f"Potential N+1 query detected on model '{target_model}'{loc_prefix}. "
            f"Use `.select_related('{target_model}')` for Foreign Keys / One-to-One, "
            f"or `.prefetch_related('{target_model}')` for Many-to-Many / Reverse FKs."
        )

    return f"Potential N+1 query detected{loc_prefix}. Consider optimizing your queryset using `.select_related()` or `.prefetch_related()`."


def detect_n_plus_one(
    queries: list[dict[str, Any]],
    threshold: int = 3,
    relationships: dict[str, str] | dict[str, dict[str, str]] | None = None,
    target_model: str | None = None,
) -> list[dict[str, Any]]:
    """Groups captured query logs by fingerprint and flags threshold breaches."""
    groups = defaultdict(list)
    for q in queries:
        fp = fingerprint(q["sql"])
        groups[fp].append(q)

    flags = []
    for fp, group in groups.items():
        if len(group) >= threshold and fp.strip().upper().startswith("SELECT"):
            # Extract src_loc if present in the captured query dictionary
            first_query = group[0]
            source_loc = first_query.get("src_loc")

            flags.append({
                "fingerprint": fp,
                "count": len(group),
                "src_loc": source_loc,
                "target_model": target_model,
                "suggestion": suggest_fix(
                    fp, relationships, src_loc=source_loc, target_model=target_model
                ),
                "sample_queries": [q["sql"] for q in group[:2]],
            })

    return flags