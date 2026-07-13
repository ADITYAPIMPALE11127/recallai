"use client";

import { useEffect, useState } from "react";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearch } from "@/hooks/useSearch";
import { DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// Define the Document type - using Django's 'id' field
interface Document {
  id: string;
  title: string;
  icon?: string;
}

export const SearchCommand = () => {
  const { user } = useUser();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useSearch((store) => store.toggle);
  const isOpen = useSearch((store) => store.isOpen);
  const onClose = useSearch((store) => store.onClose);

  // Fetch documents from Django API
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/documents/');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const onSelect = (id: string) => {
    router.push(`/documents/${id}`);
    onClose();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle hidden>Search Documents</DialogTitle>
      <Command
        loop
        filter={(value, search) => {
          const [documentTitle = ""] = value.split("|");
          if (documentTitle.toLowerCase().includes(search.toLowerCase()))
            return 1;
          return 0;
        }}
      >
        <CommandInput placeholder={`Search ${user?.fullName}'s Zotion..`} />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Loading..." : "No results found."}
          </CommandEmpty>
          <CommandGroup heading="Documents" className="pb-1">
            {documents?.map((document) => (
              <CommandItem
                key={document.id}
                value={`${document.title}|${document.id}`}
                title={document.title}
                onSelect={() => onSelect(document.id)}
              >
                {document.icon ? (
                  <p className="mr-2 text-[1.125rem] leading-0">
                    {document.icon}
                  </p>
                ) : (
                  <File className="mr-2 h-4 w-4" />
                )}
                <span>{document.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};