"""
Shadow DB Router & Profiling Session Context
=============================================

ELI5: The router is a switch that tells Django "send all ORM operations to
the shadow database while profiling is active." It's a Django database
router (a class Django consults before every read/write) that only changes
behavior when we've wrapped code in a `profiling_session()` block.

The default profiling mode (atomic savepoint on the `default` DB) doesn't
need this router at all — the router is only used by users who opt into
the shadow DB setup. If you stick with the default, you can ignore
everything in this file except the existence of `SHADOW_DB_ALIAS`.
"""

from __future__ import annotations

import contextlib
import threading

# Alias for the optional shadow DB. Hard-coded so we don't need a settings
# import cycle (settings depends on the adapter, the adapter depends on
# this constant).
SHADOW_DB_ALIAS = "dqs_shadow"

# Per-thread flag: is the shadow DB routing currently active?
_local = threading.local()


class DQSRouter:
    """A Django DB router that redirects traffic to the shadow DB during a profiling session."""

    @classmethod
    def set_active(cls, active: bool) -> None:
        """Turn shadow-DB routing on/off for the current thread."""
        _local.active = active

    @classmethod
    def is_active(cls) -> bool:
        """True if the current thread is inside a `profiling_session()` block."""
        return getattr(_local, "active", False)

    def db_for_read(self, model: type, **hints: object) -> str | None:
        """Route reads to the shadow DB when profiling is active."""
        return SHADOW_DB_ALIAS if self.is_active() else None

    def db_for_write(self, model: type, **hints: object) -> str | None:
        """Route writes to the shadow DB when profiling is active."""
        return SHADOW_DB_ALIAS if self.is_active() else None

    def allow_relation(self, obj1: object, obj2: object, **hints: object) -> bool | None:
        """Allow relations between shadow-DB objects while profiling."""
        return True if self.is_active() else None

    def allow_migrate(self, db: str, app_label: str, model_name: str | None = None, **hints: object) -> bool | None:
        """Only allow migrations on the shadow DB when profiling is active."""
        if db == SHADOW_DB_ALIAS:
            return True
        if self.is_active():
            return db == SHADOW_DB_ALIAS
        return None


@contextlib.contextmanager
def profiling_session():
    """
    Activate shadow-DB routing for the duration of a `with` block.

    ELI5: Walk into the kitchen (start the block), flip the routing switch,
    do your work, flip the switch back, walk out. Any exception inside the
    block still flips the switch back off so we don't leak state.

    The default `execute_request(sandbox=True)` path does NOT use this — it
    uses atomic rollback on the default DB instead. This context manager
    is here for the legacy/optional shadow DB workflow.
    """
    DQSRouter.set_active(True)
    try:
        yield
    finally:
        DQSRouter.set_active(False)
