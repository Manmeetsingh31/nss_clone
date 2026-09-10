import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import User


logger = logging.getLogger(__name__)


@receiver(pre_save, sender=User)
def track_previous_profile_image(sender, instance, **_):
    instance._previous_profile_image_name = None
    if not instance.pk:
        return
    previous = sender.objects.filter(pk=instance.pk).only("profile_image").first()
    if previous:
        instance._previous_profile_image_name = previous.profile_image.name


@receiver(post_save, sender=User)
def remove_replaced_profile_image(sender, instance, **_):
    previous_name = getattr(instance, "_previous_profile_image_name", None)
    if previous_name and previous_name != instance.profile_image.name:
        instance.profile_image.storage.delete(previous_name)


@receiver(post_delete, sender=User)
def remove_deleted_profile_image(sender, instance, **_):
    image = instance.profile_image
    if not image or not image.name:
        return

    def delete_file():
        try:
            image.storage.delete(image.name)
        except OSError:
            logger.exception("Unable to delete profile image: %s", image.name)

    transaction.on_commit(delete_file)
