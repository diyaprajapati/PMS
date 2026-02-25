'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookPlus, MoreVertical, Pencil, Trash2, Search, X } from 'lucide-react';
import Logo from '@/components/logo';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import { EditProjectDialog, type Project } from '@/components/projects/EditProjectDialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check token on mount and create one for Google OAuth users if needed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndCreateToken = async () => {
      const token = localStorage.getItem("token");
      console.log("Projects page - token check:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 30) + "..." : "none"
      });

      // If no token or token is fake (ends in .x), check if we have a NextAuth session
      if (!token || token.endsWith(".x")) {
        try {
          // Check if we have a valid session via cookie
          const meResponse = await fetch("/api/auth/me", { credentials: "include" });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData?.user) {
              console.log("✅ Valid session found - creating JWT token for Google OAuth user");
              
              // Create a real JWT token for this user
              const tokenResponse = await fetch("/api/auth/google-token", {
                method: "POST",
                credentials: "include",
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                if (tokenData?.token) {
                  localStorage.setItem("token", tokenData.token);
                  console.log("✅ Real JWT token created and stored for Google OAuth user");
                }
              } else {
                console.warn("Failed to create token for Google OAuth user");
              }
            }
          }
        } catch (error) {
          console.error("Error checking session or creating token:", error);
        }
      }
    };

    checkAndCreateToken();
  }, []);

  const fetchProjects = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/projects', { credentials: 'include' });
      const data = await res.json();

      if (res.status === 401) {
        toast.error('Please log in to view projects.');
        router.replace('/login');
        return;
      }

      if (!res.ok) {
        const message = data?.error ?? data?.message ?? 'Failed to load projects.';
        setError(message);
        toast.error(message);
        setProjects([]);
        return;
      }

      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load projects.');
      toast.error('Something went wrong. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const searchTerm = search.trim().toLowerCase();
  const filteredProjects = searchTerm
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          (p.description ?? '').toLowerCase().includes(searchTerm)
      )
    : projects;
  const isSearching = searchTerm.length > 0;

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async (project: Project) => {
    setDeletingId(project.id);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.status === 401) {
        toast.error('Please log in to delete projects.');
        router.replace('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? data?.message ?? 'Failed to delete project.');
        return;
      }

      toast.success('Project deleted.');
      setDeleteDialogOpen(false);
      setDeleteProject(null);
      fetchProjects();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteProject(project);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 py-4 border-b border-border/50">
        <Logo />
      </div>
      <div className="flex flex-col gap-8 px-6 py-8 md:px-12 md:py-12 lg:px-16 lg:py-16 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <BookPlus className="size-9 text-primary" strokeWidth={2} />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Projects</h1>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">Manage all your projects in one place.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:flex-1 sm:max-w-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
              <Input
                type="search"
                placeholder="Search by name or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search projects"
                className="pl-10 h-11 transition-all duration-200"
              />
              {/* {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )} */}
            </div>
            <AddProjectDialog onSuccess={fetchProjects} />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-base">Loading projects…</p>
        ) : error ? (
          <p className="text-destructive text-base">{error}</p>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col gap-6 justify-center items-center w-full py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookPlus className="size-4" />
                </EmptyMedia>
                <EmptyTitle>{isSearching ? 'No results' : 'No Projects Yet'}</EmptyTitle>
                <EmptyDescription>
                  {isSearching
                    ? 'No projects match your search. Try a different term or clear the search.'
                    : "You haven't created any projects yet. Get started by creating your first project."}
                </EmptyDescription>
              </EmptyHeader>
              {isSearching ? (
                <EmptyContent className="flex-row justify-center gap-2">
                  <Button variant="outline" onClick={() => setSearch('')} className="cursor-pointer">
                    Clear search
                  </Button>
                </EmptyContent>
              ) : (
                <EmptyContent className="flex-row justify-center gap-2">
                  <AddProjectDialog onSuccess={fetchProjects} />
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <>
            {isSearching && (
              <p className="text-sm text-muted-foreground font-medium">
                Showing {filteredProjects.length} of {projects.length} project{projects.length === 1 ? '' : 's'}
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group p-6 flex flex-col transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardHeader className="flex flex-row items-start justify-between gap-3 p-0 pb-4">
                  <CardTitle className="text-xl leading-tight wrap-break-word font-semibold">
                    <Link
                      href={`/dashboard?project=${project.id}`}
                      className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer hover:text-primary transition-all duration-200"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 cursor-pointer transition-all duration-200 hover:bg-accent/80 opacity-70 group-hover:opacity-100"
                        aria-label="Project options"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => handleEdit(project)}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => handleDeleteClick(project)}
                        disabled={deletingId === project.id}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <p className="text-sm text-muted-foreground wrap-break-word leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
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
          fetchProjects();
        }}
      />

      <DeleteProjectDialog
        project={deleteProject}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteProject(null);
          setDeleteDialogOpen(open);
        }}
        onConfirm={handleDeleteConfirm}
        deleting={deleteProject !== null && deletingId === deleteProject.id}
      />
    </div>
  );
}
