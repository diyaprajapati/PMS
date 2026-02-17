'use client';

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { ProjectInfo } from '@/hooks/use-project-from-search-params';

type ProjectPageBreadcrumbProps = {
  projectId: string | null;
  project: ProjectInfo | null;
  projectLoading: boolean;
  /** Current tab/page name, e.g. "Dashboard", "Project Details", "Team Members". */
  tabName: string;
};

/**
 * Renders breadcrumb as: project_name > tab_name
 * When no project is selected, shows only tab_name.
 */
export function ProjectBreadcrumb({
  projectId,
  project,
  projectLoading,
  tabName,
}: ProjectPageBreadcrumbProps) {
  const dashboardUrl = projectId ? `/dashboard?project=${projectId}` : '/dashboard';

  return (
    <BreadcrumbList>
      {projectId ? (
        <>
          <BreadcrumbItem>
            {projectLoading ? (
              <BreadcrumbPage>Loading…</BreadcrumbPage>
            ) : project ? (
              <BreadcrumbLink href={dashboardUrl}>{project.name}</BreadcrumbLink>
            ) : (
              <BreadcrumbLink href={dashboardUrl}>Project</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tabName}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : (
        <BreadcrumbItem>
          <BreadcrumbPage>{tabName}</BreadcrumbPage>
        </BreadcrumbItem>
      )}
    </BreadcrumbList>
  );
}
