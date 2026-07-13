"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";

import { BlockNoteEditor } from "@blocknote/core";
import { TableOfContents } from "@/components/table-of-contents";
import { useEditorFont } from "@/hooks/useEditorFont";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Document {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  icon?: string;
  fullWidth?: boolean;
  smallText?: boolean;
  showToc?: boolean;
  editorFont?: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentIdPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  // Unwrap the params promise
  const unwrappedParams = use(params);
  const documentId = unwrappedParams?.documentId;

  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const [doc, setDoc] = useState<Document | null | undefined>(undefined);
  const { resolvedTheme } = useTheme();

  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  const { editorFont, isFontLoading } = useEditorFont({ enabled: true });

  // Fetch document from Django API
  useEffect(() => {
    const fetchDocument = async () => {
      // Check if documentId exists and is valid
      if (!documentId || documentId === 'undefined') {
        console.warn('No valid documentId provided:', documentId);
        setDoc(null);
        return;
      }

      try {
        const response = await apiFetch(`/api/documents/${documentId}/`);
        if (!response.ok) {
          if (response.status === 404) {
            setDoc(null);
            return;
          }
          throw new Error('Failed to fetch document');
        }
        const data = await response.json();
        setDoc(data);
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Failed to load document');
        setDoc(null);
      }
    };

    fetchDocument();
  }, [documentId]);

  // Update document from Django API
  const updateDocument = async (updates: Partial<Document>) => {
    // Check if documentId exists
    if (!documentId || documentId === 'undefined') {
      toast.error('No document ID found');
      return;
    }

    try {
      const response = await apiFetch(`/api/documents/${documentId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Document not found');
          return;
        }
        throw new Error('Failed to update document');
      }
      
      const updatedDoc = await response.json();
      setDoc(updatedDoc);
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  useEffect(() => {
    if (!doc) return;

    const defaultFavicon =
      resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

    window.document.title = `${doc.title || "Untitled"} | Zotion`;

    const link = window.document.querySelector(
      "link[rel~='icon']",
    ) as HTMLLinkElement;
    if (link) {
      link.href = doc.icon
        ? `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='100'>${doc.icon}</text></svg>`
        : defaultFavicon;
    }

    return () => {
      window.document.title = "Zotion";
      if (link) link.href = defaultFavicon;
    };
  }, [doc?.title, doc?.icon, resolvedTheme, documentId]);

  useEffect(() => {
    if (!doc) return;
    if (doc.editorFont === editorFont) return;

    updateDocument({ editorFont });
  }, [doc, editorFont, documentId]);

  const activeFont = doc?.editorFont ?? editorFont;
  const isFullWidth = doc?.fullWidth ?? true;
  const isSmallText = doc?.smallText ?? false;
  const showToc = doc?.showToc ?? true;

  const onChange = (content: string) => {
    updateDocument({ content });
  };

  if (doc === undefined || isFontLoading) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pt-4 pl-8">
            <Skeleton className="h-14 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Document Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The document you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-35">
      <Cover url={doc.coverImage} />
      <div
        className={`relative mx-auto md:w-[90%] ${
          !isFullWidth ? "max-w-200" : ""
        }`}
      >
        <Toolbar initialData={doc} editorFont={activeFont} />
        <Editor
          onChange={onChange}
          initialContent={doc.content}
          smallText={isSmallText}
          onEditorReady={setEditor}
          editorFont={activeFont}
        />
        {showToc && <TableOfContents editor={editor} />}
      </div>
    </div>
  );
};

export default DocumentIdPage;