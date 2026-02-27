"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import ProjectDetails from "@/components/settings/ProjectDetails";

export function ProjectDetailsPageClient() {
  const { projectId, project, projectLoading, refresh } = useProjectFromSearchParams();

  return (
    <>
      <header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
        <div className="flex items-center gap-3 px-6">
          <SidebarTrigger className="-ml-1 transition-all duration-200" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-5" />
          <Breadcrumb>
            <ProjectBreadcrumb
              projectId={projectId}
              project={project}
              projectLoading={projectLoading}
              tabName="Project Details"
            />
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        <ProjectDetails projectId={projectId} project={project} projectLoading={projectLoading} refresh={refresh} />
      </div>
    </>
  );
}
