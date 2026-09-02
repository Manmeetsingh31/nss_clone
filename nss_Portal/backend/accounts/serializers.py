from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    role = serializers.ChoiceField(
        choices=User.Role.choices
    )

    def validate(self, attrs):
        email = attrs["email"].lower()
        password = attrs["password"]
        role = attrs["role"]

        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        if user.role != role:
            raise serializers.ValidationError(
                "This account cannot use this login type."
            )

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "name": user.get_full_name(),
                "email": user.email,
                "role": user.role,
            },
        }

    def create(self, validated_data):
        user = validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "name": user.get_full_name(),
                "email": user.email,
                "role": user.role,
            },
        }