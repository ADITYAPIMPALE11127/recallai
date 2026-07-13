# users/urls.py

from django.urls import path
from .views import RegisterView, LoginView, UserProfileView, LogoutView, ClerkUserView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('clerk-user/', ClerkUserView.as_view(), name='clerk-user'),
]