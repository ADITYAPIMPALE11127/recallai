from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet

router = DefaultRouter()
router.register(r'documents', NoteViewSet, basename='note')  # Changed from 'notes' to 'documents'

urlpatterns = [
    path('', include(router.urls)),
]