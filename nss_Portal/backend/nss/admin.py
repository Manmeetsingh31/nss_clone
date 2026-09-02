from django.contrib import admin

from .models import (
    College,
    NSSUnit,
    Activity,
    ActivityParticipation,
    Event,
    EventParticipation,
)


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )

    list_filter = (
        "is_active",
    )


@admin.register(NSSUnit)
class NSSUnitAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "unit_number",
        "college",
        "programme_officer",
        "is_active",
    )

    search_fields = (
        "name",
        "college__name",
        "college__code",
    )

    list_filter = (
        "is_active",
        "college",
    )


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "nss_unit",
        "date",
        "location",
        "hours",
        "is_active",
    )

    search_fields = (
        "title",
        "description",
        "location",
    )

    list_filter = (
        "is_active",
        "nss_unit",
        "date",
    )

    ordering = (
        "-date",
    )


@admin.register(ActivityParticipation)
class ActivityParticipationAdmin(admin.ModelAdmin):

    list_display = (
        "volunteer",
        "activity",
        "attended",
        "hours_awarded",
        "registered_at",
    )

    search_fields = (
        "volunteer__email",
        "volunteer__first_name",
        "volunteer__last_name",
        "activity__title",
    )

    list_filter = (
        "attended",
        "activity",
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "date",
        "time",
        "venue",
        "organizer",
        "status",
    )

    search_fields = (
        "title",
        "venue",
        "organizer",
        "description",
    )

    list_filter = (
        "status",
        "date",
    )

    ordering = (
        "-date",
    )


@admin.register(EventParticipation)
class EventParticipationAdmin(admin.ModelAdmin):

    list_display = (
        "volunteer",
        "event",
        "attended",
        "registered_at",
    )

    search_fields = (
        "volunteer__email",
        "volunteer__first_name",
        "volunteer__last_name",
        "event__title",
    )

    list_filter = (
        "attended",
        "event",
    )