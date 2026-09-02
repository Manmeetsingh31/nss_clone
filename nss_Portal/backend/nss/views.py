from django.db import transaction
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    College,
    NSSUnit,
    Activity,
    ActivityParticipation,
    Event,
    EventParticipation,
)

from .serializers import (
    CollegeSerializer,
    NSSUnitSerializer,
    ActivitySerializer,
    EventSerializer,
    ActivityParticipationSerializer,
    EventParticipationSerializer,
)


# ============================================================
# HELPERS
# ============================================================

def is_programme_officer(user):
    return (
        user.is_authenticated
        and getattr(user, "role", None) == "PROGRAMME_OFFICER"
    )


def get_officer_units(user):
    return NSSUnit.objects.filter(
        programme_officer=user,
        is_active=True,
    )


def get_officer_unit(user):
    """
    Return the Programme Officer's active NSS unit.

    Currently the portal associates an officer with their
    active NSS unit. If no unit is assigned, return None.
    """

    return (
        get_officer_units(user)
        .order_by("unit_number")
        .first()
    )


# ============================================================
# COLLEGES
# ============================================================

class CollegeListView(generics.ListAPIView):

    queryset = College.objects.filter(
        is_active=True
    )

    serializer_class = CollegeSerializer


# ============================================================
# NSS UNITS
# ============================================================

class NSSUnitListView(generics.ListAPIView):

    serializer_class = NSSUnitSerializer

    def get_queryset(self):

        queryset = NSSUnit.objects.filter(
            is_active=True
        )

        college_id = self.request.query_params.get(
            "college"
        )

        if college_id:

            queryset = queryset.filter(
                college_id=college_id
            )

        return queryset


# ============================================================
# ACTIVITIES
# ============================================================

class ActivityListView(generics.ListAPIView):

    queryset = Activity.objects.filter(
        is_active=True
    )

    serializer_class = ActivitySerializer


class ActivityRegisterView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(self, request, activity_id):

        try:

            activity = Activity.objects.get(
                id=activity_id,
                is_active=True,
            )

        except Activity.DoesNotExist:

            return Response(
                {
                    "detail": "Activity not found."
                },
                status=404,
            )

        participation, created = (
            ActivityParticipation.objects.get_or_create(
                volunteer=request.user,
                activity=activity,
                defaults={
                    "attended": False,
                    "hours_awarded": 0,
                },
            )
        )

        if not created:

            return Response(
                {
                    "detail": (
                        "You are already registered "
                        "for this activity."
                    ),
                    "registered": True,
                }
            )

        return Response(
            {
                "detail": (
                    "Successfully registered "
                    "for the activity."
                ),
                "registered": True,
                "activity": activity.title,
            },
            status=201,
        )


# ============================================================
# PO — ACTIVITY MANAGEMENT
# ============================================================

class OfficerActivityListCreateView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(self, request):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        activities = Activity.objects.filter(
            nss_unit__programme_officer=request.user,
            nss_unit__is_active=True,
        ).order_by("-date")

        serializer = ActivitySerializer(
            activities,
            many=True,
        )

        return Response(
            serializer.data
        )

    def post(self, request):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        # ----------------------------------------------------
        # Automatically determine the officer's NSS unit.
        # The frontend does NOT need to send nss_unit.
        # ----------------------------------------------------

        unit = get_officer_unit(
            request.user
        )

        if unit is None:

            return Response(
                {
                    "detail": (
                        "No active NSS unit is assigned "
                        "to this Programme Officer."
                    )
                },
                status=400,
            )

        # ----------------------------------------------------
        # Build serializer data.
        #
        # We inject the trusted unit ID on the backend rather
        # than trusting a unit supplied by the browser.
        # ----------------------------------------------------

        data = request.data.copy()

        data["nss_unit"] = unit.id

        serializer = ActivitySerializer(
            data=data
        )

        if serializer.is_valid():

            activity = serializer.save(
                nss_unit=unit
            )

            return Response(
                ActivitySerializer(
                    activity
                ).data,
                status=201,
            )

        return Response(
            serializer.errors,
            status=400,
        )


class OfficerActivityDetailView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_activity(
        self,
        request,
        activity_id
    ):

        try:

            return Activity.objects.get(
                id=activity_id,
                nss_unit__programme_officer=request.user,
                nss_unit__is_active=True,
            )

        except Activity.DoesNotExist:

            return None

    def put(
        self,
        request,
        activity_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        activity = self.get_activity(
            request,
            activity_id,
        )

        if not activity:

            return Response(
                {
                    "detail": "Activity not found."
                },
                status=404,
            )

        data = request.data.copy()

        # Never allow the officer to move an activity
        # to another NSS unit.

        data["nss_unit"] = activity.nss_unit.id

        serializer = ActivitySerializer(
            activity,
            data=data,
            partial=True,
        )

        if serializer.is_valid():

            activity = serializer.save(
                nss_unit=activity.nss_unit
            )

            return Response(
                ActivitySerializer(
                    activity
                ).data
            )

        return Response(
            serializer.errors,
            status=400,
        )

    def delete(
        self,
        request,
        activity_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        activity = self.get_activity(
            request,
            activity_id,
        )

        if not activity:

            return Response(
                {
                    "detail": "Activity not found."
                },
                status=404,
            )

        activity.is_active = False

        activity.save(
            update_fields=[
                "is_active"
            ]
        )

        return Response(
            {
                "detail": "Activity deleted."
            }
        )


# ============================================================
# PO — ACTIVITY REGISTRATIONS
# ============================================================

class OfficerActivityParticipantsView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(
        self,
        request,
        activity_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        try:

            activity = Activity.objects.get(
                id=activity_id,
                nss_unit__programme_officer=request.user,
                nss_unit__is_active=True,
            )

        except Activity.DoesNotExist:

            return Response(
                {
                    "detail": "Activity not found."
                },
                status=404,
            )

        participations = (
            ActivityParticipation.objects
            .filter(
                activity=activity
            )
            .select_related(
                "volunteer"
            )
        )

        serializer = ActivityParticipationSerializer(
            participations,
            many=True,
        )

        return Response(
            serializer.data
        )


# ============================================================
# PO — ACTIVITY ATTENDANCE
# ============================================================

class OfficerActivityAttendanceView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def patch(
        self,
        request,
        participation_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        try:

            participation = (
                ActivityParticipation.objects
                .select_related(
                    "activity__nss_unit"
                )
                .get(
                    id=participation_id,
                    activity__nss_unit__programme_officer=(
                        request.user
                    ),
                )
            )

        except ActivityParticipation.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Activity participation "
                        "not found."
                    )
                },
                status=404,
            )

        attended = request.data.get(
            "attended"
        )

        if attended is not None:

            # Handle JSON booleans properly.
            if isinstance(attended, bool):

                participation.attended = attended

            else:

                participation.attended = (
                    str(attended).lower()
                    in ["true", "1", "yes"]
                )

        hours_awarded = request.data.get(
            "hours_awarded"
        )

        if hours_awarded is not None:

            try:

                hours_awarded = int(
                    hours_awarded
                )

            except (
                TypeError,
                ValueError
            ):

                return Response(
                    {
                        "detail": (
                            "hours_awarded "
                            "must be a number."
                        )
                    },
                    status=400,
                )

            if hours_awarded < 0:

                return Response(
                    {
                        "detail": (
                            "hours_awarded "
                            "cannot be negative."
                        )
                    },
                    status=400,
                )

            participation.hours_awarded = (
                hours_awarded
            )

        participation.save()

        serializer = ActivityParticipationSerializer(
            participation
        )

        return Response(
            serializer.data
        )


# ============================================================
# EVENTS
# ============================================================

class EventListView(generics.ListAPIView):

    permission_classes = [
        permissions.AllowAny
    ]

    queryset = Event.objects.all()

    serializer_class = EventSerializer


class EventRegisterView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(
        self,
        request,
        event_id
    ):

        try:

            event = Event.objects.get(
                id=event_id
            )

        except Event.DoesNotExist:

            return Response(
                {
                    "detail": "Event not found."
                },
                status=404,
            )

        participation, created = (
            EventParticipation.objects.get_or_create(
                volunteer=request.user,
                event=event,
                defaults={
                    "attended": False,
                },
            )
        )

        if not created:

            return Response(
                {
                    "detail": (
                        "You are already registered "
                        "for this event."
                    ),
                    "registered": True,
                }
            )

        return Response(
            {
                "detail": (
                    "Successfully registered "
                    "for the event."
                ),
                "registered": True,
                "event": event.title,
            },
            status=201,
        )


# ============================================================
# PO — EVENT MANAGEMENT
# ============================================================

class OfficerEventListCreateView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(self, request):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        events = Event.objects.filter(
            nss_unit__programme_officer=request.user,
            nss_unit__is_active=True,
        ).order_by("-date")

        serializer = EventSerializer(
            events,
            many=True,
        )

        return Response(
            serializer.data
        )

    def post(self, request):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        # ----------------------------------------------------
        # Automatically determine the officer's NSS unit.
        # ----------------------------------------------------

        unit = get_officer_unit(
            request.user
        )

        if unit is None:

            return Response(
                {
                    "detail": (
                        "No active NSS unit is assigned "
                        "to this Programme Officer."
                    )
                },
                status=400,
            )

        # ----------------------------------------------------
        # Inject the trusted unit into serializer data.
        # ----------------------------------------------------

        data = request.data.copy()

        data["nss_unit"] = unit.id

        serializer = EventSerializer(
            data=data
        )

        if serializer.is_valid():

            event = serializer.save(
                nss_unit=unit
            )

            return Response(
                EventSerializer(
                    event
                ).data,
                status=201,
            )

        return Response(
            serializer.errors,
            status=400,
        )


class OfficerEventDetailView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_event(
        self,
        request,
        event_id
    ):

        try:

            return Event.objects.get(
                id=event_id,
                nss_unit__programme_officer=request.user,
                nss_unit__is_active=True,
            )

        except Event.DoesNotExist:

            return None

    def put(
        self,
        request,
        event_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        event = self.get_event(
            request,
            event_id,
        )

        if not event:

            return Response(
                {
                    "detail": "Event not found."
                },
                status=404,
            )

        data = request.data.copy()

        # Never allow the officer to move an event
        # to another NSS unit.

        data["nss_unit"] = event.nss_unit.id

        serializer = EventSerializer(
            event,
            data=data,
            partial=True,
        )

        if serializer.is_valid():

            event = serializer.save(
                nss_unit=event.nss_unit
            )

            return Response(
                EventSerializer(
                    event
                ).data
            )

        return Response(
            serializer.errors,
            status=400,
        )

    def delete(
        self,
        request,
        event_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        event = self.get_event(
            request,
            event_id,
        )

        if not event:

            return Response(
                {
                    "detail": "Event not found."
                },
                status=404,
            )

        event.status = "Cancelled"

        event.save(
            update_fields=[
                "status"
            ]
        )

        return Response(
            {
                "detail": "Event cancelled."
            }
        )


# ============================================================
# PO — EVENT REGISTRATIONS
# ============================================================

class OfficerEventParticipantsView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(
        self,
        request,
        event_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        try:

            event = Event.objects.get(
                id=event_id,
                nss_unit__programme_officer=request.user,
                nss_unit__is_active=True,
            )

        except Event.DoesNotExist:

            return Response(
                {
                    "detail": "Event not found."
                },
                status=404,
            )

        participations = (
            EventParticipation.objects
            .filter(
                event=event
            )
            .select_related(
                "volunteer"
            )
        )

        serializer = EventParticipationSerializer(
            participations,
            many=True,
        )

        return Response(
            serializer.data
        )


# ============================================================
# PO — EVENT ATTENDANCE
# ============================================================

class OfficerEventAttendanceView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def patch(
        self,
        request,
        participation_id
    ):

        if not is_programme_officer(
            request.user
        ):

            return Response(
                {
                    "detail": (
                        "Programme Officer access required."
                    )
                },
                status=403,
            )

        try:

            participation = (
                EventParticipation.objects
                .select_related(
                    "event__nss_unit"
                )
                .get(
                    id=participation_id,
                    event__nss_unit__programme_officer=(
                        request.user
                    ),
                )
            )

        except EventParticipation.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Event participation "
                        "not found."
                    )
                },
                status=404,
            )

        attended = request.data.get(
            "attended"
        )

        if attended is not None:

            if isinstance(attended, bool):

                participation.attended = attended

            else:

                participation.attended = (
                    str(attended).lower()
                    in ["true", "1", "yes"]
                )

        participation.save()

        serializer = EventParticipationSerializer(
            participation
        )

        return Response(
            serializer.data
        )