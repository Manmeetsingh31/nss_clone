import os

from django.core.management import call_command
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer


class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            return Response(
                serializer.save(),
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ProductionSeedView(APIView):

    def post(self, request):
        expected_token = os.environ.get("PRODUCTION_SEED_TOKEN")
        supplied_token = request.headers.get("X-Seed-Token")

        if not expected_token:
            return Response(
                {"detail": "Seed endpoint is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if supplied_token != expected_token:
            return Response(
                {"detail": "Unauthorized."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            call_command("seed_production")

            return Response(
                {"detail": "Production seed completed."},
                status=status.HTTP_200_OK,
            )

        except Exception as exc:
            return Response(
                {"detail": f"Seed failed: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )