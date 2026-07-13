"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AArrowDown,
  Maximize2,
  MoreHorizontal,
  Settings,
  TableOfContents,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettingsModal";
import { ActionTooltip } from "@/components/action-tooltip";
import { useWordCount } from "@/hooks/useWordCount";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface MenuProps {
  documentId: string;
}

interface Document {
  id: string;
  _id: string;
  title: string;
  content: string;
  fullWidth?: boolean;
  showToc?: boolean;
  smallText?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const Menu = ({ documentId }: MenuProps) => {
  const router = useRouter();

  const settings = useSettings();
  const words = useWordCount();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch document from Django API
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await apiFetch(`/api/documents/${documentId}/`);
        if (!response.ok) throw new Error('Failed to fetch document');
        const data = await response.json();
        setDocument(data);
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const isFullWidth = document?.fullWidth ?? true;
  const toggleToc = document?.showToc ?? true;
  const isSmallText = !!document?.smallText;

  const onArchive = async () => {
    try {
      const response = await apiFetch(`/api/documents/${documentId}/archive/`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error('Failed to archive document');
      
      router.push("/documents");
      toast.success("Note moved to trash!");
    } catch (error) {
      console.error('Error archiving document:', error);
      toast.error("Failed to archive note.");
    }
  };

  const updateDocument = async (updates: Partial<Document>) => {
    try {
      const response = await apiFetch(`/api/documents/${documentId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update document');
      
      const updatedDoc = await response.json();
      setDocument(updatedDoc);
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  const onFullWidthChange = (checked: boolean) => {
    updateDocument({ fullWidth: checked });
  };

  const onSmallTextChange = (checked: boolean) => {
    updateDocument({ smallText: checked });
  };

  const onTocChange = (checked: boolean) => {
    updateDocument({ showToc: checked });
  };

  if (isLoading) {
    return <Menu.Skeleton />;
  }

  return (
    <DropdownMenu>
      <ActionTooltip label="Page actions">
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" aria-label="Page actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
      </ActionTooltip>
      <DropdownMenuContent
        className="w-65 px-2"
        align="end"
        alignOffset={8}
        forceMount
      >
        <MenuToggleItem
          label="Small text"
          icon={AArrowDown}
          checked={isSmallText}
          onChange={onSmallTextChange}
        />
        <MenuToggleItem
          label="Full width"
          icon={Maximize2}
          checked={isFullWidth}
          onChange={onFullWidthChange}
        />
        <MenuToggleItem
          label="Show table of contents"
          icon={TableOfContents}
          checked={toggleToc}
          onChange={onTocChange}
        />
        <DropdownMenuSeparator className="mx-1.5" />
        <DropdownMenuItem onClick={settings.onOpen}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive}>
          <Trash className="mr-2 h-4 w-4" />
          Move to Trash
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-1.5" />
        <div className="text-muted-foreground/70 space-y-0.5 p-2 text-[.6875rem]">
          <p>
            Word count: {words.wordCount}{" "}
            {words.wordCount === 1 ? "word" : "words"}
          </p>
          <p>
            Last edited on{" "}
            {document
              ? new Date(document.updatedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "..."}
          </p>
          <p>
            Created on{" "}
            {document
              ? new Date(document.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "..."}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-8 w-8" />;
};

const MenuToggleItem = ({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.FC<{ className?: string }>;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <DropdownMenuItem
    onSelect={(e) => e.preventDefault()}
    onClick={() => {
      onChange(!checked);
    }}
    className="flex items-center justify-between"
  >
    <div className="flex items-center justify-between gap-1">
      <Icon
        className={`mr-2 h-4 w-4 ${label === "Full width" ? "rotate-45" : " "}`}
      />
      {label}
    </div>
    <Switch size="sm" checked={checked} onCheckedChange={onChange} />
  </DropdownMenuItem>
);