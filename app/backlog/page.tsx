'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TaskTable } from '@/components/tasks/TaskTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
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
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-border/50">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />

        {projectLoading ? (
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        ) : project ? (
          <span className="font-semibold text-base truncate">{project.name}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Backlog</span>
        )}

        {project && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium text-muted-foreground">Backlog</span>
            {totalHours > 0 && (
              <span className="ml-2 text-xs text-muted-foreground/70 tabular-nums">
                {totalHours}h total
              </span>
            )}
          </>
        )}
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
          <header className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-border/50">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-muted-foreground text-sm">Backlog</span>
          </header>
        }>
          <BacklogContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
