"use client";

import { useEffect } from "react";
import { Spinner } from "@/components/spinner";
import { useAuth, useSession } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Navigation from "./_components/Navigation";
import { SearchCommand } from "@/components/search-command";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { session } = useSession();

  // Store token in localStorage when available
  useEffect(() => {
    const storeToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem("access_token", token);
            console.log("Token stored successfully");
          } else {
            console.warn("No token received from Clerk");
          }
        } catch (error) {
          console.error("Failed to get token:", error);
        }
      } else {
        // Clear token when signed out
        localStorage.removeItem("access_token");
      }
    };

    storeToken();
  }, [isSignedIn, getToken]);

  // Refresh token periodically
  useEffect(() => {
    if (!isSignedIn) return;

    const refreshToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          localStorage.setItem("access_token", token);
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    };

    // Refresh token every 10 minutes
    const interval = setInterval(refreshToken, 600000);

    // Also refresh when window regains focus
    const handleFocus = () => {
      refreshToken();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    import("@/components/editor");
  }, []);

  if (!isLoaded) {
    return (
      <div 
        className="dark:bg-dark flex h-full items-center justify-center"
        suppressHydrationWarning
      >
        <Spinner size="md" />
      </div>
    );
  }

  if (!isSignedIn) {
    return redirect("/");
  }

  return (
    <div className="dark:bg-dark flex h-full" suppressHydrationWarning>
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};

export default MainLayout;