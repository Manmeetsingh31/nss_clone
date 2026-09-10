import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Activity, Event, NSSUnit


logger = logging.getLogger(__name__)


def _schedule_delete(field_file, name=None):
    name = name or getattr(field_file, "name", None)
    if not field_file or not name:
        return

    def delete_file():
        try:
            field_file.storage.delete(name)
        except OSError:
            logger.exception("Unable to delete obsolete portal image: %s", name)

    transaction.on_commit(delete_file)


def _track_previous_image(sender, field_name):
    def handler(instance, **_):
        instance._previous_image_name = None
        if not instance.pk:
            return
        previous = sender.objects.filter(pk=instance.pk).only(field_name).first()
        if previous:
            instance._previous_image_name = getattr(previous, field_name).name

    return handler


def _remove_replaced_image(field_name):
    def handler(instance, **_):
        previous_name = getattr(instance, "_previous_image_name", None)
        current = getattr(instance, field_name)
        if previous_name and previous_name != current.name:
            _schedule_delete(current, previous_name)

    return handler


for model, field_name in (
    (NSSUnit, "image"),
    (Activity, "image"),
    (Event, "image_file"),
):
    pre_save.connect(_track_previous_image(model, field_name), sender=model)
    post_save.connect(_remove_replaced_image(field_name), sender=model)
    post_delete.connect(
        lambda instance, field=field_name, **_: _schedule_delete(
            getattr(instance, field)
        ),
        sender=model,
    )
