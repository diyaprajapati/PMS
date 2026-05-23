"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import { WikiSidebar } from "@/components/wiki/WikiSidebar";
import { WikiEditor } from "@/components/wiki/WikiEditor";
import {
  useWikiPagesQuery,
  useWikiPageQuery,
  useCreateWikiPageMutation,
  useUpdateWikiPageMutation,
  useDeleteWikiPageMutation,
} from "@/queries/wiki.queries";

function WikiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, project, projectLoading } = useProjectFromSearchParams();
  const pageParam = searchParams.get("page");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pageParam);

  const { data: pages, isLoading: pagesLoading } = useWikiPagesQuery(projectId);
  const { data: selectedPage } = useWikiPageQuery(projectId, selectedPageId);

  const createMutation = useCreateWikiPageMutation(projectId);
  const updateMutation = useUpdateWikiPageMutation(projectId);
  const deleteMutation = useDeleteWikiPageMutation(projectId);

  const buildUrl = useCallback(
    (pageId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (pageId) {
        params.set("page", pageId);
      } else {
        params.delete("page");
      }
      return `/wiki?${params.toString()}`;
    },
    [searchParams]
  );

  const handleSelectPage = useCallback(
    (pageId: string) => {
      setSelectedPageId(pageId);
      router.replace(buildUrl(pageId), { scroll: false });
    },
    [router, buildUrl]
  );

  const handleCreatePage = async (title: string, content?: object) => {
    const page = await createMutation.mutateAsync({ title, content: content ?? {} });
    setSelectedPageId(page.id);
    router.replace(buildUrl(page.id), { scroll: false });
  };

  const handleSavePage = async (
    pageId: string,
    payload: { title?: string; content?: object }
  ) => {
    await updateMutation.mutateAsync({ pageId, payload });
  };

  const handleDeletePage = async (pageId: string) => {
    await deleteMutation.mutateAsync(pageId);
    if (selectedPageId === pageId) {
      setSelectedPageId(null);
      router.replace(buildUrl(null), { scroll: false });
    }
  };

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
              tabName="Wiki"
            />
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!projectId && !projectLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="max-w-sm text-center text-base text-muted-foreground">
              Select a project from{" "}
              <Link
                href="/projects"
                className="font-medium text-primary underline transition-colors hover:text-primary/80"
              >
                Projects
              </Link>{" "}
              to view the wiki.
            </p>
          </div>
        ) : (
          <>
            <WikiSidebar
              pages={pages ?? []}
              selectedPageId={selectedPageId}
              onSelectPage={handleSelectPage}
              onCreatePage={handleCreatePage}
              onDeletePage={handleDeletePage}
              isLoading={pagesLoading}
            />
            <WikiEditor
              page={selectedPage}
              onSave={handleSavePage}
              onDelete={handleDeletePage}
              isSaving={updateMutation.isPending}
            />
          </>
        )}
      </div>
    </>
  );
}

export function WikiPageClient() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense
          fallback={
            <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border/50 px-6">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <Separator orientation="vertical" className="h-5" />
              <span className="text-base font-medium text-muted-foreground">Wiki</span>
            </header>
          }
        >
          <WikiContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
