from django.urls import path

from .views import (
    VolunteerRegistrationView,
    VolunteerMeView,
    VolunteerActivitiesView,
)


urlpatterns = [

    path(
        "register/",
        VolunteerRegistrationView.as_view(),
        name="volunteer-register",
    ),

    path(
        "me/",
        VolunteerMeView.as_view(),
        name="volunteer-me",
    ),

    path(
        "activities/",
        VolunteerActivitiesView.as_view(),
        name="volunteer-activities",
    ),
]