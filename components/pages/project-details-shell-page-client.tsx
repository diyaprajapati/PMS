"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProjectDetailsPageClient } from "@/components/pages/project-details-page-client";

function LoadingFallback() {
  return (
    <>
      <header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
        <div className="flex items-center gap-3 px-6">
          <SidebarTrigger className="-ml-1 transition-all duration-200" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-5" />
          <Breadcrumb>
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    </>
  );
}

export function ProjectDetailsShellPageClient() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={<LoadingFallback />}>
          <ProjectDetailsPageClient />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
