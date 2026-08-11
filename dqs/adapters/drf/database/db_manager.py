"""
Shadow Database Manager
========================

ELI5: DQS normally runs every profiled request inside a transaction savepoint
that rolls back automatically — that's the default and it means the real DB
is never touched. But some users want a *separate* database (a "shadow" DB
mirroring the real one) so they can profile against a fresh copy of the
schema without worrying about migration drift. This module is the gatekeeper
for that setup.

It checks two things on first run:
1. The shadow database alias (`dqs_shadow`) is defined in `settings.DATABASES`.
2. The `DQSRouter` is registered in `settings.DATABASE_ROUTERS`.

If both are present, it makes sure the shadow DB has the latest migrations
applied. If either is missing, we raise a clear error so the developer
knows what to add to their settings.

You can completely ignore this module if you're happy with the default
atomic-rollback sandbox on your `default` database.
"""

from __future__ import annotations

import logging
from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command

from dqs.adapters.drf.router import SHADOW_DB_ALIAS

logger = logging.getLogger("dqs.runner")


class ShadowDatabaseManager:
    """Validates the shadow DB config and keeps its schema up to date."""

    _validated: ClassVar[bool] = False
    ROUTER_PATH: ClassVar[str] = "dqs.adapters.drf.router.DQSRouter"

    @classmethod
    def ensure_initialized(cls) -> None:
        """Run the one-time setup: check config, apply any pending migrations."""
        cls.validate_configuration()
        cls.run_migrations()

    @classmethod
    def validate_configuration(cls) -> None:
        """
        Confirm the shadow DB alias and router are configured in settings.

        Called automatically by `ensure_initialized()`. Skips re-validation
        after the first successful run so it's cheap on subsequent calls.
        """
        if cls._validated:
            return

        if not getattr(settings, "DEBUG", False):
            raise ImproperlyConfigured("DaProfiler requires DEBUG=True for safety.")

        cls._validate_shadow_db_settings()
        cls._validate_router_settings()
        cls._validated = True

    @classmethod
    def _validate_shadow_db_settings(cls) -> None:
        """The `dqs_shadow` entry must exist in settings.DATABASES."""
        if SHADOW_DB_ALIAS not in settings.DATABASES:
            raise ImproperlyConfigured(
                f"[DaProfiler Setup Error] Shadow database '{SHADOW_DB_ALIAS}' is not defined in settings.DATABASES.\n"
                f"Please add a '{SHADOW_DB_ALIAS}' entry to DATABASES in your settings.py."
            )

    @classmethod
    def _validate_router_settings(cls) -> None:
        """The `DQSRouter` must be registered in settings.DATABASE_ROUTERS."""
        routers = getattr(settings, "DATABASE_ROUTERS", [])
        if cls.ROUTER_PATH not in routers:
            raise ImproperlyConfigured(
                f"[DaProfiler Setup Error] '{cls.ROUTER_PATH}' is missing from settings.DATABASE_ROUTERS.\n"
                f"Please add '{cls.ROUTER_PATH}' as the first entry in DATABASE_ROUTERS in your settings.py."
            )

    @staticmethod
    def run_migrations() -> None:
        """Run any pending migrations against the shadow database."""
        try:
            call_command("migrate", database=SHADOW_DB_ALIAS, interactive=False, verbosity=0)
        except Exception as exc:
            logger.warning("Failed to run migrations on %s: %s", SHADOW_DB_ALIAS, exc)
