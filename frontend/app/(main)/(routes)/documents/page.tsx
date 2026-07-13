"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const DocumentsPage = () => {
  const { user } = useUser();
  const router = useRouter();

  const onCreate = async () => {
    try {
      const res = await apiFetch("/api/documents/", {
        method: "POST",
        body: JSON.stringify({ 
          title: "Untitled",
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Create failed:", errorData);
        throw new Error("Failed to create document");
      }
      
      const data = await res.json();
      console.log("Created document response:", data);
      
      // Django returns 'id', not '_id' - try 'id' first
      const docId = data.id || data._id || data.pk;
      
      if (!docId) {
        console.error("No ID returned from create:", data);
        toast.error("Failed to create document: No ID returned");
        return;
      }
      
      console.log("Redirecting to document:", docId);
      toast.success("New note created!");
      router.push(`/documents/${docId}`);
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create a new note.");
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src="/empty.svg"
        alt="empty"
        height={760}
        width={1036}
        priority
        className="size-75 dark:hidden"
      />
      <Image
        src="/empty-dark.svg"
        alt="empty"
        height={760}
        width={1036}
        priority
        className="hidden size-75 dark:block"
      />
      <h2 className="text-lg font-medium">
        Welcome to {user?.firstName}&apos;s Recall Ai
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create a note
      </Button>
    </div>
  );
};

export default DocumentsPage;