"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookPlus, LogOut, MoreVertical, Pencil, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useDeleteProjectMutation, useProjectsQuery } from "@/queries/projects.queries";
import { ApiError } from "@/services/http-client";
import { handleUnauthorizedError } from "@/lib/handle-unauthorized";
import type { Project } from "@/services/projects.service";

export function ProjectsPageClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const projectsQuery = useProjectsQuery();
  const deleteProjectMutation = useDeleteProjectMutation();
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const searchTerm = search.trim().toLowerCase();
  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return projects;
    }

    return projects.filter(
      (project: Project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description ?? "").toLowerCase().includes(searchTerm),
    );
  }, [projects, searchTerm]);

  const isSearching = searchTerm.length > 0;

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteProjectTarget(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (project: Project) => {
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      toast.success("Project deleted.");
      setDeleteDialogOpen(false);
      setDeleteProjectTarget(null);
    } catch (error) {
      if (!handleUnauthorizedError(error, router)) {
        toast.error(error instanceof Error ? error.message : "Failed to delete project.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  if (projectsQuery.isError) {
    const unauthorized = handleUnauthorizedError(projectsQuery.error, router);
    const message = unauthorized
      ? "Please log in to view projects."
      : projectsQuery.error instanceof Error
        ? projectsQuery.error.message
        : "Failed to load projects.";

    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-destructive text-base">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/60 px-6 pt-8 md:px-12 lg:px-16">
        <Link href="/projects" className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
            <Image src="/icon.png" alt="Runway" width={32} height={32} />
          </div>
          <span className="text-lg font-semibold leading-tight">Runway</span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span>Log out</span>
        </Button>
      </div>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 py-8 md:px-12 md:py-12 lg:px-16 lg:py-16">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <BookPlus className="size-9 text-primary" strokeWidth={2} />
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Projects</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">Manage all your projects in one place.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-1 sm:flex-row sm:items-center">
            <div className="relative w-full flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search by name or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search projects"
                className="h-11 pl-10"
              />
            </div>
            <AddProjectDialog onSuccess={() => void projectsQuery.refetch()} />
          </div>
        </div>

        {projectsQuery.isLoading ? (
          <p className="text-base text-muted-foreground">Loading projects...</p>
        ) : filteredProjects.length === 0 ? (
          <div className="flex w-full items-center justify-center py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookPlus className="size-4" />
                </EmptyMedia>
                <EmptyTitle>{isSearching ? "No results" : "No Projects Yet"}</EmptyTitle>
                <EmptyDescription>
                  {isSearching
                    ? "No projects match your search. Try a different term or clear the search."
                    : "You haven't created any projects yet. Get started by creating your first project."}
                </EmptyDescription>
              </EmptyHeader>
              {isSearching ? (
                <EmptyContent className="flex-row justify-center gap-2">
                  <Button variant="outline" onClick={() => setSearch("")} className="cursor-pointer">
                    Clear search
                  </Button>
                </EmptyContent>
              ) : (
                <EmptyContent className="flex-row justify-center gap-2">
                  <AddProjectDialog onSuccess={() => void projectsQuery.refetch()} />
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <>
            {isSearching ? (
              <p className="text-sm font-medium text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} project{projects.length === 1 ? "" : "s"}
              </p>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {filteredProjects.map((project: Project) => (
                <Card
                  key={project.id}
                  className="group relative flex cursor-pointer flex-col p-6 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
                  onClick={() => router.push(`/sprints?project=${project.id}`)}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-3 p-0 pb-4">
                    <CardTitle className="wrap-break-word text-xl font-semibold leading-tight transition-all duration-200 group-hover:text-primary">
                      {project.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 cursor-pointer opacity-70 transition-all duration-200 hover:bg-accent/80 group-hover:opacity-100"
                          aria-label="Project options"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(project)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer"
                          onClick={() => handleDeleteClick(project)}
                          disabled={deleteProjectMutation.isPending && deleteProjectTarget?.id === project.id}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex flex-1 items-center justify-between gap-3 p-0">
                    {project.myRole ? (
                      <span className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                        <User className="size-4" />
                        {project.myRole.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      {project.members && project.members.length > 0 ? (
                        <>
                          <AvatarGroup>
                            {project.members.slice(0, 4).map((member: { id: string; user: { name: string | null; image: string | null } }) => (
                              <Avatar key={member.id} size="sm">
                                {member.user?.image ? <AvatarImage src={member.user.image} /> : null}
                                <AvatarFallback className="text-[10px]">
                                  {member.user?.name ? member.user.name.slice(0, 2).toUpperCase() : "?"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {(project._count?.members ?? project.members.length) > 4 ? (
                              <AvatarGroupCount className="text-[10px]">
                                +{(project._count?.members ?? project.members.length) - 4}
                              </AvatarGroupCount>
                            ) : null}
                          </AvatarGroup>
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {project._count?.members ?? project.members.length} member
                            {(project._count?.members ?? project.members.length) === 1 ? "" : "s"}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">0 members</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <EditProjectDialog
        project={editProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditProject(null);
          void projectsQuery.refetch();
        }}
      />

      <DeleteProjectDialog
        project={deleteProjectTarget}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProjectTarget(null);
          }
          setDeleteDialogOpen(open);
        }}
        onConfirm={handleDeleteConfirm}
        deleting={
          deleteProjectTarget !== null &&
          deleteProjectMutation.isPending &&
          deleteProjectTarget.id === deleteProjectMutation.variables
        }
      />
    </div>
  );
}
