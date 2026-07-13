from django.db import models
from django.conf import settings

# FRONTEND FIELD MAPPING (camelCase → snake_case):
# title → title (Title.tsx, POST creation)
# content → content (editor onChange in [documentId]/page.tsx)
# smallText → small_text (Menu.tsx switch)
# fullWidth → full_width (Menu.tsx switch)
# showToc → show_toc (Menu.tsx switch)
# isPublished → is_published (Publish.tsx)
# parentDocument → parent_document (Item.tsx sub-pages)
# isArchived → is_archived (soft delete/trash)
# isFavorite → is_favorite (FavoritesList.tsx)
# icon → icon (UI renders emoji, not yet wired)
# coverImage → cover_image (Edgestore URL, upload works but persistence TODO)
# editorFont → editor_font (localStorage only, previously in Convex)
# order → order (drag-drop reordering)

class Note(models.Model):
    # ===== CONFIRMED FIELDS (wired to frontend) =====
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notes'
    )
    
    title = models.CharField(max_length=255, default='Untitled')
    content = models.TextField(blank=True, default='')
    small_text = models.BooleanField(default=False)
    full_width = models.BooleanField(default=True)
    show_toc = models.BooleanField(default=True)
    is_published = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)  # NEW: For favorites functionality
    parent_document = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sub_documents'
    )
    
    # ===== ORDER FIELD (for drag-drop reordering) =====
    order = models.IntegerField(default=0)  # NEW: For drag-drop reordering
    
    # ===== IMPLIED FIELDS (UI renders but TODO for Django wiring) =====
    # TODO: Wire up icon field to frontend PATCH requests
    icon = models.CharField(
        max_length=64, 
        blank=True, 
        default='',
        help_text="Emoji icon for document (UI renders but persistence TODO)"
    )
    
    # TODO: Wire up cover_image field to frontend Edgestore upload
    cover_image = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Cover image URL from Edgestore (upload works but persistence TODO)"
    )
    
    # TODO: Wire up editor_font to frontend localStorage/preference sync
    editor_font = models.CharField(
        max_length=50,
        blank=True,
        default='default',
        help_text="Editor font preference (localStorage only, persistence TODO)"
    )
    
    # ===== STANDARD FIELDS =====
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'is_archived']),
            models.Index(fields=['user', 'is_favorite']),
            models.Index(fields=['user', 'is_published']),
        ]
    
    def __str__(self):
        return self.title