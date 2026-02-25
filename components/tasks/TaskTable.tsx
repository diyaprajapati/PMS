'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DeleteTaskDialog } from './DeleteTaskDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import type { Task, TaskStatus } from '@/types/task';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image?: string | null;
  role: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateTaskInList(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, ...patch }
      : t.subtasks
      ? { ...t, subtasks: updateTaskInList(t.subtasks, id, patch) }
      : t
  );
}

function replaceTaskInList(tasks: Task[], id: string, next: Task): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, ...next }
      : t.subtasks
      ? { ...t, subtasks: replaceTaskInList(t.subtasks, id, next) }
      : t
  );
}

function addSubtaskToList(tasks: Task[], parentId: string, sub: Task): Task[] {
  return tasks.map((t) =>
    t.id === parentId
      ? {
          ...t,
          subtasks: [...(t.subtasks ?? []), sub],
          _count: { subtasks: (t._count?.subtasks ?? 0) + 1 },
        }
      : t.subtasks
      ? { ...t, subtasks: addSubtaskToList(t.subtasks, parentId, sub) }
      : t
  );
}

/** Derives parent task status from its subtasks */
function deriveStatus(task: Task): TaskStatus {
  const subs = task.subtasks ?? [];
  if (subs.length === 0) return task.status;
  if (subs.every((s) => s.status === 'DONE')) return 'DONE';
  if (subs.every((s) => s.status === 'TODO')) return 'TODO';
  return 'IN_PROGRESS';
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
  dot: string;
  text: string;
}[] = [
  { value: 'TODO', label: 'To Do', dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400' },
  { value: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'DONE', label: 'Done', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
];

function statusOpt(s: TaskStatus) {
  return STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];
}

function initials(name: string | null | undefined, email: string) {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// StatusPill – editable (subtasks only)
// ---------------------------------------------------------------------------

function StatusPill({ status, onUpdate }: { status: TaskStatus; onUpdate: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const opt = statusOpt(status);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium hover:bg-accent/50 transition-colors"
        >
          <span className={cn('size-1.5 rounded-full shrink-0', opt.dot)} />
          <span className={opt.text}>{opt.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 w-36" onClick={(e) => e.stopPropagation()}>
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => { onUpdate(o.value); setOpen(false); }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left',
              status === o.value && 'bg-accent'
            )}
          >
            <span className={cn('size-1.5 rounded-full shrink-0', o.dot)} />
            <span className={o.text}>{o.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// AssigneePicker – editable (subtasks only)
// ---------------------------------------------------------------------------

function AssigneePicker({
  assignee,
  members,
  onUpdate,
}: {
  assignee: Task['assignee'];
  members: Member[];
  onUpdate: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = assignee?.user.name || assignee?.user.email;

  // All members now have real ProjectMember IDs (owner is upserted on fetch)
  const assignableMembers = members;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          title={name ?? 'Assign member'}
          className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
        >
          {assignee ? (
            <Avatar size="sm">
              {assignee.user.image && <AvatarImage src={assignee.user.image} />}
              <AvatarFallback className="text-[10px]">
                {initials(assignee.user.name, assignee.user.email)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center hover:border-muted-foreground/40 transition-colors">
              <UserRound className="size-3 text-muted-foreground/30" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-1 w-48" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => { onUpdate(null); setOpen(false); }}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left',
            !assignee && 'bg-accent'
          )}
        >
          <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserRound className="size-3 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">Unassigned</span>
        </button>
        {assignableMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => { onUpdate(m.id); setOpen(false); }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left',
              assignee?.id === m.id && 'bg-accent'
            )}
          >
            <Avatar size="sm">
              {m.image && <AvatarImage src={m.image} />}
              <AvatarFallback className="text-[10px]">{initials(m.name, m.email)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{m.name || m.email}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// EstimateField – click to edit inline
// ---------------------------------------------------------------------------

function EstimateField({ value, onSave }: { value: number | null; onSave: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { ref.current?.focus(); ref.current?.select(); }
  }, [editing]);

  const commit = () => {
    const t = draft.trim();
    if (!t) { onSave(null); } else {
      const n = parseFloat(t);
      if (!isNaN(n) && n >= 0) onSave(n);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        type="number"
        min={0}
        step={0.5}
        className="w-12 text-right text-xs bg-transparent outline-none border-b border-primary text-foreground"
        placeholder="0"
      />
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value?.toString() ?? '');
        setEditing(true);
      }}
      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors tabular-nums"
    >
      {value != null ? `${value}h` : <span className="opacity-25">—</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TitleField – double-click to edit
// ---------------------------------------------------------------------------

function TitleField({ value, onSave, placeholder = 'Task title...' }: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => { ref.current?.focus(); ref.current?.select(); }, 0);
  };

  const commit = () => {
    const t = draft.trim();
    if (t && t !== value) onSave(t);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium placeholder:text-muted-foreground/40"
      />
    );
  }

  return (
    <span
      className="text-sm font-medium cursor-default select-none truncate"
      onDoubleClick={startEdit}
      title={value}
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// NewTaskRow – "+ New task / subtask" inline row
// ---------------------------------------------------------------------------

function NewTaskRow({ depth = 0, onSave, placeholder = 'New task...' }: {
  depth?: number;
  onSave: (title: string) => void;
  placeholder?: string;
}) {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const activate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActive(true);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const commit = () => {
    const t = draft.trim();
    if (t) onSave(t);
    setDraft('');
    setActive(false);
  };

  const indent = depth * 24 + 36;

  if (!active) {
    return (
      <button
        onClick={activate}
        className="w-full flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-muted/20 transition-colors py-2"
        style={{ paddingLeft: `${indent}px` }}
      >
        <Plus className="size-3.5 shrink-0" />
        <span>{placeholder}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center bg-muted/10" style={{ paddingLeft: `${indent - 2}px` }}>
      <Plus className="size-3.5 shrink-0 text-muted-foreground/40 mr-1.5" />
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(''); setActive(false); }
        }}
        placeholder={placeholder}
        className="flex-1 py-2 pr-4 bg-transparent outline-none text-sm font-medium placeholder:text-muted-foreground/40"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskRow – renders differently for main tasks vs subtasks
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  depth,
  members,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: {
  task: Task;
  depth: number;
  members: Member[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const isMain = depth === 0;
  const subtasks = task.subtasks ?? [];
  const totalSubs = subtasks.length || task._count?.subtasks || 0;
  const doneSubs = subtasks.filter((s) => s.status === 'DONE').length;
  const derivedStatus = deriveStatus(task);
  const derivedOpt = statusOpt(derivedStatus);

  // For main tasks: total estimate = sum of subtask estimates
  const subtaskTotalHours = subtasks.reduce(
    (sum, s) => sum + Number(s.estimatedHours ?? 0),
    0
  );
  const hasSubtasks = subtasks.length > 0;

  return (
    <div
      className={cn(
        'group/row flex items-center border-b border-border/30 hover:bg-muted/20 transition-colors',
        !isMain && 'bg-muted/4'
      )}
      style={{ paddingLeft: `${depth * 24}px` }}
    >
      {/* Expand chevron (always shown for top-level; only for subtasks with children) */}
      <div className="flex items-center justify-center size-8 shrink-0">
        {(isMain || totalSubs > 0) ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="flex items-center justify-center size-5 rounded text-muted-foreground/40 hover:text-foreground hover:bg-accent/60 transition-all"
          >
            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        ) : (
          <div className="size-5 flex items-center justify-center">
            <span className="size-1 rounded-full bg-muted-foreground/15" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center py-2.5 pr-2">
        <TitleField
          value={task.title}
          onSave={(title) => onUpdate({ title })}
        />
      </div>

      {/* --- Right-side columns differ by depth --- */}
      {isMain ? (
        // Main task: derived status dot + subtask count
        <div className="flex items-center gap-3 pr-1">
          {totalSubs > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <span className={cn('size-1.5 rounded-full', derivedOpt.dot)} />
              <span className="tabular-nums">{doneSubs}/{totalSubs}</span>
            </span>
          )}
        </div>
      ) : (
        // Subtask: editable status + editable assignee
        <>
          <div className="w-28 shrink-0 flex items-center">
            <StatusPill status={task.status} onUpdate={(status) => onUpdate({ status })} />
          </div>
          <div className="w-10 shrink-0 flex items-center justify-center">
            <AssigneePicker
              assignee={task.assignee}
              members={members}
              onUpdate={(assigneeId) => onUpdate({ assigneeId })}
            />
          </div>
        </>
      )}

      {/* Estimate */}
      <div className="w-14 shrink-0 flex items-center justify-end pr-2">
        {isMain && hasSubtasks ? (
          // Computed, non-editable: sum of subtask estimates
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {subtaskTotalHours > 0 ? `${subtaskTotalHours}h` : <span className="opacity-25">—</span>}
          </span>
        ) : (
          // Editable: own estimate (main tasks with no subtasks, or all subtasks)
          <EstimateField
            value={task.estimatedHours ?? null}
            onSave={(estimatedHours) => onUpdate({ estimatedHours })}
          />
        )}
      </div>

      {/* Delete (hover only) */}
      <div className="w-9 shrink-0 flex items-center justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="size-6 flex items-center justify-center rounded opacity-0 group-hover/row:opacity-100 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TaskTable export
// ---------------------------------------------------------------------------

export function TaskTable({
  onRefresh,
  sprintId,
  onLoad,
}: {
  onRefresh?: () => void;
  /** 'backlog' | sprint-uuid | undefined (no filter) */
  sprintId?: string | null;
  onLoad?: (tasks: Task[]) => void;
}) {
  const { projectId } = useProjectFromSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchTasks = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      setLoading(true);
      const params = new URLSearchParams({ includeSubtasks: 'true', parentTaskId: 'null' });
      if (sprintId === 'backlog') params.set('sprintId', 'backlog');
      else if (sprintId) params.set('sprintId', sprintId);

      const res = await fetch(`/api/projects/${projectId}/tasks?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: Task[] = await res.json();
      setTasks(data);
      onLoad?.(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId, onLoad]);

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, { credentials: 'include' });
      if (res.ok) setMembers(await res.json());
    } catch { /* silent */ }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [fetchTasks, fetchMembers]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const handleUpdate = useCallback(async (taskId: string, data: Record<string, unknown>) => {
    if (!projectId) return;

    // Optimistic patch – resolve assignee relation for instant avatar
    const optimistic: Partial<Task> & Record<string, unknown> = { ...data };
    if ('assigneeId' in data) {
      if (data.assigneeId === null) {
        optimistic.assignee = null;
      } else {
        const m = members.find((m) => m.id === data.assigneeId);
        if (m) {
          optimistic.assignee = {
            id: m.id,
            role: m.role,
            user: { id: m.userId, name: m.name, email: m.email, image: null },
          };
        }
      }
    }

    setTasks((prev) => updateTaskInList(prev, taskId, optimistic));

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e?.error ?? 'Update failed');
      }
      const updated: Task = await res.json();
      setTasks((prev) => replaceTaskInList(prev, taskId, updated));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task');
      fetchTasks();
    }
  }, [projectId, members, fetchTasks]);

  const handleCreate = useCallback(async (title: string, parentTaskId?: string | null) => {
    if (!projectId || !title.trim()) return;
    try {
      const body: Record<string, unknown> = { title: title.trim(), parentTaskId: parentTaskId ?? null };
      // Assign to sprint context if creating a top-level task
      if (!parentTaskId && sprintId && sprintId !== 'backlog') {
        body.sprintId = sprintId;
      }

      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e?.error ?? 'Create failed');
      }
      const newTask: Task = await res.json();
      if (parentTaskId) {
        setTasks((prev) => addSubtaskToList(prev, parentTaskId, newTask));
        setExpandedIds((prev) => new Set([...prev, parentTaskId]));
      } else {
        setTasks((prev) => [newTask, ...prev]);
      }
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    }
  }, [projectId, sprintId, onRefresh]);

  const handleDelete = useCallback(async (task: Task) => {
    if (!projectId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error ?? 'Delete failed');
      }
      toast.success('Task deleted');
      setDeleteTarget(null);
      fetchTasks();
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  }, [projectId, fetchTasks, onRefresh]);

  const toggleExpand = (taskId: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });

  // -------------------------------------------------------------------------
  // Recursive render
  // -------------------------------------------------------------------------

  const renderRows = (taskList: Task[], depth: number): React.ReactNode[] =>
    taskList.flatMap((task) => {
      const isExpanded = expandedIds.has(task.id);
      const rows: React.ReactNode[] = [
        <TaskRow
          key={task.id}
          task={task}
          depth={depth}
          members={members}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleExpand(task.id)}
          onUpdate={(data) => handleUpdate(task.id, data)}
          onDelete={() => setDeleteTarget(task)}
        />,
      ];

      if (isExpanded) {
        rows.push(...renderRows(task.subtasks ?? [], depth + 1));
        rows.push(
          <NewTaskRow
            key={`new-sub-${task.id}`}
            depth={depth + 1}
            onSave={(title) => handleCreate(title, task.id)}
            placeholder="New subtask..."
          />
        );
      }

      return rows;
    });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <div className="size-4 rounded bg-muted animate-pulse" />
            <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${100 + i * 40}px` }} />
            <div className="ml-auto h-3 w-10 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Click &ldquo;New task&rdquo; below to add one
            </p>
          </div>
        ) : (
          renderRows(tasks, 0)
        )}

        <NewTaskRow
          depth={0}
          onSave={(title) => handleCreate(title, null)}
          placeholder="New task..."
        />
      </div>

      <DeleteTaskDialog
        task={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
