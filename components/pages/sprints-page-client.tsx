"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import Sprint from "@/components/sprints/Sprint";

function SprintsContent() {
  const searchParams = useSearchParams();
  const { projectId, project, projectLoading } = useProjectFromSearchParams();

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
    <>
      <header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
        <div className="flex items-center gap-3 px-6">
          <SidebarTrigger className="-ml-1 transition-all duration-200" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-5" />
          <Breadcrumb>
            <ProjectBreadcrumb
              projectId={projectId}
              project={project}
              projectLoading={projectLoading}
              tabName="Sprints"
            />
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6 md:p-8">
        <div className="flex-1 overflow-y-auto">
          <Sprint />
        </div>
      </div>
    </>
  );
}

export function SprintsPageClient() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense
          fallback={
            <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border/50 px-6">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <Separator orientation="vertical" className="h-5" />
              <span className="text-base font-medium text-muted-foreground">Sprints</span>
            </header>
          }
        >
          <SprintsContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
