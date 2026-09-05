from django.urls import path

from .views import LoginView, ProductionSeedView


urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("production-seed/", ProductionSeedView.as_view(), name="production-seed"),
]