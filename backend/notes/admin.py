from django.contrib import admin
from .models import Note

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'is_published', 'is_archived', 'updated_at']
    list_filter = ['is_published', 'is_archived', 'created_at', 'updated_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'content', 'parent_document')
        }),
        ('Settings', {
            'fields': ('small_text', 'full_width', 'show_toc', 'is_published', 'is_archived')
        }),
        ('UI Elements (TODO)', {
            'fields': ('icon', 'cover_image', 'editor_font'),
            'classes': ('collapse',),
            'description': 'These fields are not yet fully wired to the frontend'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )