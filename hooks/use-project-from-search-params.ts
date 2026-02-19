'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ProjectInfo = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// Cache project data to persist across navigation
const projectCache = new Map<string, ProjectInfo>();

/**
 * Reads ?project= from the URL and fetches that project.
 * Returns projectId, project, and projectLoading for use in dashboard/settings pages.
 * Caches project data to persist across navigation.
 */
export function useProjectFromSearchParams() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [project, setProject] = useState<ProjectInfo | null>(
    projectId ? projectCache.get(projectId) || null : null
  );
  const [projectLoading, setProjectLoading] = useState(!!projectId && !project);
  const fetchingRef = useRef<string | null>(null);

  const fetchProject = useCallback(async (id: string) => {
    // Prevent duplicate fetches for the same project
    if (fetchingRef.current === id) {
      return;
    }

    // Check cache first
    const cached = projectCache.get(id);
    if (cached) {
      setProject(cached);
      setProjectLoading(false);
      return;
    }

    fetchingRef.current = id;
    setProjectLoading(true);

    try {
      const res = await fetch(`/api/projects/${id}`, { credentials: 'include' });
      if (!res.ok) {
        console.error(`Failed to fetch project ${id}:`, res.status, res.statusText);
        setProject(null);
        projectCache.delete(id);
        setProjectLoading(false);
        fetchingRef.current = null;
        return;
      }
      const data = await res.json();
      const projectData: ProjectInfo = { 
        id: data.id, 
        name: data.name, 
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      
      // Cache the project data
      projectCache.set(id, projectData);
      setProject(projectData);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      setProject(null);
      projectCache.delete(id);
    } finally {
      setProjectLoading(false);
      fetchingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      // Always check cache first synchronously
      const cached = projectCache.get(projectId);
      if (cached) {
        // Update state if cached data exists and is different from current state
        setProject(prev => {
          if (prev?.id !== cached.id) {
            return cached;
          }
          return prev;
        });
        setProjectLoading(false);
        return;
      }
      
      // Only fetch if not already fetching and no cached data
      if (fetchingRef.current !== projectId) {
        setProjectLoading(true);
        fetchProject(projectId);
      }
    } else {
      setProject(null);
      setProjectLoading(false);
    }
  }, [projectId, fetchProject]);

  const refresh = useCallback(() => {
    if (projectId) {
      // Clear cache and fetch fresh data
      projectCache.delete(projectId);
      setProjectLoading(true);
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  return { projectId, project, projectLoading, refresh };
}
