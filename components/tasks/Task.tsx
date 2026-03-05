'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TaskTable } from './TaskTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';

export default function Task() {
  const { projectId, project, projectLoading } = useProjectFromSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  if (projectLoading) {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  if (!projectId || !project) {
    return (
      <p className="text-muted-foreground text-base">
        Select a project from{' '}
        <Link
          href="/projects"
          className="text-primary underline hover:text-primary/80 transition-colors font-medium"
        >
          Projects
        </Link>{' '}
        to view its tasks.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage tasks and subtasks for {project.name}
        </p>
      </div>
      <TaskTable />
    </div>
  );
}
