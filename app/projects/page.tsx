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
    <div className="flex flex-col gap-4">
      <Logo />
      <div className="flex flex-col gap-4 m-10 md:m-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BookPlus className="size-8 text-primary" />
              <Label className="text-2xl font-bold">Projects</Label>
            </div>
            <p className="text-muted-foreground">Manage all your projects here.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:flex-1 sm:max-w-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
              <Input
                type="search"
                placeholder="Search by name or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search projects"
                className="pl-9"
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
          <p className="text-muted-foreground">Loading projects…</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col gap-5 justify-center items-center w-full">
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
              <p className="text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} project{projects.length === 1 ? '' : 's'}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="p-4 flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between gap-2 p-0 pb-2">
                  <CardTitle className="text-lg leading-tight wrap-break-word">
                    <Link
                      href={`/dashboard?project=${project.id}`}
                      className="hover:underline focus:outline-none focus:underline cursor-pointer hover:text-primary transition-colors duration-200 ease-in-out"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 cursor-pointer"
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
                  <p className="text-sm text-muted-foreground wrap-break-word">
                    {project.description || 'No description.'}
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
