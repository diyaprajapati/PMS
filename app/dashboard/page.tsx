'use client';

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { getSession } from "next-auth/react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import { ProjectContextCard } from "@/components/project-context-card";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, project, projectLoading } = useProjectFromSearchParams();

  // Handle JWT / NextAuth session and auto-logout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ensureTokenFromSession = async () => {
      let token = localStorage.getItem("token");

      // Check if token is a real JWT (has proper structure with 3 parts and valid signature)
      const isRealJWT = (t: string | null): boolean => {
        if (!t) return false;
        const parts = t.split(".");
        if (parts.length !== 3) return false;
        // Real JWT signatures are longer than just "x"
        if (parts[2] === "x" || parts[2].length < 10) {
          console.log("Token failed signature check - signature too short or is 'x'");
          return false;
        }
        try {
          const payload = JSON.parse(atob(parts[1] ?? ""));
          // Real JWT should have id or email in payload (from our login API)
          const hasUserInfo = !!(payload?.id || payload?.email);
          if (!hasUserInfo) {
            console.log("Token failed payload check - missing id or email");
          }
          return hasUserInfo;
        } catch (e) {
          console.log("Token failed parsing:", e);
          return false;
        }
      };

      // Check if we have a real token first
      const hasRealToken = token && isRealJWT(token);
      
      console.log("Dashboard token check:", {
        hasToken: !!token,
        isRealJWT: hasRealToken,
        tokenPreview: token ? token.substring(0, 50) + "..." : "none"
      });

      // If no real JWT token, but NextAuth session exists (e.g. Google login),
      // create a lightweight client-only JWT so existing logic continues to work.
      if (!hasRealToken) {
        // First, check if we have a valid cookie (from email/password login)
        // If cookie exists, we shouldn't create a fake token
        try {
          const meResponse = await fetch("/api/auth/me", { credentials: "include" });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData?.user) {
              console.log("✅ Valid session found via cookie - checking if we need to store token");
              // User is authenticated via cookie
              // If we have an invalid token, remove it, but don't create a fake one
              if (token && !isRealJWT(token)) {
                console.log("Removing invalid token since user is authenticated via cookie");
                localStorage.removeItem("token");
              }
              // Don't exit - continue with token validation flow
              // The token might be valid, or we'll validate it below
            }
          }
        } catch (e) {
          console.log("Could not verify session:", e);
        }

        const session = await getSession();
        if (!session) {
          // No session at all -> logout and redirect
          if (token) {
            console.log("Removing invalid token - no session found");
            localStorage.removeItem("token"); // Remove invalid token
          }
          void fetch("/api/auth/logout", { method: "POST" });
          router.replace("/login");
          return;
        }

        // We have a NextAuth session but no real JWT token
        // Create a real JWT token for Google OAuth users
        console.log("🔄 Creating real JWT token for Google OAuth user");
        try {
          const tokenResponse = await fetch("/api/auth/google-token", {
            method: "POST",
            credentials: "include",
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (typeof tokenData?.token === "string") {
              token = tokenData.token as string;
              localStorage.setItem("token", token);
              console.log("✅ Real JWT token created and stored for Google OAuth user");
            } else {
              throw new Error("No token in response");
            }
          } else {
            throw new Error(`Failed to create token: ${tokenResponse.status}`);
          }
        } catch (error) {
          console.error("Failed to create real token for Google OAuth:", error);
          // Fallback: create placeholder token (but this shouldn't happen)
          console.log("⚠️ Falling back to placeholder token");
          const nowSeconds = Math.floor(Date.now() / 1000);
          const exp = nowSeconds + 60 * 60;

          const encode = (obj: unknown) =>
            btoa(JSON.stringify(obj))
              .replace(/=+$/g, "")
              .replace(/\+/g, "-")
              .replace(/\//g, "_");

          const header = { alg: "HS256", typ: "JWT" };
          const payload = { exp };

          token = `${encode(header)}.${encode(payload)}.x`;
          localStorage.setItem("token", token);
        }
      } else {
        console.log("✅ Real JWT token found - keeping it");
      }

      if (!token) {
        localStorage.removeItem("token");
        void fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        return;
      }

      // At this point, token is guaranteed to be non-null
      const currentToken = token;

      try {
        const payload = JSON.parse(atob(currentToken.split(".")[1] ?? "")) as {
          exp?: number;
          id?: string;
          email?: string;
        };

        // Validate token has expiration
        if (!payload?.exp) {
          localStorage.removeItem("token");
          void fetch("/api/auth/logout", { method: "POST" });
          router.replace("/login");
          return;
        }

        const expireAt = payload.exp * 1000;
        const now = Date.now();

        if (expireAt <= now) {
          localStorage.removeItem("token");
          void fetch("/api/auth/logout", { method: "POST" });
          toast.error("Session expired. Please log in again.");
          router.replace("/login");
          return;
        }

        // Schedule automatic logout when token expires
        const timeoutId = window.setTimeout(() => {
          localStorage.removeItem("token");
          void fetch("/api/auth/logout", { method: "POST" });
          toast.error("Session expired. Please log in again.");
          router.replace("/login");
        }, expireAt - now);

        return () => {
          window.clearTimeout(timeoutId);
        };
      } catch {
        localStorage.removeItem("token");
        void fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      }
    };

    void ensureTokenFromSession();
  }, [router]);

  // When page is restored from back/forward cache, re-check auth and redirect if logged out
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }
        fetch("/api/auth/me", { credentials: "include" })
          .then((res) => { if (!res.ok) router.replace("/login"); })
          .catch(() => router.replace("/login"));
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // Handle Google auth success / failure toasts via query params
  useEffect(() => {
    const from = searchParams.get("from");
    const error = searchParams.get("error");

    if (from === "google" && !error) {
      toast.success("Logged in with Google");
    }

    if (error) {
      toast.error("Google authentication failed. Please try again.");
    }
  }, [searchParams]);

  return (
    // <div className="flex justify-between items-center p-4">
    //   <h1 className="text-2xl font-bold">Dashboard</h1>
    //   <Button
        // onClick={() => {
        //   localStorage.removeItem("token");
        //   void fetch("/api/auth/logout", { method: "POST" });
        //   router.replace("/login");
        // }}
        // className="cursor-pointer"
    //   >
    //     Logout
    //   </Button>
    // </div>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <ProjectBreadcrumb
                projectId={projectId}
                project={project}
                projectLoading={projectLoading}
                tabName="Dashboard"
              />
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {projectId && !projectLoading && project && (
            <ProjectContextCard project={project} />
          )}
          {!projectId && (
            <p className="text-muted-foreground text-sm">
              Select a project from <Link href="/projects" className="text-primary underline">Projects</Link> to open its dashboard.
            </p>
          )}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-between items-center p-4"><h1 className="text-2xl font-bold">Dashboard</h1><div className="h-10 w-20 animate-pulse rounded-md bg-muted" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
