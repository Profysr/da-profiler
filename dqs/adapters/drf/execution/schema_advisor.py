"""
Schema-level Static Checks
==========================

ELI5: The static_advisor.py module looks at one file at a time and flags
patterns ("calling .filter() inside a loop"). This module is the next level
up: it looks at your Django *model* definitions and compares them against
how your code actually queries them. Two checks:

1. **PK strategy** — Are you using an auto-increment integer primary key on
   a write-heavy table? Consider switching to UUIDv7: it's still sortable
   (unlike UUIDv4), but it doesn't leak how many records you have and it
   plays nicer with distributed writes.

2. **Missing indexes** — Is your code calling `.filter(status="active")`
   but the `status` column has no index? That'll get slow fast. We cross-
   reference the fields you actually filter/sort on against the model's
   declared indexes and flag the gaps.

No database connection is required — we just read Python class metadata.
"""

from __future__ import annotations
from typing import Any
from django.apps import apps

# Auto-increment integer PK types — the case the schema advisor flags.
# UUIDv7 is recommended as an alternative (sortable, no enumeration leak,
# friendly to distributed inserts).
AUTO_INCREMENT_PK_TYPES: set[str] = {"AutoField", "BigAutoField", "SmallAutoField"}

def check_pk_strategy(model_path: str | None) -> list[dict[str, Any]]:
    """
    Flag a model if it uses an auto-increment integer PK.

    ELI5: We look up the model, ask "what kind of primary key do you use?",
    and if it's a plain auto-increment integer, we suggest UUIDv7 as a
    more modern alternative. Returns a one-item list with a warning, or [].
    """
    if not model_path:
        return []
    try:
        app_label, model_name = model_path.split(".")
        model = apps.get_model(app_label, model_name)
    except Exception:
        return []

    pk_type = model._meta.pk.get_internal_type()
    if pk_type not in AUTO_INCREMENT_PK_TYPES:
        return []

    return [{
        "type": "PK_STRATEGY_ADVICE",
        "message": (
            f"Model '{model_path}' uses an auto-increment integer PK ('{pk_type}'). "
            f"For write-heavy or distributed workloads, consider a UUIDv7 PK instead — "
            f"it's sortable (unlike UUIDv4) and avoids sequential-ID contention/enumeration issues."
        ),
        "severity": "low",
        "model": model_path,
    }]


def check_missing_indexes(model_path: str | None, queried_fields: list[str]) -> list[dict[str, Any]]:
    """
    Cross-reference fields used in `.filter()`/`.exclude()`/`.order_by()` against
    the model's actual indexes and flag the unindexed ones.

    ELI5: We get two lists — "fields the code filters on" and "fields the
    database has indexed" — and emit a warning for every field that's in
    the first list but not the second. Empty list means everything's fine.

    A field counts as "indexed" if any of these is true:
    - it has `db_index=True`,
    - it has `unique=True` (which implicitly creates an index),
    - it appears in any `Meta.indexes` entry.
    The primary key is always considered indexed.
    """
    if not model_path or not queried_fields:
        return []
    try:
        app_label, model_name = model_path.split(".")
        model = apps.get_model(app_label, model_name)
    except Exception:
        return []

    indexed_field_names: set[str] = set()

    # db_index=True and unique=True both imply an index exists.
    for field in model._meta.get_fields():
        if getattr(field, "db_index", False) or getattr(field, "unique", False):
            indexed_field_names.add(field.name)

    # Meta.indexes lists compound indexes — include every column they touch.
    for index in getattr(model._meta, "indexes", []):
        indexed_field_names.update(index.fields)

    # The primary key is always indexed by the database engine itself.
    indexed_field_names.add(model._meta.pk.name)

    findings: list[dict[str, Any]] = []
    for field_name in set(queried_fields):
        # Strip order_by("-") prefix and ORM lookup suffixes ("__gte", etc.).
        clean_name = field_name.lstrip("-").split("__")[0]
        if clean_name and clean_name not in indexed_field_names:
            findings.append({
                "type": "MISSING_INDEX",
                "message": (
                    f"Field '{clean_name}' on model '{model_path}' is queried via filter/exclude/order_by "
                    f"but has no index (db_index, unique, or Meta.indexes entry). Consider adding one if "
                    f"this field is queried frequently or the table is large."
                ),
                "severity": "medium",
                "model": model_path,
                "field": clean_name,
            })
    return findings
