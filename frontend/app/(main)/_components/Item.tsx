"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  LucideIcon,
  MoreHorizontal,
  Plus,
  Settings,
  Star,
  Trash,
} from "lucide-react";

import { ActionTooltip } from "@/components/action-tooltip";
import { useNavDrawer } from "@/hooks/useNavDrawer";
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
  updatedAt?: string;
  createdAt?: string;
  // Add other fields as needed
}

interface ItemProps {
  id?: string;
  documentIcon?: string;
  active?: boolean;
  expanded?: boolean;
  level?: number;
  onExpand?: () => void;
  label?: string;
  onClick?: () => void;
  icon: LucideIcon;
  isFavorite?: boolean;
  onFavorite?: () => void;
  shortcut?: string;
  showDragHandle?: boolean;
  navDrawer?: boolean;
}

export const Item = ({
  id,
  label,
  onClick,
  icon: Icon,
  active,
  documentIcon,
  level = 0,
  onExpand,
  expanded,
  isFavorite,
  onFavorite,
  shortcut,
  showDragHandle = true,
  navDrawer,
}: ItemProps) => {
  const router = useRouter();
  const params = useParams();

  const { setInnerPopoverOpen } = useNavDrawer();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch document data for metadata
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const res = await apiFetch(`/api/documents/${id}/`);
        
        if (!res.ok) throw new Error("Failed to fetch document");
        const data = await res.json();
        setDocument(data);
      } catch (error) {
        // Silently fail - metadata is not critical
        console.error("Error fetching document metadata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const createDocument = async (parentId?: string) => {
    try {
      const res = await apiFetch("/api/documents/", {
        method: "POST",
        body: JSON.stringify({ 
          title: "Untitled",
          parentDocument: parentId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create document");
      
      const data = await res.json();
      // Django returns 'id', not '_id'
      return data.id || data._id;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  };

  const archiveDocument = async (documentId: string) => {
    try {
      const res = await apiFetch(`/api/documents/${documentId}/archive/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to archive document");
      return true;
    } catch (error) {
      console.error("Error archiving document:", error);
      throw error;
    }
  };

  const restoreDocument = async (documentId: string) => {
    try {
      const res = await apiFetch(`/api/documents/${documentId}/restore/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to restore document");
      return true;
    } catch (error) {
      console.error("Error restoring document:", error);
      throw error;
    }
  };

  const onArchive = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
    if (!id) return;

    if (params.documentId === id) {
      router.push("/documents");
    }

    try {
      await archiveDocument(id);
      toast.success("Note moved to trash", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreDocument(id);
              toast.success("Note restored!");
            } catch (error) {
              toast.error("Failed to restore note.");
            }
          },
        },
      });
    } catch (error) {
      toast.error("Failed to archive note.");
    }
  };

  const handleExpand = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    onExpand?.();
  };

  const onCreate = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
    if (!id) return;

    try {
      const documentId = await createDocument(id);
      if (!expanded) {
        onExpand?.();
      }
      toast.success("New note created.");
      router.push(`/documents/${documentId}`);
    } catch (error) {
      toast.error("Failed to create note.");
    }
  };

  const onOpenChange = (open: boolean) => {
    if (!navDrawer) return;
    setInnerPopoverOpen(open);
  };

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "...";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "...";
    }
  };

  const formatCreationDate = (dateString?: string) => {
    if (!dateString) return "...";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "...";
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      style={{ paddingLeft: level ? `${level * 12 + 12}px` : "12px" }}
      className={cn(
        "group text-muted-foreground hover:bg-primary/5 relative flex min-h-6.75 w-full items-center py-1 pr-3 text-sm font-medium",
        active && "bg-primary/5 text-primary",
        navDrawer && !id ? "rounded-full" : "rounded-none",
      )}
    >
      <div className="group flex items-center justify-center truncate">
        {!!id && showDragHandle && (
          <GripVertical className="text-muted-foreground/50 absolute left-0.5 size-3 opacity-0 group-hover:opacity-100" />
        )}
        {!!id && (
          <div
            role="button"
            aria-label={expanded ? "Collapse page" : "Expand page"}
            aria-expanded={!!expanded}
            className="mr-1 h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
            onClick={handleExpand}
          >
            <ChevronIcon className="text-muted-foreground/50 h-4 w-4 shrink-0" />
          </div>
        )}
        {documentIcon ? (
          <div className="mr-1 shrink-0 text-[1.125rem] leading-none">
            {documentIcon}
          </div>
        ) : (
          <Icon
            className={`text-muted-foreground h-4.5 w-4.5 shrink-0 ${navDrawer && Icon === Settings ? "mr-0" : "mr-2"}`}
          />
        )}
        {label && (
          <span className="truncate" title={label}>
            {label}
          </span>
        )}
      </div>
      {shortcut && (
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[.625rem] font-medium opacity-100 select-none md:inline-flex dark:bg-neutral-700">
          {shortcut}
        </kbd>
      )}
      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip label="Add sub-page">
            <div
              role="button"
              aria-label="Add sub-page"
              onClick={onCreate}
              className="ml-auto h-full rounded-sm opacity-100 transition hover:bg-neutral-300 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-neutral-600"
            >
              <Plus className="text-muted-foreground h-4 w-4" />
            </div>
          </ActionTooltip>
          <DropdownMenu onOpenChange={navDrawer ? onOpenChange : undefined}>
            <ActionTooltip label="More actions">
              <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
                <div
                  role="button"
                  aria-label="More actions"
                  className="ml-auto h-full rounded-sm opacity-100 transition hover:bg-neutral-300 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-neutral-600"
                >
                  <MoreHorizontal className="text-muted-foreground h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
            </ActionTooltip>
            <DropdownMenuContent
              className="w-65"
              align="start"
              side="right"
              forceMount
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.();
                }}
              >
                <Star
                  className={cn(
                    "mr-2 h-4 w-4",
                    isFavorite && "fill-yellow-400 text-yellow-400",
                  )}
                />
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="space-y-0.5 p-2 text-[.6875rem]">
                <p className="text-muted-foreground/70">
                  Last edited on{" "}
                  {formatDate(document?.updatedAt || document?.createdAt)}
                </p>
                <p className="text-muted-foreground/70">
                  Created on{" "}
                  {formatCreationDate(document?.createdAt)}
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  return (
    <div
      style={{ paddingLeft: level ? `${level * 12 + 25}px` : "12px" }}
      className="flex gap-x-2 py-0.75"
    >
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  );
};