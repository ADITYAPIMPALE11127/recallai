"use client";

import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuIcon, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banner } from "./Banner";
import { Menu } from "./Menu";
import { Publish } from "./Publish";
import { Title } from "./Title";
import { apiFetch } from "@/lib/api";

// Define the Document type with all properties needed by child components
interface Document {
  id: string;
  title: string;
  icon?: string;
  isFavorite: boolean;
  isArchived: boolean;
  isPublished: boolean;
  // Add other fields as needed
}

interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

export const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const params = useParams();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      // Check if documentId is valid (not undefined or 'undefined' string)
      if (!documentId || documentId === 'undefined') {
        console.warn('No valid documentId provided:', documentId);
        setLoading(false);
        setDocument(null);
        return;
      }

      try {
        setLoading(true);
        const res = await apiFetch(`/api/documents/${documentId}/`);
        
        if (!res.ok) throw new Error("Failed to fetch document");
        const data = await res.json();
        setDocument(data);
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Failed to load document");
        setDocument(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const toggleFavorite = async () => {
    if (!document) return;

    try {
      const res = await apiFetch(`/api/documents/${document.id}/toggle_favorite/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Toggle favorite failed");
      
      // Update local state
      setDocument({
        ...document,
        isFavorite: !document.isFavorite,
      });
      
      toast.success(document.isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to toggle favorite");
    }
  };

  if (loading) {
    return (
      <nav className="bg-background dark:bg-dark flex w-full items-center justify-between px-3 py-2">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
      </nav>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <>
      <nav className="bg-background dark:bg-dark flex w-full items-center gap-x-2 px-3 py-2">
        {isCollapsed && (
          <ActionTooltip label="Open sidebar (Ctrl + \)">
            <button aria-label="Menu" onClick={onResetWidth}>
              <MenuIcon className="text-muted-foreground h-6 w-6" />
            </button>
          </ActionTooltip>
        )}
        <div className="flex w-full items-center justify-between">
          <Title initialData={document} />
          <div className="flex shrink-0 items-center">
            <Publish initialData={document} />
            <ActionTooltip
              label={document.isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Button
                variant="ghost"
                onClick={toggleFavorite}
                aria-label={document.isFavorite ? "Unfavorite" : "Favorite"}
              >
                <Star
                  className={cn(
                    "text-muted-foreground size-4.5",
                    document.isFavorite && "fill-yellow-400 text-yellow-400",
                  )}
                />
              </Button>
            </ActionTooltip>
            <Menu documentId={document.id} />
          </div>
        </div>
      </nav>
      {document.isArchived && <Banner documentId={document.id} />}
    </>
  );
};