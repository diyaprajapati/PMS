'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteTaskDialog } from './DeleteTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetailSheet } from './TaskDetailSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAssignTaskMutation,
  useMoveTaskMutation,
  taskQueryKeys,
} from '@/queries/tasks.queries';
import { useProjectMembersQuery } from '@/queries/bugs.queries';
import { useSprintsQuery } from '@/queries/sprints.queries';
import type { CreateTaskPayload, UpdateTaskPayload, TaskFilters } from '@/services/tasks.service';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';

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

function removeTaskFromList(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) =>
      t.subtasks
        ? {
            ...t,
            subtasks: removeTaskFromList(t.subtasks, id),
            _count: { subtasks: t.subtasks.filter((s) => s.id !== id).length },
          }
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

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  code: string;
}[] = [
  { value: 'P0', label: 'Critical', code: 'P0' },
  { value: 'P1', label: 'High', code: 'P1' },
  { value: 'P2', label: 'Medium High', code: 'P2' },
  { value: 'P3', label: 'Medium', code: 'P3' },
  { value: 'P4', label: 'Low', code: 'P4' },
  { value: 'P5', label: 'Lowest', code: 'P5' },
];

const priorityStyles: Record<TaskPriority, string> = {
  P0: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700',
  P1: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700',
  P2: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700',
  P3: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700',
  P4: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600',
  P5: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700',
};

function priorityOpt(p: TaskPriority): (typeof PRIORITY_OPTIONS)[number] {
  return PRIORITY_OPTIONS.find((o) => o.value === p) ?? PRIORITY_OPTIONS[3];
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
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer',
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
  const user = assignee?.user;
  const name = user?.name || user?.email;

  // All members now have real ProjectMember IDs (owner is upserted on fetch)
  const assignableMembers = members;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          title={name ?? 'Assign member'}
          className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
        >
          {user ? (
            <Avatar size="sm">
              {user.image && <AvatarImage src={user.image} />}
              <AvatarFallback className="text-[10px]">
                {initials(user.name, user.email)}
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
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer',
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
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer',
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
// PriorityPill – editable for both main tasks and subtasks
// ---------------------------------------------------------------------------

function PriorityPill({
  priority,
  onUpdate,
}: {
  priority: TaskPriority;
  onUpdate: (p: TaskPriority) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer',
            priorityStyles[priority]
          )}
        >
          <span className="font-semibold">{priority}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-1 w-44" onClick={(e) => e.stopPropagation()}>
        {PRIORITY_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => { onUpdate(o.value); setOpen(false); }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer',
              priority === o.value && 'bg-accent'
            )}
          >
            <span className={cn(
              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
              priorityStyles[o.value]
            )}>
              {o.code}
            </span>
            <span className="truncate">{o.label}</span>
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
        className="w-12 text-right text-xs bg-transparent outline-none border-b border-primary text-foreground cursor-pointer"
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
      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors tabular-nums cursor-pointer"
    >
      {value != null ? `${value}h` : <span className="opacity-25">—</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TitleField – double-click to edit
// ---------------------------------------------------------------------------

function TitleField({
  value,
  onSave,
  placeholder = 'Task title...',
  editable = true,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  editable?: boolean;
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

  if (!editable) {
    return (
      <span className="block text-sm font-medium truncate">
        {value}
      </span>
    );
  }

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
      className="block text-sm font-medium cursor-default select-none truncate"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={startEdit}
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
        className="w-full flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-muted-foreground/40 hover:bg-muted/20 transition-colors py-2"
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
  onEdit,
  onOpenDetail,
  onMoveToBacklog,
  onMoveToSprint,
}: {
  task: Task;
  depth: number;
  members: Member[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onOpenDetail?: () => void;
  onMoveToBacklog?: () => void;
  onMoveToSprint?: () => void;
}) {
  const isMain = depth === 0;
  const subtasks = task.subtasks ?? [];
  const totalSubs = subtasks.length || task._count?.subtasks || 0;
  const doneSubs = subtasks.filter((s) => s.status === 'DONE').length;
  const derivedStatus = deriveStatus(task);
  const derivedOpt = statusOpt(derivedStatus);

  const hasSubtasks = subtasks.length > 0;
  const progressPercent = isMain
    ? totalSubs > 0
      ? (doneSubs / totalSubs) * 100
      : 0
    : task.status === 'DONE'
      ? 100
      : 0;

  return (
    <div
      className={cn(
        'group/row flex w-full items-center border-b border-border/25 hover:bg-accent/5 transition-colors',
        isMain ? 'bg-background' : 'bg-background/40'
      )}
      style={{ paddingLeft: `${depth * 24}px` }}
      onClick={() => {
        if (!isMain && onOpenDetail) {
          onOpenDetail();
        }
      }}
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
      <div
        className={cn(
          'flex-1 min-w-0 max-w-[420px] flex items-center pr-2 overflow-hidden',
          isMain ? 'py-3' : 'py-2'
        )}
      >
        {/* <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild> */}
              <div className="w-full min-w-0 cursor-pointer">
                <TitleField
                  value={task.title}
                  onSave={(title) => onUpdate({ title })}
                  editable={isMain}
                />
              </div>
            {/* </TooltipTrigger>
            <TooltipContent side="top">
              <span className="max-w-xs break-words text-left">{task.title}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider> */}
      </div>

      {/* Right-side columns: Status | Priority | Assignee | Actions */}
      <div className="ml-auto flex items-center">
        {/* Status column – pill for both main and subtasks */}
        <div className="w-28 shrink-0 flex items-center justify-center px-2">
          {isMain ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                derivedStatus === 'TODO'
                  ? 'border-slate-500/40 bg-slate-500/10 dark:bg-slate-500/10 text-slate-800 dark:text-slate-200' :
                derivedStatus === 'DONE'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : derivedStatus === 'IN_PROGRESS'
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                    : 'border-slate-500/40 bg-slate-500/10 text-slate-200'
              )}
            >
              <span className={cn('size-1.5 rounded-full', derivedOpt.dot)} />
              <span>{statusOpt(derivedStatus).label}</span>
            </span>
          ) : (
            <StatusPill
              status={task.status}
              onUpdate={(status) => onUpdate({ status })}
            />
          )}
        </div>

        {/* Priority column – editable dropdown */}
        <div className="w-24 shrink-0 flex items-center justify-center px-2">
          <PriorityPill
            priority={task.priority}
            onUpdate={(priority) => onUpdate({ priority })}
          />
        </div>

        {/* Assignee column */}
        <div className="w-20 shrink-0 flex items-center justify-center">
          {isMain ? (
            (() => {
              const subAssignees =
                subtasks
                  .map((s) => s.assignee)
                  .filter(
                    (a): a is NonNullable<Task['assignee']> =>
                      !!a && !!a.user
                  ) ?? [];
              const uniqueAssignees: NonNullable<Task['assignee']>[] = [];
              const seen = new Set<string>();
              for (const a of subAssignees) {
                if (!seen.has(a.id)) {
                  seen.add(a.id);
                  uniqueAssignees.push(a);
                }
              }

              if (uniqueAssignees.length === 0) {
                if (!task.assignee) return null;
                const a = task.assignee;
                const name = a.user.name || a.user.email;
                return (
                  <div title={name ?? undefined} className="rounded-full">
                    <Avatar size="sm">
                      {a.user.image && <AvatarImage src={a.user.image} />}
                      <AvatarFallback className="text-[10px]">
                        {initials(a.user.name, a.user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                );
              }

              if (uniqueAssignees.length === 1 && uniqueAssignees[0].user) {
                const a = uniqueAssignees[0];
                const name = a.user.name || a.user.email;
                return (
                  <div title={name ?? undefined} className="rounded-full">
                    <Avatar size="sm">
                      {a.user.image && <AvatarImage src={a.user.image} />}
                      <AvatarFallback className="text-[10px]">
                        {initials(a.user.name, a.user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                );
              }

              const visible = uniqueAssignees
                .filter((a) => !!a.user)
                .slice(0, 3);
              const remaining = uniqueAssignees.length - visible.length;

              return (
                <AvatarGroup>
                  {visible.map((a) => (
                    <Avatar key={a.id} size="sm" title={a.user.name || a.user.email}>
                      {a.user.image && <AvatarImage src={a.user.image} />}
                      <AvatarFallback className="text-[10px]">
                        {initials(a.user.name, a.user.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remaining > 0 && (
                    <AvatarGroupCount className="text-[10px]">
                      +{remaining}
                    </AvatarGroupCount>
                  )}
                </AvatarGroup>
              );
            })()
          ) : (
            <AssigneePicker
              assignee={task.assignee}
              members={members}
              onUpdate={(assigneeId) => onUpdate({ assigneeId })}
            />
          )}
        </div>

        {/* Actions – three-dot menu (move / edit / delete) */}
        <div className="w-16 shrink-0 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {onMoveToBacklog && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToBacklog();
                  }}
                  className="cursor-pointer"
                >
                  <ArrowRightLeft className="size-4 mr-2" />
                  Move to backlog
                </DropdownMenuItem>
              )}
              {onMoveToSprint && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToSprint();
                  }}
                  className="cursor-pointer"
                >
                  <ArrowRightLeft className="size-4 mr-2" />
                  Move to sprint
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="cursor-pointer"
              >
                <Pencil className="size-4 mr-2" />
                Edit task
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="cursor-pointer"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TaskTable export
// ---------------------------------------------------------------------------

export function TaskTable({
  sprintId,
  onLoad,
  assigneeId: filterAssigneeId,
  priority: filterPriority,
  status: filterStatus,
}: {
  /** 'backlog' | sprint-uuid | undefined (no filter) */
  sprintId?: string | null;
  onLoad?: (tasks: Task[]) => void;
  /** Optional filters for sprints view */
  assigneeId?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus | null;
}) {
  const queryClient = useQueryClient();
  const { projectId } = useProjectFromSearchParams();

  const filters = useMemo<TaskFilters>(
    () => ({
      sprintId: sprintId ?? undefined,
      assigneeId: filterAssigneeId ?? undefined,
      priority: filterPriority ?? undefined,
      status: filterStatus ?? undefined,
      parentTaskId: 'null',
      includeSubtasks: true,
    }),
    [sprintId, filterAssigneeId, filterPriority, filterStatus],
  );

  const { data: tasks, isLoading: loading } = useTasksQuery(projectId, filters);
  const { data: members } = useProjectMembersQuery(projectId);
  const { data: sprints } = useSprintsQuery(projectId);

  const createTaskMutation = useCreateTaskMutation(projectId, filters);
  const updateTaskMutation = useUpdateTaskMutation(projectId, filters);
  const deleteTaskMutation = useDeleteTaskMutation(projectId, filters);
  const assignTaskMutation = useAssignTaskMutation(projectId, filters);
  const moveTaskMutation = useMoveTaskMutation(projectId, filters);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    if (tasks) {
      onLoadRef.current?.(tasks);
    }
  }, [tasks]);

  const handleUpdate = useCallback(
    async (taskId: string, data: Record<string, unknown>) => {
      if (!projectId) return;
      const isAssigneeChange = Object.prototype.hasOwnProperty.call(data, 'assigneeId');
      try {
        if (isAssigneeChange) {
          await assignTaskMutation.mutateAsync({
            taskId,
            payload: { assigneeId: data.assigneeId as string | null },
          });
        } else {
          await updateTaskMutation.mutateAsync({
            taskId,
            payload: data as UpdateTaskPayload,
          });
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to update task');
      }
    },
    [projectId, assignTaskMutation, updateTaskMutation],
  );

  const handleCreate = useCallback(
    async (title: string, parentTaskId?: string | null) => {
      if (!projectId || !title.trim()) return;
      try {
        const payload: CreateTaskPayload = {
          title: title.trim(),
          parentTaskId: parentTaskId ?? null,
        };
        if (!parentTaskId && sprintId && sprintId !== 'backlog') {
          payload.sprintId = sprintId;
        }
        await createTaskMutation.mutateAsync(payload);
        if (parentTaskId) {
          setExpandedIds((prev) => new Set([...prev, parentTaskId]));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to create task');
      }
    },
    [projectId, sprintId, createTaskMutation],
  );

  const handleDelete = useCallback(
    async (task: Task) => {
      if (!projectId) return;
      try {
        await deleteTaskMutation.mutateAsync(task.id);
        toast.success('Task deleted');
        setDeleteTarget(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete task');
      }
    },
    [projectId, deleteTaskMutation],
  );

  const handleMoveToBacklog = useCallback(
    async (task: Task) => {
      if (!projectId) return;
      try {
        await moveTaskMutation.mutateAsync({
          taskId: task.id,
          payload: { sprintId: null },
        });
        toast.success('Task moved to backlog');
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to move task to backlog',
        );
      }
    },
    [projectId, moveTaskMutation],
  );

  const handleMoveToSprint = useCallback(
    async (task: Task) => {
      if (!projectId) return;
      if (!sprints?.length) {
        toast.error('No sprints available to move task into');
        return;
      }
      try {
        const active = sprints.find((s) => s.status === 'ACTIVE') ?? sprints[0];
        await moveTaskMutation.mutateAsync({
          taskId: task.id,
          payload: { sprintId: active.id },
        });
        toast.success('Task moved to sprint');
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to move task to sprint',
        );
      }
    },
    [projectId, sprints, moveTaskMutation],
  );

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
      const isBacklogView = sprintId === 'backlog';
      const isSprintView = !!sprintId && sprintId !== 'backlog';

      const rows: React.ReactNode[] = [
        <TaskRow
          key={task.id}
          task={task}
          depth={depth}
          members={members ?? []}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleExpand(task.id)}
          onUpdate={(data) => handleUpdate(task.id, data)}
          onDelete={() => setDeleteTarget(task)}
          onEdit={() => setEditTarget(task)}
          onOpenDetail={depth > 0 ? () => { setDetailTaskId(task.id); setDetailOpen(true); } : undefined}
          onMoveToBacklog={
            isSprintView && depth === 0 ? () => handleMoveToBacklog(task) : undefined
          }
          onMoveToSprint={
            isBacklogView && depth === 0 ? () => handleMoveToSprint(task) : undefined
          }
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
      <div className="rounded-xl border border-border/60 bg-background/60 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-border/30"
          >
            <div className="size-4 rounded bg-muted animate-pulse" />
            <div
              className="h-3 rounded bg-muted animate-pulse"
              style={{ width: `${120 + i * 40}px` }}
            />
            <div className="ml-auto h-3 w-10 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-background/60 overflow-hidden">
        {/* Column header row – Title | Status | Priority | Assignee | Actions */}
        <div className="flex items-center w-full px-4 py-2 border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          <div className="flex-1 text-left">Title</div>
          <div className="w-28 text-center">Status</div>
          <div className="w-24 text-center">Priority</div>
          <div className="w-20 text-center">Assignee</div>
          <div className="w-16 text-center">Actions</div>
        </div>

        <div>
          {!tasks?.length ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No tasks found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {filterAssigneeId || filterPriority || filterStatus
                  ? 'Try adjusting or clearing your filters'
                  : 'Click "New task" below to add one'}
              </p>
            </div>
          ) : (
            renderRows(tasks, 0)
          )}

          {/* Only show new task row when no filters are active */}
          {!filterAssigneeId && !filterPriority && !filterStatus && (
            <NewTaskRow
              depth={0}
              onSave={(title) => handleCreate(title, null)}
              placeholder="New task..."
            />
          )}
        </div>
      </div>

      <DeleteTaskDialog
        task={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleteTaskMutation.isPending}
      />

      <EditTaskDialog
        task={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSuccess={() => {
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(projectId, filters) });
          }
        }}
      />

      <TaskDetailSheet
        taskId={detailTaskId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailTaskId(null);
        }}
        onUpdated={() => {
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(projectId, filters) });
          }
        }}
      />
    </>
  );
}