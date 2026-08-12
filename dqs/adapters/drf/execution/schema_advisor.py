"""
Schema & Best-Practice Guideline Catalog
=========================================

This module is a static catalog of guidelines that a developer or AI agent
reads and applies to Django models and ORM usage. 

It does NOT inspect models dynamically or run heuristics at runtime, eliminating
false positives and avoiding runtime DB/model lookup overhead.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Literal

SeverityLevel = Literal["info", "recommendation", "strong-recommendation"]

@dataclass(frozen=True)
class SchemaGuideline:
    id: str  # e.g., "G-001"
    title: str  # e.g., "Add db_index=True on FK fields used in .filter()"
    severity: SeverityLevel
    rationale: str  # Why this rule exists
    applies_when: str  # Condition the developer or AI agent checks
    remediation: str  # Suggested ORM fix or pattern to apply

    def to_dict(self) -> dict[str, Any]:
        """Convert guideline instance to a dictionary for API/MCP serialization."""
        return asdict(self)


# Canonical List of Best-Practice Schema Guidelines
SCHEMA_GUIDELINES: list[SchemaGuideline] = [
    SchemaGuideline(
        id="G-001",
        title="Add `db_index=True` on fields frequently used in `.filter()` or `.exclude()`",
        severity="recommendation",
        rationale=(
            "Filtering or querying non-indexed columns forces a full table scan in SQL. "
            "Adding an index drastically improves read lookup times for large datasets."
        ),
        applies_when="A field is regularly referenced in queryset filters, lookups, or joins, but lacks `db_index=True` or `unique=True`.",
        remediation="Add `db_index=True` to the field definition or add a single/composite index in `Meta.indexes`.",
    ),
    SchemaGuideline(
        id="G-002",
        title="Use `Meta.indexes` for multi-column / composite lookups",
        severity="recommendation",
        rationale=(
            "Single-column indexes are inefficient for queries that filter across multiple columns simultaneously "
            "(e.g., `WHERE status = 'active' AND user_id = 10`). A composite index covers all target fields in one lookup."
        ),
        applies_when="Querysets frequently filter or order by two or more columns together.",
        remediation=(
            "Define composite indexes in the model Meta class:\n"
            "class Meta:\n"
            "    indexes = [\n"
            "        models.Index(fields=['status', 'created_at']),\n"
            "    ]"
        ),
    ),
    SchemaGuideline(
        id="G-003",
        title="Prefer UUIDv7 for write-heavy or public-facing primary keys",
        severity="strong-recommendation",
        rationale=(
            "Auto-increment integer PKs leak table size and business volume publicly (sequential ID enumeration). "
            "Unlike random UUIDv4, UUIDv7 is time-sortable, avoiding database index fragmentation on high-volume inserts."
        ),
        applies_when="Designing write-heavy models, public-facing API entities, or distributed systems.",
        remediation="Use a time-sortable UUID field (e.g., UUIDv7) as the primary key instead of AutoField/BigAutoField.",
    ),
    SchemaGuideline(
        id="G-004",
        title="Avoid `null=True` on string-based fields (`CharField` / `TextField`)",
        severity="recommendation",
        rationale=(
            "Allowing `null=True` on string fields creates two possible 'empty' states in the DB: `NULL` and `''` (empty string). "
            "Django convention uses the empty string exclusively for empty text fields."
        ),
        applies_when="A `CharField` or `TextField` is optional.",
        remediation="Set `blank=True` and omit `null=True` (use default `null=False`).",
    ),
    SchemaGuideline(
        id="G-005",
        title="Use `Meta.constraints` for database-level integrity rules",
        severity="recommendation",
        rationale=(
            "Application-level python validation (`clean()` or serializer checks) can be bypassed by concurrent writes or raw SQL. "
            "Database constraints enforce invariants at the DB driver level."
        ),
        applies_when="Enforcing multi-column uniqueness, positive value ranges, or conditional conditional uniqueness.",
        remediation=(
            "Add `UniqueConstraint` or `CheckConstraint` to `Meta.constraints`:\n"
            "class Meta:\n"
            "    constraints = [\n"
            "        models.UniqueConstraint(fields=['tenant', 'slug'], name='unique_tenant_slug')\n"
            "    ]"
        ),
    ),
    SchemaGuideline(
        id="G-006",
        title="Use `select_related` or `prefetch_related` for ForeignKeys accessed in loops",
        severity="recommendation",
        rationale=(
            "Accessing related model attributes inside a loop triggers a separate SQL query per iteration (N+1 query problem). "
            "Preloading relationships reduces N+1 queries down to 1 or 2 queries."
        ),
        applies_when="A view iterates over a queryset and accesses foreign key or many-to-many relationship fields.",
        remediation="Append `.select_related('fk_field')` (for 1:1 / 1:N) or `.prefetch_related('m2m_field')` (for N:M / inverse FK) to the base queryset.",
    ),
]


def get_schema_guidelines(as_dicts: bool = True) -> list[dict[str, Any]] | list[SchemaGuideline]:
    """
    Retrieve the full catalog of schema best-practice guidelines.

    :param as_dicts: If True, returns serialized dictionaries ready for JSON/MCP transport.
    """
    if as_dicts:
        return [guideline.to_dict() for guideline in SCHEMA_GUIDELINES]
    return SCHEMA_GUIDELINES