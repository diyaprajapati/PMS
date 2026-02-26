'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskTable } from '@/components/tasks/TaskTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { ProjectBreadcrumb } from '@/components/project-breadcrumb';
import type { Task } from '@/types/task';

function BacklogContent() {
  const { projectId, project, projectLoading } = useProjectFromSearchParams();
  const [totalHours, setTotalHours] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTasksLoaded = useCallback((tasks: Task[]) => {
    const sumHours = (list: Task[]): number =>
      list.reduce((acc, t) => {
        const sub = t.subtasks ? sumHours(t.subtasks) : 0;
        return acc + (t.estimatedHours ?? 0) + sub;
      }, 0);
    setTotalHours(sumHours(tasks));
  }, []);

  return (
    <>
      {/* Header with breadcrumb (same style as Sprints) */}
      <header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
        <div className="flex items-center gap-3 px-6">
          <SidebarTrigger className="-ml-1 transition-all duration-200" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-5"
          />
          <Breadcrumb>
            <ProjectBreadcrumb
              projectId={projectId}
              project={project}
              projectLoading={projectLoading}
              tabName="Backlog"
            />
          </Breadcrumb>
          {project && totalHours > 0 && (
            <span className="ml-4 text-xs text-muted-foreground/70 tabular-nums">
              {totalHours}h backlog
            </span>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6 md:p-8 overflow-auto">
        {!projectId && !projectLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground text-base text-center max-w-sm">
              Select a project from{' '}
              <Link href="/projects" className="text-primary underline hover:text-primary/80 transition-colors font-medium">
                Projects
              </Link>{' '}
              to view the backlog.
            </p>
          </div>
        )}

        {projectId && (
          <TaskTable
            key={refreshKey}
            sprintId="backlog"
            onRefresh={() => setRefreshKey((k) => k + 1)}
            onLoad={handleTasksLoaded}
          />
        )}
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
          <header className="flex h-20 shrink-0 items-center gap-3 px-6 border-b border-border/50">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-muted-foreground text-base font-medium">Backlog</span>
          </header>
        }>
          <BacklogContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
