'use client';

import type { ProjectInfo } from '@/hooks/use-project-from-search-params';

type ProjectContextCardProps = {
  project: ProjectInfo;
  className?: string;
  /** If true, show project ID at the bottom (e.g. for settings page). */
  showId?: boolean;
};

/**
 * Card that displays current project name and description.
 * Use with useProjectFromSearchParams() when project is loaded.
 */
export function ProjectContextCard({ project, className, showId }: ProjectContextCardProps) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className ?? ''}`}>
      <h2 className="text-lg font-semibold">{project.name}</h2>
      {project.description ? (
        <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
      ) : (
        <p className="text-muted-foreground text-sm mt-1 italic">No description.</p>
      )}
      {showId && (
        <p className="text-muted-foreground text-xs mt-4">Project ID: {project.id}</p>
      )}
    </div>
  );
}
