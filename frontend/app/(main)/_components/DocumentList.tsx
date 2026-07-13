"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

import { Item } from "./Item";
import { FileIcon } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// Define the Document type - using Django's 'id' field
interface Document {
  id: string;
  title: string;
  icon?: string;
  isFavorite: boolean;
  isArchived: boolean;
  isPublished: boolean;
  parentDocument?: string | null;
  order?: number;
}

interface SortableItemProps {
  document: Document;
  level: number;
  onExpand: (id: string) => void;
  expanded: boolean;
  onRedirect: (id: string) => void;
  activeId?: string | string[];
  isFavorite?: boolean;
  onFavorite?: (id: string) => void;
  navDrawer?: boolean;
}

interface DocumentListProps {
  parentDocumentId?: string;
  level?: number;
  data?: Document[];
  navDrawer?: boolean;
}

const SortableItem = ({
  document,
  level,
  onExpand,
  expanded,
  onRedirect,
  activeId,
  onFavorite,
  navDrawer,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleY: 1, scaleX: 1 } : null,
    ),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
    cursor: isDragging ? "grabbing" : "pointer",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Item
        id={document.id}
        onClick={() => onRedirect(document.id)}
        label={document.title}
        icon={FileIcon}
        documentIcon={document.icon}
        active={activeId === document.id}
        level={level}
        onExpand={() => onExpand(document.id)}
        expanded={expanded}
        isFavorite={document.isFavorite}
        onFavorite={() => onFavorite?.(document.id)}
        navDrawer={navDrawer}
      />
      {expanded && (
        <DocumentList
          parentDocumentId={document.id}
          level={level + 1}
          navDrawer={navDrawer}
        />
      )}
    </div>
  );
};

export const DocumentList = ({
  parentDocumentId,
  level = 0,
  navDrawer,
}: DocumentListProps) => {
  const params = useParams();
  const router = useRouter();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [orderedDocuments, setOrderedDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch documents from Django
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const url = parentDocumentId 
        ? `/api/documents/?parent=${parentDocumentId}` 
        : `/api/documents/?parent=null`;
      
      const res = await apiFetch(url);
      
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setOrderedDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [parentDocumentId]);

  useEffect(() => {
    if (!isDragging) {
      fetchDocuments();
    }
  }, [fetchDocuments, isDragging]);

  const onExpand = (documentId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = orderedDocuments.findIndex(
        (doc) => doc.id === active.id,
      );
      const newIndex = orderedDocuments.findIndex((doc) => doc.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrdered = arrayMove(orderedDocuments, oldIndex, newIndex);
        setOrderedDocuments(newOrdered);
        
        // Update order in Django
        try {
          const res = await apiFetch(`/api/documents/reorder/`, {
            method: "POST",
            body: JSON.stringify({
              id: active.id,
              parentDocument: parentDocumentId || null,
              newOrder: newIndex,
            }),
          });
          
          if (!res.ok) throw new Error("Reorder failed");
        } catch (error) {
          console.error("Error reordering:", error);
          toast.error("Failed to reorder documents");
          // Revert to original order on error
          fetchDocuments();
        }
      }
    }
  };

  const onToggleFavorite = async (id: string) => {
    try {
      const res = await apiFetch(`/api/documents/${id}/toggle_favorite/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Toggle favorite failed");
      
      // Update local state
      setOrderedDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, isFavorite: !doc.isFavorite } : doc
        )
      );
      
      toast.success("Favorites updated!");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites.");
    }
  };

  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  if (loading) {
    return (
      <>
        <Item.Skeleton level={level} />
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    );
  }

  return (
    <div className="w-full">
      {orderedDocuments.length === 0 && level !== 0 && (
        <p
          style={{ paddingLeft: level ? `${level * 12 + 25}px` : undefined }}
          className="text-muted-foreground/80 py-1 text-sm font-medium"
        >
          No pages inside
        </p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={() => {
          setIsDragging(true);
          document.body.classList.add("cursor-grabbing");
        }}
        onDragEnd={(event) => {
          document.body.classList.remove("cursor-grabbing");
          handleDragEnd(event);
        }}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        collisionDetection={closestCorners}
      >
        <SortableContext
          items={orderedDocuments.map((doc) => doc.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedDocuments.map((document) => (
            <SortableItem
              key={document.id}
              document={document}
              level={level}
              onExpand={onExpand}
              expanded={expanded[document.id]}
              onRedirect={onRedirect}
              activeId={params.documentId as string}
              isFavorite={document.isFavorite}
              onFavorite={onToggleFavorite}
              navDrawer={navDrawer}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};