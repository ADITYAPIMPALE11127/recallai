from rest_framework import serializers
from .models import Note

class NoteSerializer(serializers.ModelSerializer):
    # Convert camelCase frontend fields to snake_case Django fields
    smallText = serializers.BooleanField(source='small_text', required=False)
    fullWidth = serializers.BooleanField(source='full_width', required=False)
    showToc = serializers.BooleanField(source='show_toc', required=False)
    isPublished = serializers.BooleanField(source='is_published', required=False)
    isArchived = serializers.BooleanField(source='is_archived', required=False)
    parentDocument = serializers.PrimaryKeyRelatedField(
        source='parent_document',
        queryset=Note.objects.all(),
        required=False,
        allow_null=True
    )
    
    # Implied fields with camelCase mapping (TODO: wire up)
    icon = serializers.CharField(required=False, allow_blank=True)
    coverImage = serializers.CharField(
        source='cover_image', 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    editorFont = serializers.CharField(
        source='editor_font', 
        required=False, 
        allow_blank=True
    )
    
    class Meta:
        model = Note
        fields = [
            'id', 
            'title', 
            'content', 
            'smallText', 
            'fullWidth', 
            'showToc', 
            'isPublished', 
            'isArchived', 
            'parentDocument',
            'icon',
            'coverImage',
            'editorFont',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Handle nested fields from source mapping
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class NoteListSerializer(serializers.ModelSerializer):
    # For list view, use camelCase to match frontend expectations
    parentDocument = serializers.PrimaryKeyRelatedField(
        source='parent_document',
        read_only=True
    )
    isArchived = serializers.BooleanField(source='is_archived', read_only=True)
    isPublished = serializers.BooleanField(source='is_published', read_only=True)
    
    class Meta:
        model = Note
        fields = [
            'id', 
            'title', 
            'updated_at',
            'parentDocument',
            'isArchived',
            'isPublished',
            'icon'
        ]