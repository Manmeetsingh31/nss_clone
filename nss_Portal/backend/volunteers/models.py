from django.conf import settings
from django.db import models

from nss.models import College, NSSUnit


class VolunteerProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"
        NOT_SPECIFIED = "NOT_SPECIFIED", "Prefer not to say"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="volunteer_profile",
    )

    college = models.ForeignKey(
        College,
        on_delete=models.PROTECT,
        related_name="volunteers",
    )

    nss_unit = models.ForeignKey(
        NSSUnit,
        on_delete=models.PROTECT,
        related_name="volunteers",
    )

    contact = models.CharField(max_length=20)
    enrollment_number = models.CharField(max_length=100, unique=True)
    department = models.CharField(max_length=150)
    semester = models.PositiveSmallIntegerField(
    choices=[(i, f"Semester {i}") for i in range(1, 9)]
)

    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        default=Gender.NOT_SPECIFIED,
    )

    emergency_contact = models.CharField(
        max_length=20,
        blank=True,
    )

    address = models.TextField(blank=True)
    interests = models.TextField(blank=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.user.get_full_name()} "
            f"({self.enrollment_number})"
        )