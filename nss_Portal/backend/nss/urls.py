from django.urls import path

from .views import (
    CollegeListView,
    NSSUnitListView,

    ActivityListView,
    ActivityRegisterView,

    OfficerActivityListCreateView,
    OfficerActivityDetailView,
    OfficerActivityParticipantsView,
    OfficerActivityAttendanceView,

    EventListView,
    EventRegisterView,

    OfficerEventListCreateView,
    OfficerEventDetailView,
    OfficerEventParticipantsView,
    OfficerEventAttendanceView,
)


urlpatterns = [

    # ========================================================
    # COLLEGES
    # ========================================================

    path(
        "colleges/",
        CollegeListView.as_view(),
        name="college-list",
    ),


    # ========================================================
    # NSS UNITS
    # ========================================================

    path(
        "units/",
        NSSUnitListView.as_view(),
        name="nss-unit-list",
    ),


    # ========================================================
    # ACTIVITIES — PUBLIC / VOLUNTEER
    # ========================================================

    path(
        "activities/",
        ActivityListView.as_view(),
        name="activity-list",
    ),

    path(
        "activities/<int:activity_id>/register/",
        ActivityRegisterView.as_view(),
        name="activity-register",
    ),


    # ========================================================
    # ACTIVITIES — PROGRAMME OFFICER
    # ========================================================

    path(
        "officer/activities/",
        OfficerActivityListCreateView.as_view(),
        name="officer-activity-list-create",
    ),

    path(
        "officer/activities/<int:activity_id>/",
        OfficerActivityDetailView.as_view(),
        name="officer-activity-detail",
    ),

    path(
        "officer/activities/<int:activity_id>/participants/",
        OfficerActivityParticipantsView.as_view(),
        name="officer-activity-participants",
    ),

    path(
        "officer/activity-participations/<int:participation_id>/attendance/",
        OfficerActivityAttendanceView.as_view(),
        name="officer-activity-attendance",
    ),


    # ========================================================
    # EVENTS — PUBLIC / VOLUNTEER
    # ========================================================

    path(
        "events/",
        EventListView.as_view(),
        name="event-list",
    ),

    path(
        "events/<int:event_id>/register/",
        EventRegisterView.as_view(),
        name="event-register",
    ),


    # ========================================================
    # EVENTS — PROGRAMME OFFICER
    # ========================================================

    path(
        "officer/events/",
        OfficerEventListCreateView.as_view(),
        name="officer-event-list-create",
    ),

    path(
        "officer/events/<int:event_id>/",
        OfficerEventDetailView.as_view(),
        name="officer-event-detail",
    ),

    path(
        "officer/events/<int:event_id>/participants/",
        OfficerEventParticipantsView.as_view(),
        name="officer-event-participants",
    ),

    path(
        "officer/event-participations/<int:participation_id>/attendance/",
        OfficerEventAttendanceView.as_view(),
        name="officer-event-attendance",
    ),
]