'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Filter, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddSprintDialog } from './AddSprintDialog';
import { EditSprintDialog } from './EditSprintDialog';
import { DeleteSprintDialog, type Sprint as SprintType } from './DeleteSprintDialog';
import { SprintStatusBadge } from './SprintStatusBadge';
import { TaskTable } from '@/components/tasks/TaskTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';

const STATUS_FILTER_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const PRIORITY_FILTER_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'P0', label: 'P0 Critical' },
  { value: 'P1', label: 'P1 High' },
  { value: 'P2', label: 'P2 Medium High' },
  { value: 'P3', label: 'P3 Medium' },
  { value: 'P4', label: 'P4 Low' },
  { value: 'P5', label: 'P5 Lowest' },
];

const ALL_FILTER_VALUE = '__all__';

/** Display label so assignee filter works for both name and email: name (trimmed) or email. */
function getMemberLabel(m: { name: string | null; email: string }): string {
  const name = m.name?.trim();
  return name || m.email || 'Unnamed';
}

type SprintSelectorProps = {
  sprints: SprintType[];
  selected: SprintType | null;
  onSelect: (sprint: SprintType) => void;
};

function SprintSelector({ sprints, selected, onSelect }: SprintSelectorProps) {
  const statusColor: Record<SprintType['status'], string> = {
    NOT_STARTED: 'bg-slate-400',
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-muted-foreground/40',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-accent/40 transition-colors text-sm font-medium">
          {selected ? (
            <>
              <span className={cn('size-1.5 rounded-full shrink-0', statusColor[selected.status])} />
              <span className='text-muted-foreground'>{selected.title}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select sprint</span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {sprints.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No sprints found</p>
        ) : (
          <DropdownMenuRadioGroup value={selected?.id ?? ''} onValueChange={(id) => {
            const sprint = sprints.find((s) => s.id === id);
            if (sprint) onSelect(sprint);
          }}>
            {sprints.map((sprint) => (
              <DropdownMenuItem key={sprint.id} onClick={() => onSelect(sprint)} className="flex items-center gap-2">
                <span className={cn('size-1.5 rounded-full shrink-0', statusColor[sprint.status])} />
                <span className="truncate flex-1">{sprint.title}</span>
                {sprint.status === 'ACTIVE' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                    Active
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type Member = { id: string; name: string | null; email: string };

export default function Sprint() {
  const { projectId } = useProjectFromSearchParams();

  const [sprints, setSprints] = useState<SprintType[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<SprintType | null>(null);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);

  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<TaskPriority | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);

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

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.map((m: { id: string; name: string | null; email: string }) => ({ id: m.id, name: m.name, email: m.email })));
      }
    } catch { /* silent */ }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      setSprints([]);
      setSelectedSprint(null);
      void fetchSprints();
      void fetchMembers();
    }
  }, [projectId, fetchSprints, fetchMembers]);

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

  // Use a ref to hold the latest setter so the callback identity never changes,
  // preventing TaskTable's fetchTasks from re-running on every totalHours update.
  const setTotalHoursRef = useRef(setTotalHours);
  setTotalHoursRef.current = setTotalHours;

  const handleTasksLoaded = useCallback((tasks: Task[]) => {
    const sumHours = (list: Task[]): number =>
      list.reduce((acc, t) => {
        const sub = t.subtasks ? sumHours(t.subtasks) : 0;
        return acc + (t.estimatedHours ?? 0) + sub;
      }, 0);
    setTotalHoursRef.current(sumHours(tasks));
  }, []); // stable – no deps

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

  // Reset filters when switching sprints
  const handleSprintSelect = (sprint: SprintType) => {
    setSelectedSprint(sprint);
    setFilterAssigneeId(null);
    setFilterPriority(null);
    setFilterStatus(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full w-full overflow-y-auto">
      <div className="flex items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <SprintSelector
            sprints={sprints}
            selected={selectedSprint}
            onSelect={handleSprintSelect}
          />
          {selectedSprint && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <SprintStatusBadge status={selectedSprint.status} />
            </>
          )}
          {selectedSprint && (
            <>
              <Separator orientation="vertical" className="h-5" />
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
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AddSprintDialog onSuccess={handleSprintCreated} />
          {selectedSprint && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={!selectedSprint}
                onClick={() => {
                  if (selectedSprint) setEditSprint(selectedSprint);
                }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit sprint</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                disabled={!selectedSprint}
                onClick={() => {
                  if (selectedSprint) setDeleteSprint(selectedSprint);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete sprint</span>
              </Button>
            </>
          )}
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
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground/80 mr-1">Filters:</span>
            <Select
              value={filterAssigneeId ?? ALL_FILTER_VALUE}
              onValueChange={(v) => setFilterAssigneeId(v === ALL_FILTER_VALUE ? null : v)}
            >
              <SelectTrigger size="sm" className="h-8 w-[140px] text-xs font-normal">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={ALL_FILTER_VALUE}>All assignees</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {getMemberLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterPriority ?? ALL_FILTER_VALUE}
              onValueChange={(v) => setFilterPriority(v === ALL_FILTER_VALUE ? null : (v as TaskPriority))}
            >
              <SelectTrigger size="sm" className="h-8 w-[140px] text-xs font-normal">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={ALL_FILTER_VALUE}>All priorities</SelectItem>
                {PRIORITY_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus ?? ALL_FILTER_VALUE}
              onValueChange={(v) => setFilterStatus(v === ALL_FILTER_VALUE ? null : (v as TaskStatus))}
            >
              <SelectTrigger size="sm" className="h-8 w-[140px] text-xs font-normal">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterAssigneeId || filterPriority || filterStatus) && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFilterAssigneeId(null);
                    setFilterPriority(null);
                    setFilterStatus(null);
                  }}
                >
                  <X className="size-3" />
                  Clear filters
                </Button>
              </>
            )}
          </div>
          <TaskTable
            key={`${selectedSprint.id}-${refreshKey}`}
            sprintId={selectedSprint.id}
            onRefresh={() => setRefreshKey((k) => k + 1)}
            onLoad={handleTasksLoaded}
            assigneeId={filterAssigneeId}
            priority={filterPriority}
            status={filterStatus}
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