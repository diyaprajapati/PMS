'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type ProjectInfo = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Reads ?project= from the URL and fetches that project.
 * Returns projectId, project, and projectLoading for use in dashboard/settings pages.
 */
export function useProjectFromSearchParams() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [projectLoading, setProjectLoading] = useState(!!projectId);

  const fetchProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { credentials: 'include' });
      if (!res.ok) {
        setProject(null);
        return;
      }
      const data = await res.json();
      setProject({ 
        id: data.id, 
        name: data.name, 
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } catch {
      setProject(null);
    } finally {
      setProjectLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      setProjectLoading(true);
      fetchProject(projectId);
    } else {
      setProject(null);
      setProjectLoading(false);
    }
  }, [projectId, fetchProject]);

  const refresh = useCallback(() => {
    if (projectId) {
      setProjectLoading(true);
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  return { projectId, project, projectLoading, refresh };
}
