"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// Define the Document type - using Django's 'id' field
interface Document {
  id: string;
  title: string;
  icon?: string;
  // Add other fields as needed
}

interface TitleProps {
  initialData: Document;
}

export const Title = ({ initialData }: TitleProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData.title || "Untitled");
  const [isEditing, setIsEditing] = useState(false);

  const enableInput = () => {
    setTitle(initialData.title);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
    }, 0);
  };

  const disabledInput = () => {
    setIsEditing(false);
  };

  const updateTitle = async (newTitle: string) => {
    try {
      const res = await apiFetch(`/api/documents/${initialData.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle || "Untitled" }),
      });

      if (!res.ok) throw new Error("Update failed");
      
      toast.success("Title updated!");
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title.");
      setTitle(initialData.title || "Untitled"); // Revert on error
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setTitle(newTitle);
    updateTitle(newTitle);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      disabledInput();
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-x-1">
      {!!initialData.icon && <p>{initialData.icon}</p>}
      {isEditing ? (
        <Input
          ref={inputRef}
          onClick={enableInput}
          onBlur={disabledInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent lg:min-w-120"
        />
      ) : (
        <Button
          onClick={enableInput}
          title={initialData.title}
          variant="ghost"
          size="sm"
          className="h-auto max-w-[45vw] min-w-0 shrink overflow-hidden p-1 text-left font-normal md:max-w-[80vw]"
        >
          <span className="block min-w-0 truncate">{initialData?.title}</span>
        </Button>
      )}
    </div>
  );
};

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-md" />;
};