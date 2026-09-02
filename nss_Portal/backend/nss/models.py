from django.conf import settings
from django.db import models


class College(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class NSSUnit(models.Model):
    college = models.ForeignKey(
        College,
        on_delete=models.CASCADE,
        related_name="nss_units",
    )
    unit_number = models.PositiveIntegerField()
    name = models.CharField(max_length=100)
    programme_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_nss_units",
        limit_choices_to={"role": "PROGRAMME_OFFICER"},
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["college", "unit_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["college", "unit_number"],
                name="unique_unit_per_college",
            )
        ]

    def __str__(self):
        return f"{self.college.code} - Unit {self.unit_number}: {self.name}"

class Activity(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    nss_unit = models.ForeignKey(
        NSSUnit,
        on_delete=models.CASCADE,
        related_name="activities",
    )

    date = models.DateField()
    location = models.CharField(max_length=200, blank=True)

    hours = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title

class ActivityParticipation(models.Model):
    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_participations",
    )

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="participations",
    )

    attended = models.BooleanField(default=False)

    hours_awarded = models.PositiveIntegerField(default=0)

    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["volunteer", "activity"],
                name="unique_volunteer_activity",
            )
        ]

    def __str__(self):
        return (
            f"{self.volunteer} - "
            f"{self.activity.title}"
        )
        
class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    nss_unit = models.ForeignKey(
        NSSUnit,
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )

    date = models.DateField()
    time = models.CharField(max_length=50)
    venue = models.CharField(max_length=200)
    organizer = models.CharField(max_length=200)

    status = models.CharField(
        max_length=100,
        default="Registration Open"
    )

    image = models.CharField(
        max_length=255,
        blank=True
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title


class EventParticipation(models.Model):
    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_participations",
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="participations",
    )

    attended = models.BooleanField(default=False)

    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["volunteer", "event"],
                name="unique_volunteer_event",
            )
        ]

    def __str__(self):
        return (
            f"{self.volunteer} - "
            f"{self.event.title}"
        )