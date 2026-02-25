'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AddSprintDialog } from './AddSprintDialog';
import { EditSprintDialog } from './EditSprintDialog';
import { DeleteSprintDialog, type Sprint as SprintType } from './DeleteSprintDialog';
import { SprintStatusBadge } from './SprintStatusBadge';
import { TaskTable } from '@/components/tasks/TaskTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

type SprintSelectorProps = {
  sprints: SprintType[];
  selected: SprintType | null;
  onSelect: (sprint: SprintType) => void;
};

function SprintSelector({ sprints, selected, onSelect }: SprintSelectorProps) {
  const [open, setOpen] = useState(false);

  const statusColor: Record<SprintType['status'], string> = {
    NOT_STARTED: 'bg-slate-400',
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-muted-foreground/40',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-accent/40 transition-colors text-sm font-medium">
          {selected ? (
            <>
              <span className={cn('size-1.5 rounded-full shrink-0', statusColor[selected.status])} />
              <span>{selected.title}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select sprint</span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 w-56">
        {sprints.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No sprints found</p>
        ) : (
          sprints.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => {
                onSelect(sprint);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left',
                selected?.id === sprint.id && 'bg-accent',
              )}
            >
              <span className={cn('size-1.5 rounded-full shrink-0', statusColor[sprint.status])} />
              <span className="truncate">{sprint.title}</span>
              {sprint.status === 'ACTIVE' && (
                <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                  Active
                </span>
              )}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function Sprint() {
  const { projectId } = useProjectFromSearchParams();

  const [sprints, setSprints] = useState<SprintType[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<SprintType | null>(null);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  const [editSprint, setEditSprint] = useState<SprintType | null>(null);
  const [deleteSprint, setDeleteSprint] = useState<SprintType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    setSprintsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: SprintType[] = await res.json();
      setSprints(data);

      const active = data.find((s) => s.status === 'ACTIVE');
      setSelectedSprint((prev) => {
        if (prev) {
          const updated = data.find((s) => s.id === prev.id);
          if (updated) return updated;
        }
        return active ?? data[0] ?? null;
      });
    } catch {
      toast.error('Failed to load sprints');
    } finally {
      setSprintsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      setSprints([]);
      setSelectedSprint(null);
      void fetchSprints();
    }
  }, [projectId, fetchSprints]);

  const handleSprintCreated = () => {
    void fetchSprints();
  };

  const handleEditSuccess = () => {
    void fetchSprints();
  };

  const handleDeleteConfirm = async (sprint: SprintType) => {
    if (!projectId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to delete sprint');
      }

      toast.success('Sprint deleted successfully');
      setDeleteSprint(null);
      setSelectedSprint((prev) => (prev?.id === sprint.id ? null : prev));
      void fetchSprints();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete sprint');
    } finally {
      setDeleting(false);
    }
  };

  const handleTasksLoaded = useCallback((tasks: Task[]) => {
    const sumHours = (list: Task[]): number =>
      list.reduce((acc, t) => {
        const sub = t.subtasks ? sumHours(t.subtasks) : 0;
        return acc + (t.estimatedHours ?? 0) + sub;
      }, 0);
    setTotalHours(sumHours(tasks));
  }, []);

  const formatDate = (value: string | null) =>
    value ? format(new Date(value), 'MMM d, yyyy') : null;

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <p className="text-muted-foreground">Please select a project</p>
      </div>
    );
  }

  const hasSprints = !sprintsLoading && sprints.length > 0;

  const startLabel =
    selectedSprint && formatDate(selectedSprint.startDate);
  const endLabel =
    selectedSprint && formatDate(selectedSprint.endDate);

  return (
    <div className="flex flex-col gap-6 h-full w-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Sprints</h2>
          <p className="text-sm text-muted-foreground">
            Plan work into focused iterations and track tasks per sprint.
          </p>
        </div>
        <AddSprintDialog onSuccess={handleSprintCreated} />
      </div>

      <div className="rounded-xl border bg-background/60 p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Current sprint</span>
            <SprintSelector
              sprints={sprints}
              selected={selectedSprint}
              onSelect={setSelectedSprint}
            />
            {selectedSprint && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <SprintStatusBadge status={selectedSprint.status} />
              </>
            )}
          </div>

          {selectedSprint && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground/80">
              <span>
                {startLabel || endLabel
                  ? `${startLabel ?? 'No start'} — ${endLabel ?? 'No end'}`
                  : 'No dates set'}
              </span>
              {totalHours > 0 && (
                <>
                  <span className="h-4 w-px bg-border/60" />
                  <span className="tabular-nums">{totalHours}h total</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={!selectedSprint}
            onClick={() => {
              if (selectedSprint) setEditSprint(selectedSprint);
            }}
          >
            Edit sprint
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer text-destructive hover:text-destructive/80"
            disabled={!selectedSprint}
            onClick={() => {
              if (selectedSprint) setDeleteSprint(selectedSprint);
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {!hasSprints && !sprintsLoading && (
        <div className="flex items-center justify-center flex-1 min-h-[260px]">
          <p className="text-muted-foreground text-sm text-center max-w-md">
            No sprints yet. Create your first sprint to start planning and tracking tasks.
          </p>
        </div>
      )}

      {selectedSprint && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          <TaskTable
            key={`${selectedSprint.id}-${refreshKey}`}
            sprintId={selectedSprint.id}
            onRefresh={() => setRefreshKey((k) => k + 1)}
            onLoad={handleTasksLoaded}
          />
        </div>
      )}

      <EditSprintDialog
        sprint={editSprint}
        open={!!editSprint}
        onOpenChange={(open) => {
          if (!open) setEditSprint(null);
        }}
        onSuccess={handleEditSuccess}
      />

      <DeleteSprintDialog
        sprint={deleteSprint}
        open={!!deleteSprint}
        onOpenChange={(open) => {
          if (!open) setDeleteSprint(null);
        }}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </div>
  );
}
