"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useOrigin } from "@/hooks/useOrigin";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Copy, Globe } from "lucide-react";
import { apiFetch } from "@/lib/api";

// Define the Document type - using Django's 'id' field
interface Document {
  id: string;
  title: string;
  isPublished: boolean;
  // Add other fields as needed
}

interface PublishProps {
  initialData: Document;
}

export const Publish = ({ initialData }: PublishProps) => {
  const origin = useOrigin();

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const url = `${origin}/preview/${initialData.id}`;

  const updatePublishStatus = async (isPublished: boolean) => {
    setIsSubmitting(true);

    try {
      const res = await apiFetch(`/api/documents/${initialData.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
      });

      if (!res.ok) throw new Error("Update failed");
      
      // Update the local state with the new publish status
      initialData.isPublished = isPublished;
      
      toast.success(isPublished ? "Note published!" : "Note unpublished");
    } catch (error) {
      console.error("Error updating publish status:", error);
      toast.error(isPublished ? "Failed to publish note." : "Failed to unpublish note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPublish = () => {
    updatePublishStatus(true);
  };

  const onUnpublish = () => {
    updatePublishStatus(false);
  };

  const onCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          aria-label={initialData.isPublished ? "Published" : "Publish"}
          title={initialData.isPublished ? "Published" : ""}
        >
          {initialData.isPublished ? (
            <Globe className="h-4 w-4 text-sky-500" />
          ) : (
            <span className="text-sm">Publish</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end" alignOffset={8} forceMount>
        {initialData.isPublished ? (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <Globe className="h-4 w-4 animate-pulse text-sky-500" />
              <p className="text-xs font-medium text-sky-500">
                This note is live on the web.
              </p>
            </div>
            <div className="flex items-center">
              <input
                value={url}
                className="bg-muted h-8 flex-1 rounded-l-md border px-2 text-xs"
                disabled
              />
              <Button
                onClick={onCopy}
                disabled={copied}
                className="h-8 rounded-l-none"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              className="w-full text-xs"
              disabled={isSubmitting}
              onClick={onUnpublish}
            >
              Unpublish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Globe className="text-muted-foreground mb-2 h-8 w-8" />
            <p>Published this note</p>
            <span className="text-muted-foreground mb-4 text-xs">
              Share your work with others
            </span>
            <Button
              disabled={isSubmitting}
              onClick={onPublish}
              className="w-full text-xs"
              size="sm"
            >
              Publish
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};