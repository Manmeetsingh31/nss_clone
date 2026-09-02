from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from nss.models import (
    College,
    NSSUnit,
    ActivityParticipation,
    EventParticipation,
)

from .models import VolunteerProfile


User = get_user_model()


# ============================================================
# VOLUNTEER REGISTRATION
# ============================================================

class VolunteerRegistrationSerializer(serializers.Serializer):

    first_name = serializers.CharField(max_length=150)

    last_name = serializers.CharField(max_length=150)

    college = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.filter(is_active=True)
    )

    nss_unit = serializers.PrimaryKeyRelatedField(
        queryset=NSSUnit.objects.filter(is_active=True)
    )

    contact = serializers.CharField(max_length=20)

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    enrollment_number = serializers.CharField(
        max_length=100
    )

    department = serializers.CharField(
        max_length=150
    )

    semester = serializers.IntegerField(
        min_value=1,
        max_value=8
    )

    gender = serializers.ChoiceField(
        choices=VolunteerProfile.Gender.choices,
        required=False,
    )

    emergency_contact = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )

    address = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    interests = serializers.CharField(
        required=False,
        allow_blank=True,
    )


    def validate_email(self, value):

        if User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value.lower()


    def validate_enrollment_number(self, value):

        if VolunteerProfile.objects.filter(
            enrollment_number__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "This enrollment number is already registered."
            )

        return value


    def validate(self, attrs):

        college = attrs["college"]
        nss_unit = attrs["nss_unit"]

        if nss_unit.college_id != college.id:

            raise serializers.ValidationError({
                "nss_unit":
                    "This NSS unit does not belong to the selected college."
            })

        return attrs


    def create(self, validated_data):

        password = validated_data.pop("password")

        email = validated_data.pop("email")

        first_name = validated_data.pop("first_name")

        last_name = validated_data.pop("last_name")


        with transaction.atomic():

            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                role=User.Role.VOLUNTEER,
            )

            volunteer = VolunteerProfile.objects.create(
                user=user,
                **validated_data,
            )

        return volunteer


# ============================================================
# VOLUNTEER ME / DASHBOARD
# ============================================================

class VolunteerMeSerializer(serializers.ModelSerializer):

    name = serializers.CharField(
        source="user.get_full_name",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    role = serializers.CharField(
        source="user.role",
        read_only=True
    )

    college = serializers.CharField(
        source="college.name",
        read_only=True
    )

    college_code = serializers.CharField(
        source="college.code",
        read_only=True
    )

    nss_unit = serializers.CharField(
        source="nss_unit.name",
        read_only=True
    )

    unit_number = serializers.IntegerField(
        source="nss_unit.unit_number",
        read_only=True
    )

    # ========================================================
    # ACTIVITY STATISTICS
    # ========================================================

    activities_registered = serializers.SerializerMethodField()

    activities_completed = serializers.SerializerMethodField()

    service_hours = serializers.SerializerMethodField()

    registered_activity_ids = serializers.SerializerMethodField()

    # ========================================================
    # EVENT STATISTICS
    # ========================================================

    events_registered = serializers.SerializerMethodField()

    events_attended = serializers.SerializerMethodField()

    registered_event_ids = serializers.SerializerMethodField()


    # ========================================================
    # ACTIVITY METHODS
    # ========================================================

    def get_activities_registered(self, obj):

        return obj.user.activity_participations.count()


    def get_activities_completed(self, obj):

        return obj.user.activity_participations.filter(
            attended=True
        ).count()


    def get_service_hours(self, obj):

        return sum(
            participation.hours_awarded
            for participation
            in obj.user.activity_participations.all()
        )


    def get_registered_activity_ids(self, obj):

        return list(
            obj.user.activity_participations.values_list(
                "activity_id",
                flat=True
            )
        )


    # ========================================================
    # EVENT METHODS
    # ========================================================

    def get_events_registered(self, obj):

        return obj.user.event_participations.count()


    def get_events_attended(self, obj):

        return obj.user.event_participations.filter(
            attended=True
        ).count()


    def get_registered_event_ids(self, obj):

        return list(
            obj.user.event_participations.values_list(
                "event_id",
                flat=True
            )
        )


    class Meta:

        model = VolunteerProfile

        fields = [

            "id",

            "name",
            "email",
            "role",

            "college",
            "college_code",

            "nss_unit",
            "unit_number",

            "contact",
            "enrollment_number",
            "department",
            "semester",
            "gender",
            "emergency_contact",
            "address",
            "interests",
            "joined_at",

            # Activity dashboard data
            "activities_registered",
            "activities_completed",
            "service_hours",
            "registered_activity_ids",

            # Event dashboard data
            "events_registered",
            "events_attended",
            "registered_event_ids",
        ]


# ============================================================
# VOLUNTEER REGISTERED ACTIVITIES
# ============================================================

class VolunteerActivitySerializer(serializers.ModelSerializer):

    activity_id = serializers.IntegerField(
        source="activity.id",
        read_only=True
    )

    title = serializers.CharField(
        source="activity.title",
        read_only=True
    )

    description = serializers.CharField(
        source="activity.description",
        read_only=True
    )

    date = serializers.DateField(
        source="activity.date",
        read_only=True
    )

    location = serializers.CharField(
        source="activity.location",
        read_only=True
    )

    hours = serializers.IntegerField(
        source="activity.hours",
        read_only=True
    )


    class Meta:

        model = ActivityParticipation

        fields = [

            "id",

            "activity_id",

            "title",

            "description",

            "date",

            "location",

            "hours",

            "attended",

            "hours_awarded",

            "registered_at",
        ]


# ============================================================
# VOLUNTEER REGISTERED EVENTS
# ============================================================

class VolunteerEventSerializer(serializers.ModelSerializer):

    event_id = serializers.IntegerField(
        source="event.id",
        read_only=True
    )

    title = serializers.CharField(
        source="event.title",
        read_only=True
    )

    date = serializers.DateField(
        source="event.date",
        read_only=True
    )

    time = serializers.CharField(
        source="event.time",
        read_only=True
    )

    venue = serializers.CharField(
        source="event.venue",
        read_only=True
    )

    organizer = serializers.CharField(
        source="event.organizer",
        read_only=True
    )

    description = serializers.CharField(
        source="event.description",
        read_only=True
    )

    status = serializers.CharField(
        source="event.status",
        read_only=True
    )

    image = serializers.CharField(
        source="event.image",
        read_only=True
    )


    class Meta:

        model = EventParticipation

        fields = [

            "id",

            "event_id",

            "title",

            "date",

            "time",

            "venue",

            "organizer",

            "description",

            "status",

            "image",

            "attended",

            "registered_at",
        ]