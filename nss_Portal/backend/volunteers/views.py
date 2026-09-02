from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    VolunteerRegistrationSerializer,
    VolunteerMeSerializer,
    VolunteerActivitySerializer,
)

from .models import VolunteerProfile
from nss.models import ActivityParticipation


class VolunteerRegistrationView(APIView):

    def post(self, request):
        serializer = VolunteerRegistrationSerializer(
            data=request.data
        )

        if serializer.is_valid():
            volunteer = serializer.save()

            return Response(
                {
                    "message": "Volunteer registration successful.",
                    "volunteer_id": volunteer.id,
                    "email": volunteer.user.email,
                    "name": volunteer.user.get_full_name(),
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class VolunteerMeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            profile = request.user.volunteer_profile

        except VolunteerProfile.DoesNotExist:

            return Response(
                {"detail": "Volunteer profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = VolunteerMeSerializer(profile)

        return Response(serializer.data)


class VolunteerActivitiesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        participations = (
            ActivityParticipation.objects
            .filter(volunteer=request.user)
            .select_related("activity")
        )

        serializer = VolunteerActivitySerializer(
            participations,
            many=True
        )

        return Response(serializer.data)