"""
Django AppConfig for the DQS DRF adapter.

ELI5: This is the registration card Django reads when our app shows up in
`INSTALLED_APPS`. The important job is the safety check in `ready()`:
the moment Django starts, we look at `settings.DEBUG` and refuse to run
if it's False. DQS is a developer tool — having it accidentally loaded
in production is exactly the kind of thing we want to crash loudly about,
not silently allow.
"""

from django.apps import AppConfig
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class DQSConfig(AppConfig):
    name = "dqs.adapters.drf"
    label = "dqs_drf"
    verbose_name = "Da Profiler"

    def ready(self) -> None:
        # Hard stop: DQS must never run in production.
        if not getattr(settings, "DEBUG", False):
            raise ImproperlyConfigured(
                "DQS is loaded but DEBUG is False. Da Profiler is a development tool "
                "that must strictly be run in development environments."
            )
