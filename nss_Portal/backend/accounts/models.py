from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        VOLUNTEER = "VOLUNTEER", "Volunteer"
        PROGRAMME_OFFICER = "PROGRAMME_OFFICER", "Programme Officer"

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.VOLUNTEER,
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"