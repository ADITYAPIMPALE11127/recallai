"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Item } from "./Item";
import { DocumentList } from "./DocumentList";
import { FileIcon, Star } from "lucide-react";
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
  // Add other fields as needed
}

export const FavoritesList = ({ navDrawer }: { navDrawer?: boolean }) => {
  const params = useParams();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Fetch favorite documents from Django
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/documents/favorites/");
      
      if (!res.ok) throw new Error("Failed to fetch favorites");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const onToggleFavorite = async (id: string) => {
    try {
      const res = await apiFetch(`/api/documents/${id}/toggle_favorite/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Toggle favorite failed");
      
      // Remove from favorites list locally
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      
      toast.success("Removed from favorites!");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites.");
    }
  };

  const onExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <>
        <Item.Skeleton level={0} />
        <Item.Skeleton level={0} />
      </>
    );
  }

  if (documents.length === 0) return null;

  return (
    <div className="w-full">
      <p className="text-muted-foreground/60 flex items-center px-3 py-1 text-xs font-medium">
        <Star className="mr-1 size-3 shrink-0 fill-yellow-400 text-yellow-400" />
        Favorites
      </p>
      {documents.map((document) => (
        <div key={document.id}>
          <Item
            id={document.id}
            onClick={() => router.push(`/documents/${document.id}`)}
            label={document.title}
            icon={FileIcon}
            documentIcon={document.icon}
            active={params.documentId === document.id}
            level={0}
            expanded={expanded[document.id]}
            onExpand={() => onExpand(document.id)}
            isFavorite={document.isFavorite}
            onFavorite={() => onToggleFavorite(document.id)}
            showDragHandle={false}
            navDrawer={navDrawer}
          />
          {expanded[document.id] && (
            <DocumentList
              parentDocumentId={document.id}
              level={1}
              navDrawer={navDrawer}
            />
          )}
        </div>
      ))}
    </div>
  );
};