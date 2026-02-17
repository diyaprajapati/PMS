'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirects /projects/[id] to /dashboard?project=[id] so the main dashboard shows the selected project.
 */
export default function ProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string | undefined;

  useEffect(() => {
    if (projectId) {
      router.replace(`/dashboard?project=${projectId}`);
    } else {
      router.replace('/projects');
    }
  }, [projectId, router]);

  return null;
}
