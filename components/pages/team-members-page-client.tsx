"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import TeamMembers from "@/components/settings/TeamMembers";

function TeamMembersContent() {
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
              tabName="Team Members"
            />
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        <TeamMembers projectId={projectId} />
      </div>
    </>
  );
}

export function TeamMembersPageClient() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense
          fallback={
            <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border/50 px-6">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <Separator orientation="vertical" className="h-5" />
              <span className="text-base font-medium text-muted-foreground">Team Members</span>
            </header>
          }
        >
          <TeamMembersContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
