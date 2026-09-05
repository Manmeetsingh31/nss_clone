import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from nss.models import College, NSSUnit


class Command(BaseCommand):
    help = "Create initial production NSS data."

    def handle(self, *args, **options):
        password = os.environ.get("INITIAL_PO_PASSWORD")

        if not password:
            self.stdout.write(
                self.style.WARNING(
                    "INITIAL_PO_PASSWORD is not set. Nothing to seed."
                )
            )
            return

        User = get_user_model()

        # -------------------------------------------------
        # 1. College
        # -------------------------------------------------
        college, college_created = College.objects.get_or_create(
            code="PUP",
            defaults={
                "name": "Punjabi University, Patiala",
                "address": "",
                "is_active": True,
            },
        )

        if college_created:
            self.stdout.write(
                self.style.SUCCESS(
                    "Created college: Punjabi University, Patiala"
                )
            )
        else:
            self.stdout.write(
                f"College already exists: {college}"
            )

        # -------------------------------------------------
        # 2. Programme Officer
        # -------------------------------------------------
        officer, officer_created = User.objects.get_or_create(
            username="manmeetbadhan3103@gmail.com",
            defaults={
                "email": "manmeetbadhan3103@gmail.com",
                "first_name": "Manmeet",
                "last_name": "Singh",
                "role": User.Role.PROGRAMME_OFFICER,
                "is_active": True,
            },
        )

        # Make sure existing user has the correct details
        officer.email = "manmeetbadhan3103@gmail.com"
        officer.first_name = "Manmeet"
        officer.last_name = "Singh"
        officer.role = User.Role.PROGRAMME_OFFICER
        officer.is_active = True

        if officer_created:
            officer.set_password(password)

        officer.save()

        if officer_created:
            self.stdout.write(
                self.style.SUCCESS(
                    "Created Programme Officer: "
                    "manmeetbadhan3103@gmail.com"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "Programme Officer already exists; password was not changed."
                )
            )

        # -------------------------------------------------
        # 3. NSS Unit
        # -------------------------------------------------
        unit, unit_created = NSSUnit.objects.get_or_create(
            college=college,
            unit_number=1,
            defaults={
                "name": "CSE27",
                "programme_officer": officer,
                "is_active": True,
            },
        )

        if not unit.programme_officer_id:
            unit.programme_officer = officer

        unit.name = "CSE27"
        unit.is_active = True
        unit.save()

        if unit_created:
            self.stdout.write(
                self.style.SUCCESS(
                    "Created NSS Unit 1: CSE27"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "NSS Unit 1 already exists; ensured PO assignment."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Production seed completed successfully."
            )
        )