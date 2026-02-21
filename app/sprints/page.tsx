'use client';

import { Suspense } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { ProjectBreadcrumb } from '@/components/project-breadcrumb';
import Sprint from '@/components/sprints/Sprint';

function SprintsContent() {
  const { projectId, project, projectLoading } = useProjectFromSearchParams();
  return (
    <>
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
              tabName="Sprints"
            />
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Sprint />
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground text-sm">Sprints</span>
          </header>
        }>
          <SprintsContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
