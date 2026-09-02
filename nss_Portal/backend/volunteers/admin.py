from django.contrib import admin

from .models import VolunteerProfile


@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "enrollment_number",
        "college",
        "nss_unit",
        "department",
        "semester",
        "joined_at",
    )

    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "enrollment_number",
        "contact",
    )

    list_filter = (
        "college",
        "nss_unit",
        "department",
        "semester",
        "gender",
    )