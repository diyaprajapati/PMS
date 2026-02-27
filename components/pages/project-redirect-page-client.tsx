"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export function ProjectRedirectPageClient() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string | undefined;

  useEffect(() => {
    if (projectId) {
      router.replace(`/sprints?project=${projectId}`);
      return;
    }

    router.replace("/projects");
  }, [projectId, router]);

  return null;
}
