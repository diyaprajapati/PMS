"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import { BugTracker } from "@/components/bugs/bug-tracker";

function BugsContent() {
  const { projectId, project, projectLoading } = useProjectFromSearchParams();

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
              tabName="Bug Tracker"
            />
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-auto p-6 md:p-8">
        {!projectId && !projectLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="max-w-sm text-center text-base text-muted-foreground">
              Select a project from{" "}
              <Link
                href="/projects"
                className="font-medium text-primary underline transition-colors hover:text-primary/80"
              >
                Projects
              </Link>{" "}
              to manage bugs.
            </p>
          </div>
        ) : null}

        {projectId ? <BugTracker /> : null}
      </div>
    </>
  );
}

export function BugsPageClient() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense
          fallback={
            <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border/50 px-6">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <Separator orientation="vertical" className="h-5" />
              <span className="text-base font-medium text-muted-foreground">Bug Tracker</span>
            </header>
          }
        >
          <BugsContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
