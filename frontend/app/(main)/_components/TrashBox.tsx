"use client";

import { ActionTooltip } from "@/components/action-tooltip";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { getDocumentUrls, useEdgeStore } from "@/lib/edgestore";
import { Coffee, Search, Trash, Trash2, Undo } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// Define the Document type - using Django's 'id' field
interface Document {
  id: string;
  title: string;
  // add other fields if needed
}

export const TrashBox = () => {
  const router = useRouter();
  const params = useParams();
  const { edgestore } = useEdgeStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch trash documents from Django
  const fetchTrashDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/documents/trash/");
      if (!res.ok) throw new Error("Failed to fetch trash");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching trash:", error);
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrashDocuments();
  }, [fetchTrashDocuments]);

  // Restore a document
  const restoreDocument = async (documentId: string) => {
    try {
      const res = await apiFetch(`/api/documents/${documentId}/restore/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Restore failed");
      // Update local state: remove the restored document from the list
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Note restored!");
    } catch (error) {
      console.error("Error restoring document:", error);
      toast.error("Failed to restore note.");
    }
  };

  // Delete a document permanently
  const removeDocument = async (documentId: string) => {
    // Find the document to get its URLs for EdgeStore deletion
    const document = documents.find((d) => d.id === documentId);
    if (document) {
      // Delete files from EdgeStore (if any)
      const urls = getDocumentUrls(document);
      await Promise.allSettled(
        urls.map((url) => edgestore.publicFiles.delete({ url }))
      );
    }

    try {
      const res = await apiFetch(`/api/documents/${documentId}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Deletion failed");
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Note deleted!");
      // If the current document is the one deleted, redirect
      if (params.documentId === documentId) {
        router.push("/documents");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete note.");
    }
  };

  // Empty all trash
  const emptyTrash = async () => {
    // Delete all files from EdgeStore for all documents in trash
    const allUrls = documents.flatMap(getDocumentUrls);
    await Promise.allSettled(
      allUrls.map((url) => edgestore.publicFiles.delete({ url }))
    );

    try {
      const res = await apiFetch("/api/documents/trash/empty/", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Empty trash failed");
      setDocuments([]);
      toast.success("Trash emptied!");
      // If current document was in trash, redirect
      if (params.documentId) {
        const isCurrentDocInTrash = documents.some(
          (doc) => doc.id === params.documentId
        );
        if (isCurrentDocInTrash) {
          router.push("/documents");
        }
      }
    } catch (error) {
      console.error("Error emptying trash:", error);
      toast.error("Failed to empty trash.");
    }
  };

  // Handlers for UI events
  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const onRestore = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    documentId: string
  ) => {
    event.stopPropagation();
    restoreDocument(documentId);
  };

  const onRemove = (documentId: string) => {
    removeDocument(documentId);
  };

  const onEmptyTrash = () => {
    emptyTrash();
  };

  // Filter documents based on search
  const filteredDocuments = documents.filter((document) =>
    document.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        aria-busy="true"
        aria-label="loading"
      >
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <section className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary h-7 px-2 focus-visible:ring-transparent"
          placeholder="Filter by page title..."
          aria-label="Filter by page title"
        />
        {documents.length > 0 && (
          <ConfirmModal onConfirm={onEmptyTrash}>
            <div>
              <ActionTooltip label="Empty trash">
                <div
                  role="button"
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  <Trash2 className="size-4 text-rose-500" />
                </div>
              </ActionTooltip>
            </div>
          </ConfirmModal>
        )}
      </div>

      <div className="mt-2 px-1 pb-1">
        {documents.length === 0 ? (
          <p className="text-muted-foreground pb-2 text-center text-xs">
            Trash is empty
            <Coffee className="mb-1 ml-1 inline-block size-4" />
          </p>
        ) : (
          filteredDocuments.length === 0 && (
            <p className="text-muted-foreground pb-2 text-center text-xs">
              No documents found.
            </p>
          )
        )}
        <div className="max-h-[50vh] overflow-y-auto">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              role="button"
              onClick={() => onClick(document.id)}
              className="text-primary hover:bg-primary/5 flex w-full items-center justify-between rounded-sm text-sm"
              aria-label="Document"
            >
              <span className="truncate pl-2">{document.title}</span>
              <div className="flex items-center">
                <ActionTooltip label="Restore page">
                  <button
                    onClick={(e) => onRestore(e, document.id)}
                    className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    aria-label="Restore Document"
                  >
                    <Undo className="text-muted-foreground h-4 w-4" />
                  </button>
                </ActionTooltip>
                <ConfirmModal onConfirm={() => onRemove(document.id)}>
                  <div>
                    <ActionTooltip label="Delete forever">
                      <button
                        className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                        aria-label="Delete Permanently"
                      >
                        <Trash className="text-muted-foreground h-4 w-4" />
                      </button>
                    </ActionTooltip>
                  </div>
                </ConfirmModal>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};