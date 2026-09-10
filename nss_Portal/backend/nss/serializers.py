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
    image_url = serializers.SerializerMethodField()
    programme_officer_image_url = serializers.SerializerMethodField()

    class Meta:
        model = NSSUnit
        fields = [
            "id",
            "name",
            "unit_number",
            "college",
            "college_name",
            "programme_officer_name",
            "image_url",
            "programme_officer_image_url",
        ]

    def get_programme_officer_name(self, obj):
        officer = obj.programme_officer

        if not officer:
            return ""

        return " ".join(
            part for part in [officer.first_name, officer.last_name]
            if part
        )

    def get_image_url(self, obj):
        return self._absolute_file_url(obj.image)

    def get_programme_officer_image_url(self, obj):
        officer = obj.programme_officer
        return self._absolute_file_url(
            officer.profile_image if officer else None
        )

    def _absolute_file_url(self, image):
        if not image:
            return None

        request = self.context.get("request")
        url = image.url
        return request.build_absolute_uri(url) if request else url


class ActivitySerializer(serializers.ModelSerializer):

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = "__all__"
        read_only_fields = ["image_url"]

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class EventSerializer(serializers.ModelSerializer):

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["image_url"]

    def get_image_url(self, obj):
        if obj.image_file:
            request = self.context.get("request")
            url = obj.image_file.url
            return request.build_absolute_uri(url) if request else url

        legacy_image = (obj.image or "").strip()
        if legacy_image.startswith(("http://", "https://")):
            return legacy_image

        if legacy_image.startswith("/"):
            request = self.context.get("request")
            return request.build_absolute_uri(legacy_image) if request else legacy_image

        if legacy_image.startswith(("images/", "media/")):
            return legacy_image

        return None


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
