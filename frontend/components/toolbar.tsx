"use client";

import { ComponentRef, ElementRef, useEffect, useRef, useState } from "react";

import { useCoverImage } from "@/hooks/useCoverImage";

import { Button } from "./ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { IconPicker } from "./icon-picker";
import { ImageIcon, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorFont, useEditorFont } from "@/hooks/useEditorFont";
import { fontFamilies } from "@/lib/editorFont";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Document {
  id: string;
  title: string;
  icon?: string;
  coverImage?: string;
  smallText?: boolean;
  // Add other fields as needed
}

interface ToolbarProps {
  initialData: Document;
  editorFont?: string;
  preview?: boolean;
}

export const Toolbar = ({ initialData, preview, editorFont }: ToolbarProps) => {
  const inputRef = useRef<ComponentRef<"textarea">>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialData.title);

  const coverImage = useCoverImage();

  const enableInput = () => {
    if (preview) return;
    setIsEditing(true);
    inputRef.current?.focus();
  };

  const disableInput = () => {
    setIsEditing(false);
    if (value === "") {
      setValue(initialData.title || "Untitled");
    }
  };

  useEffect(() => {
    if (!isEditing) {
      setValue(initialData.title);
    }
  }, [initialData.title]);

  // Update document via Django API
  const updateDocument = async (updates: Partial<Document>) => {
    try {
      console.log("Updating document ID:", initialData.id);
      console.log("Updates:", updates);
      
      const response = await apiFetch(`/api/documents/${initialData.id}/`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed:", errorText);
        throw new Error("Failed to update document");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
      throw error;
    }
  };

  useEffect(() => {
    if (value === initialData.title) return;

    const timer = setTimeout(() => {
      updateDocument({
        title: value || "Untitled",
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [value, initialData.id, initialData.title]);

  const onInput = (value: string) => {
    setValue(value);
  };

  const onKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await updateDocument({
        title: value || "Untitled",
      });
      setTimeout(() => {
        inputRef.current?.blur();
      }, 400);
    }
  };

  const onIconSelect = async (icon: string) => {
    try {
      await updateDocument({ icon });
      toast.success("Icon updated!");
    } catch (error) {
      toast.error("Failed to update icon");
    }
  };

  const onRemoveIcon = async () => {
    try {
      await updateDocument({ icon: undefined });
      toast.success("Icon removed!");
    } catch (error) {
      toast.error("Failed to remove icon");
    }
  };

  return (
    <div className="group relative pl-12">
      {!!initialData.icon && !preview && (
        <div
          className={cn(
            "group/icon relative z-10 flex w-max items-center gap-x-2",
            !initialData.coverImage && "pt-6",
            initialData.coverImage && "-mt-8",
          )}
        >
          <IconPicker onChange={onIconSelect}>
            <p className="text-6xl transition hover:opacity-75">
              {initialData.icon}
            </p>
          </IconPicker>
          <Button
            onClick={onRemoveIcon}
            className="text-muted-foreground dark:bg-dark dark:hover:bg-dark/80 rounded-full text-xs opacity-0 transition group-hover/icon:opacity-100"
            variant="outline"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!!initialData.icon && preview && (
        <p
          className={cn(
            "text-6xl",
            !initialData.coverImage && "pt-6",
            initialData.coverImage && "-mt-8",
          )}
        >
          {initialData.icon}
        </p>
      )}
      <div className="flex items-center gap-x-1 py-2 group-hover:opacity-100 md:opacity-0">
        {!initialData.icon && !preview && (
          <IconPicker asChild onChange={onIconSelect}>
            <Button
              className="text-muted-foreground text-xs"
              variant="outline"
              size="sm"
            >
              <Smile className="mr-2 h-4 w-4" />
              Add icon
            </Button>
          </IconPicker>
        )}
        {!initialData.coverImage && !preview && (
          <Button
            onClick={coverImage.onOpen}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Add Cover
          </Button>
        )}
      </div>

      <TextareaAutosize
        ref={inputRef}
        placeholder="Untitled"
        spellCheck="false"
        onBlur={disableInput}
        onFocus={() => setIsEditing(true)}
        onKeyDown={onKeyDown}
        value={value}
        disabled={preview}
        onChange={(e) => onInput(e.target.value)}
        style={{ fontFamily: fontFamilies[editorFont as EditorFont] }}
        className={cn(
          "w-full resize-none bg-transparent font-bold wrap-break-word outline-hidden",
          "text-[#3F3F3F] placeholder:text-gray-300 disabled:cursor-default dark:text-[#CFCFCF]",
          !isEditing && "cursor-pointer",
          initialData.smallText ? "text-4xl" : "text-5xl",
        )}
      />
    </div>
  );
};