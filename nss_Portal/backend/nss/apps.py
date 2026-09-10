from django.apps import AppConfig


class NssConfig(AppConfig):
    name = 'nss'

    def ready(self):
        import nss.signals  # noqa: F401
