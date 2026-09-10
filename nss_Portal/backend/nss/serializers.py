from rest_framework import serializers

from .models import (
    College,
    NSSUnit,
    Activity,
    ActivityParticipation,
    Event,
    EventParticipation,
)


class CollegeSerializer(serializers.ModelSerializer):

    class Meta:
        model = College
        fields = ["id", "name", "code"]


class NSSUnitSerializer(serializers.ModelSerializer):

    college_name = serializers.CharField(
        source="college.name",
        read_only=True,
    )
    programme_officer_name = serializers.SerializerMethodField()

    class Meta:
        model = NSSUnit
        fields = [
            "id",
            "name",
            "unit_number",
            "college",
            "college_name",
            "programme_officer_name",
        ]

    def get_programme_officer_name(self, obj):
        officer = obj.programme_officer

        if not officer:
            return ""

        return " ".join(
            part for part in [officer.first_name, officer.last_name]
            if part
        )


class ActivitySerializer(serializers.ModelSerializer):

    class Meta:
        model = Activity
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Event
        fields = "__all__"


class ActivityParticipationSerializer(serializers.ModelSerializer):

    volunteer_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityParticipation
        fields = [
            "id",
            "volunteer",
            "volunteer_name",
            "activity",
            "attended",
            "hours_awarded",
            "registered_at",
        ]
        read_only_fields = [
            "id",
            "registered_at",
            "volunteer_name",
        ]

    def get_volunteer_name(self, obj):
        user = obj.volunteer

        return (
            getattr(user, "name", None)
            or f"{getattr(user, 'first_name', '')} "
               f"{getattr(user, 'last_name', '')}".strip()
            or getattr(user, "email", "")
        )


class EventParticipationSerializer(serializers.ModelSerializer):

    volunteer_name = serializers.SerializerMethodField()

    class Meta:
        model = EventParticipation
        fields = [
            "id",
            "volunteer",
            "volunteer_name",
            "event",
            "attended",
            "registered_at",
        ]
        read_only_fields = [
            "id",
            "registered_at",
            "volunteer_name",
        ]

    def get_volunteer_name(self, obj):
        user = obj.volunteer

        return (
            getattr(user, "name", None)
            or f"{getattr(user, 'first_name', '')} "
               f"{getattr(user, 'last_name', '')}".strip()
            or getattr(user, "email", "")
        )
