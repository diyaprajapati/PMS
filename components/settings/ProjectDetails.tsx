import React, { useState } from 'react'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Calendar, ChartColumn, LayoutList, SquareKanban, Users } from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DeleteProjectDialog } from '../projects/DeleteProjectDialog'
import { EditProjectDialog, type Project } from '../projects/EditProjectDialog'
import { type ProjectInfo } from '@/hooks/use-project-from-search-params'

type ProjectDetailsProps = {
    projectId: string | null;
    project: ProjectInfo | null;
    projectLoading: boolean;
    refresh: () => void;
}

export default function ProjectDetails({ projectId, project, projectLoading, refresh }: ProjectDetailsProps) {
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    // Format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Generate avatar fallback from project name
    const getAvatarFallback = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleEdit = (project: ProjectInfo) => {
        // Convert ProjectInfo to Project type for EditProjectDialog
        const projectForEdit: Project = {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
        setEditProject(projectForEdit);
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
          router.push('/projects');
        } catch {
          toast.error('Something went wrong. Please try again.');
        } finally {
          setDeletingId(null);
        }
      };
    
      const handleDeleteClick = (project: ProjectInfo) => {
        // Convert ProjectInfo to Project type for DeleteProjectDialog
        const projectForDelete: Project = {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
        setDeleteProject(projectForDelete);
        setDeleteDialogOpen(true);
      };

    // Show loading state
    if (projectLoading) {
        return (
            <div className='flex justify-center'>
                <Card className='flex p-4 md:w-[80%] w-full'>
                    <div className='flex items-center gap-2'>
                        <div className='h-10 w-10 animate-pulse rounded-full bg-muted' />
                        <div className='h-8 w-48 animate-pulse rounded bg-muted' />
                    </div>
                </Card>
            </div>
        );
    }

    // Show error state only if projectId exists but project failed to load
    // Don't show error if no projectId (user hasn't selected a project yet)
    if (projectId && !project && !projectLoading) {
        return (
            <div className='flex justify-center'>
                <Card className='flex p-4 md:w-[80%] w-full'>
                    <div className='text-center text-muted-foreground'>
                        <p>Failed to load project. Please try refreshing the page.</p>
                    </div>
                </Card>
            </div>
        );
    }

    // If no projectId, show message to select a project
    if (!projectId) {
        return (
            <div className='flex justify-center'>
                <Card className='flex p-4 md:w-[80%] w-full'>
                    <div className='text-center text-muted-foreground'>
                        <p>No project selected. Please select a project from the projects page.</p>
                    </div>
                </Card>
            </div>
        );
    }

    // If no project and not loading, don't render anything (let parent handle it)
    if (!project) {
        return null;
    }

  return (
    <div className='flex justify-center'>
        <Card className='flex flex-col p-4 md:w-[80%] w-full gap-4'>
            <div className='flex gap-4 items-center'>
                <Avatar className='size-10'>
                    <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(project.name)}`} />
                    <AvatarFallback>{getAvatarFallback(project.name)}</AvatarFallback>
                </Avatar>
                <Label className='text-2xl font-semibold'>{project.name}</Label>
            </div>
            {project.description && (
                <div className='text-sm text-muted-foreground'>
                    {project.description}
                </div>
            )}
            <Separator />
            <div className='flex flex-col gap-4 pb-6'>
                <div className='flex items-center gap-2'>
                    <Calendar className='size-4 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Created at:</span>
                    <span className='text-sm font-medium'>{formatDate(project.createdAt)}</span>
                </div>
                <div className='flex items-center gap-2'>
                    <Calendar className='size-4 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Updated at:</span>
                    <span className="text-sm font-medium">{formatDate(project.updatedAt)}</span>
                </div>
            </div>
            <div className='flex flex-col pb-6'>
                <div className='flex items-center gap-2'>
                    <ChartColumn />
                    <Label className='text-lg font-semibold'>Project Analytics</Label>
                </div>
                <div>
                    <span className='text-sm text-muted-foreground'>Overview of project metrics and progress</span>
                </div>
            </div>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-4'>
                <Card className='relative mx-auto w-full pt-0 pb-0'>
                    <div className='flex items-center gap-2 bg-secondary py-2 px-4'>
                        <SquareKanban />
                        <CardTitle>Sprints</CardTitle>
                    </div>
                    <CardHeader>
                    </CardHeader>
                </Card>
                <Card className='relative mx-auto w-full pt-0 pb-0'>
                    <div className='flex items-center gap-2 bg-secondary py-2 px-4'>
                        <Users />
                        <CardTitle>Project Tasks</CardTitle>
                    </div>
                    <CardHeader>
                    </CardHeader>
                </Card>
                <Card className='relative mx-auto w-full pt-0 pb-0'>
                    <div className='flex items-center gap-2 bg-secondary py-2 px-4'>
                        <LayoutList />
                        <CardTitle>Stories Progress</CardTitle>
                    </div>
                    <CardHeader>
                    </CardHeader>
                </Card>
            </div>
            <div className='flex gap-4 mt-4'>
                <Button variant='outline' className='cursor-pointer hover:border-primary hover:text-primary transition-all duration-200 ease-in-out' onClick={() => handleEdit(project)}>Edit Project</Button>
                <Button className='cursor-pointer transition-all duration-200 ease-in-out' onClick={() => handleDeleteClick(project)}>Delete Project</Button>
            </div>
        </Card>
        <EditProjectDialog
        project={editProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditProject(null);
          refresh();
        }}
      />

      <DeleteProjectDialog
        project={deleteProject}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteProject(null);
          setDeleteDialogOpen(open);
        }}
        onConfirm={(project) => handleDeleteConfirm(project)}
        deleting={deleteProject !== null && deletingId === deleteProject.id}
      />
    </div>
  );
}
