'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirects /projects/[id] to /sprints?project=[id] so the main sprints shows the selected project.
 */
export default function ProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string | undefined;

  useEffect(() => {
    if (projectId) {
      router.replace(`/sprints?project=${projectId}`);
    } else {
      router.replace('/projects');
    }
  }, [projectId, router]);

  return null;
}
