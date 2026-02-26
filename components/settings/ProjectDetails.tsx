import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { Calendar, ChartColumn, LayoutList, SquareKanban, CheckCircle2 } from 'lucide-react'
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

    // Stats state
    const [sprintCount, setSprintCount] = useState<number>(0);
    const [taskStats, setTaskStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
    const [statsLoading, setStatsLoading] = useState(false);

    // Fetch stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!projectId) return;

            setStatsLoading(true);
            try {
                // Fetch sprints
                const sprintsRes = await fetch(`/api/projects/${projectId}/sprints`, {
                    credentials: 'include',
                });
                if (sprintsRes.ok) {
                    const sprints = await sprintsRes.json();
                    setSprintCount(Array.isArray(sprints) ? sprints.length : 0);
                }

                // Fetch all tasks for the project
                // We need to fetch tasks from all sprints, so we'll query sprints first
                // and then fetch tasks for each sprint, plus backlog tasks
                const allTasks: any[] = [];

                // Fetch sprints to get tasks from all sprints
                if (sprintsRes.ok) {
                    const sprints = await sprintsRes.json();

                    // Fetch tasks from each sprint
                    for (const sprint of sprints) {
                        const sprintTasksRes = await fetch(
                            `/api/projects/${projectId}/tasks?sprintId=${sprint.id}`,
                            { credentials: 'include' }
                        );
                        if (sprintTasksRes.ok) {
                            const sprintTasks = await sprintTasksRes.json();
                            if (Array.isArray(sprintTasks)) {
                                allTasks.push(...sprintTasks);
                            }
                        }
                    }
                }

                // Also fetch backlog tasks (tasks without a sprint)
                const backlogRes = await fetch(`/api/projects/${projectId}/tasks`, {
                    credentials: 'include',
                });
                if (backlogRes.ok) {
                    const backlogTasks = await backlogRes.json();
                    if (Array.isArray(backlogTasks)) {
                        allTasks.push(...backlogTasks);
                    }
                }

                // Calculate stats
                const stats = allTasks.reduce((acc, task) => {
                    acc.total++;
                    if (task.status === 'TODO') acc.todo++;
                    else if (task.status === 'IN_PROGRESS') acc.inProgress++;
                    else if (task.status === 'DONE') acc.done++;
                    return acc;
                }, { total: 0, todo: 0, inProgress: 0, done: 0 });
                setTaskStats(stats);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [projectId]);

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
    <div className='flex flex-col gap-6 h-full w-full'>
        {/* Project Header */}
        <div className='flex items-center justify-between pb-4 border-b'>
            <div className='flex gap-3 items-center'>
                <Avatar className='size-12'>
                    <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(project.name)}`} />
                    <AvatarFallback>{getAvatarFallback(project.name)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                    <h2 className='text-2xl font-semibold'>{project.name}</h2>
                    {project.description && (
                        <p className='text-sm text-muted-foreground'>{project.description}</p>
                    )}
                </div>
            </div>
            <div className='flex gap-2'>
                <Button variant='outline' size="sm" className='cursor-pointer' onClick={() => handleEdit(project)}>
                    Edit Project
                </Button>
                <Button variant='outline' size="sm" className='cursor-pointer text-destructive hover:text-destructive/80' onClick={() => handleDeleteClick(project)}>
                    Delete Project
                </Button>
            </div>
        </div>

        {/* Project Info */}
        <div className='flex items-center gap-6 text-sm'>
            <div className='flex items-center gap-2'>
                <Calendar className='size-4 text-muted-foreground' />
                <span className='text-muted-foreground'>Created:</span>
                <span className='font-medium'>{formatDate(project.createdAt)}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className='flex items-center gap-2'>
                <Calendar className='size-4 text-muted-foreground' />
                <span className='text-muted-foreground'>Updated:</span>
                <span className="font-medium">{formatDate(project.updatedAt)}</span>
            </div>
        </div>

        {/* Project Analytics */}
        <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
                <ChartColumn className="size-5" />
                <h3 className='text-lg font-semibold'>Project Analytics</h3>
            </div>
            <div className='grid md:grid-cols-3 grid-cols-1 gap-6'>
                <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
                    <div className='flex items-center gap-2'>
                        <SquareKanban className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Sprints</span>
                    </div>
                    {statsLoading ? (
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    ) : (
                        <div className="text-3xl font-bold">{sprintCount}</div>
                    )}
                </div>

                <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
                    <div className='flex items-center gap-2'>
                        <LayoutList className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Tasks</span>
                    </div>
                    {statsLoading ? (
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    ) : (
                        <div className="text-3xl font-bold">{taskStats.total}</div>
                    )}
                </div>

                <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
                    <div className='flex items-center gap-2'>
                        <CheckCircle2 className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Completion</span>
                    </div>
                    {statsLoading ? (
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="text-3xl font-bold">
                                {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-slate-400"></div>
                                    <span className="tabular-nums">{taskStats.todo}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-blue-500"></div>
                                    <span className="tabular-nums">{taskStats.inProgress}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-2 rounded-full bg-emerald-500"></div>
                                    <span className="tabular-nums">{taskStats.done}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
