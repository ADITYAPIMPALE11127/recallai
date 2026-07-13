"use client";

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const Heading = () => {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="max-w-3xl space-y-4" style={{transform:'translateY(-50px)'}}>
<h1 className="text-3xl font-bold sm:text-5xl md:text-5xl" style={{lineHeight:'62px'}}>
  📥 Capture. 🧠 Understand. <br/>🔁 Memorize.
</h1>
<h2 className="text-base font-medium sm:text-xl">
  Upload your documents 📄, study your notes 📝, and let AI 🤖 help<br />
  you retain what truly matters ⭐.
</h2>
      {!isLoaded && (
        <div className="flex w-full items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
      {isSignedIn && isLoaded && (
        <Button asChild>
          <Link href="/documents">
            Enter Recall Ai
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
      {!isSignedIn && isLoaded && (
        <SignUpButton mode="modal">
          <Button>
            Get Recall Ai free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </SignUpButton>
      )}
    </div>
  );
};