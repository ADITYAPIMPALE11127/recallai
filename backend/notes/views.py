from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Note
from .serializers import NoteSerializer, NoteListSerializer

class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NoteSerializer
    
    def get_queryset(self):
        # Return all notes for the user except archived ones by default
        # Include parent_document for hierarchy support
        queryset = Note.objects.filter(user=self.request.user).select_related('parent_document')
        
        # Filter by parent document if provided
        parent = self.request.query_params.get('parent')
        if parent is not None:
            if parent == 'null':
                queryset = queryset.filter(parent_document__isnull=True)
            else:
                queryset = queryset.filter(parent_document_id=parent)
        
        # For trash endpoint, return archived notes
        if self.action == 'trash':
            return queryset.filter(is_archived=True)
        
        # For favorites endpoint, return favorite notes
        if self.action == 'favorites':
            return queryset.filter(is_favorite=True, is_archived=False)
        
        # Filter out archived notes unless specifically requested
        if self.action != 'archived' and self.action != 'trash':
            queryset = queryset.filter(is_archived=False)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NoteListSerializer
        return NoteSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent non-archived notes (limit 10)"""
        recent_notes = self.get_queryset().filter(is_archived=False)[:10]
        serializer = NoteListSerializer(recent_notes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """Get all favorite notes for the current user"""
        favorite_notes = Note.objects.filter(
            user=self.request.user,
            is_favorite=True,
            is_archived=False
        ).order_by('-updated_at')
        serializer = NoteListSerializer(favorite_notes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trash(self, request):
        """Get all archived notes for the current user"""
        archived_notes = Note.objects.filter(
            user=self.request.user,
            is_archived=True
        ).order_by('-updated_at')
        serializer = NoteListSerializer(archived_notes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def empty_trash(self, request):
        """Permanently delete all archived notes"""
        Note.objects.filter(
            user=self.request.user,
            is_archived=True
        ).delete()
        return Response(
            {'status': 'trash emptied'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a note (soft delete)"""
        note = self.get_object()
        note.is_archived = True
        note.save()
        return Response({'status': 'archived'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a note from trash"""
        note = self.get_object()
        note.is_archived = False
        note.save()
        return Response({'status': 'restored'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status of a note"""
        note = self.get_object()
        note.is_favorite = not note.is_favorite
        note.save()
        return Response(
            {'status': 'toggled', 'is_favorite': note.is_favorite},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete a note (only for archived notes)"""
        note = self.get_object()
        if not note.is_archived:
            return Response(
                {'error': 'Only archived notes can be permanently deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        note.delete()
        return Response({'status': 'permanently deleted'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get all published notes for the current user"""
        published_notes = Note.objects.filter(
            user=self.request.user,
            is_published=True,
            is_archived=False
        ).order_by('-updated_at')
        serializer = NoteListSerializer(published_notes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical tree of notes (for sidebar navigation)"""
        # Get all notes for the user (not archived)
        all_notes = self.get_queryset().filter(
            is_archived=False,
            parent_document__isnull=True
        )
        serializer = NoteListSerializer(all_notes, many=True)
        
        # Build tree structure (frontend will handle nesting)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder notes (drag and drop support)"""
        note_id = request.data.get('id')
        parent_id = request.data.get('parentDocument')
        new_order = request.data.get('newOrder')

        if not note_id:
            return Response(
                {'error': 'Note ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            note = Note.objects.get(id=note_id, user=self.request.user)
            # Update the order field
            note.order = new_order
            note.save()

            # Optionally, reorder all siblings
            siblings = Note.objects.filter(
                user=self.request.user,
                parent_document_id=parent_id,
                is_archived=False
            ).exclude(id=note_id)

            for idx, sibling in enumerate(siblings):
                sibling.order = idx + (0 if idx < new_order else 1)
                sibling.save()

            return Response({'status': 'reordered'}, status=status.HTTP_200_OK)
        except Note.DoesNotExist:
            return Response(
                {'error': 'Note not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def destroy(self, request, *args, **kwargs):
        """Override delete to only allow if note is archived"""
        note = self.get_object()
        if not note.is_archived:
            return Response(
                {'error': 'Only archived notes can be permanently deleted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)