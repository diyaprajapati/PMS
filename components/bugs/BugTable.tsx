"use client";

import { useState } from "react";
import { MoreHorizontalIcon, Trash2Icon, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useBugsQuery } from "@/queries/bugs.queries";
import { useDeleteBugMutation, useProjectMembersQuery, useUpdateBugMutation } from "@/queries/bugs.queries";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { BUG_PRIORITY_OPTIONS, BUG_STATUS_OPTIONS, type BugStatus } from "@/types/bug";
import type { TaskPriority } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type BugTableProps = {
  onSelectBug: (bugId: string) => void;
  selectedBugId: string | null;
};

function initials(name: string | null | undefined, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

// Status pill with popover
function StatusPill({ status, onUpdate }: { status: BugStatus; onUpdate: (s: BugStatus) => void }) {
  const [open, setOpen] = useState(false);
  const option = BUG_STATUS_OPTIONS.find((o) => o.value === status) || BUG_STATUS_OPTIONS[0];

  const getStatusClasses = (s: BugStatus) => {
    switch (s) {
      case "NOT_STARTED":
        return "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "IN_PROGRESS":
        return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "IN_REVIEW":
        return "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "FIXED":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "CLOSED":
        return "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400";
      default:
        return "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors hover:opacity-80",
            getStatusClasses(status)
          )}
        >
          <span>{option.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-1 w-36" onClick={(e) => e.stopPropagation()}>
        {BUG_STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              onUpdate(o.value);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
              status === o.value && "bg-accent"
            )}
          >
            <span>{o.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Priority pill with popover
function PriorityPill({ priority, onUpdate }: { priority: TaskPriority; onUpdate: (p: TaskPriority) => void }) {
  const [open, setOpen] = useState(false);
  const option = BUG_PRIORITY_OPTIONS.find((o) => o.value === priority) || BUG_PRIORITY_OPTIONS[3];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-border/60 text-muted-foreground/80 bg-background/60 hover:bg-accent/40 transition-colors cursor-pointer"
        >
          <span className="font-semibold">{option.value}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-1 w-44" onClick={(e) => e.stopPropagation()}>
        {BUG_PRIORITY_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              onUpdate(o.value);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
              priority === o.value && "bg-accent"
            )}
          >
            <span className="font-semibold w-8 text-xs">{o.value}</span>
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Assignee picker with avatar
function AssigneePicker({
  assigneeId,
  assigneeName,
  assigneeEmail,
  assigneeImage,
  members,
  onUpdate,
}: {
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  assigneeImage: string | null;
  members: { id: string; name: string | null; email: string; image: string | null }[];
  onUpdate: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          title={assigneeName || assigneeEmail || "Assign member"}
          className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
        >
          {assigneeId ? (
            <Avatar size="sm">
              {assigneeImage && <AvatarImage src={assigneeImage} />}
              <AvatarFallback className="text-[10px]">
                {initials(assigneeName, assigneeEmail || "??")}
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
          onClick={() => {
            onUpdate(null);
            setOpen(false);
          }}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
            !assigneeId && "bg-accent"
          )}
        >
          <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserRound className="size-3 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">Unassigned</span>
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              onUpdate(m.id);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
              assigneeId === m.id && "bg-accent"
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

export function BugTable({ onSelectBug, selectedBugId }: BugTableProps) {
  const { projectId } = useProjectFromSearchParams();
  const [deleteBugId, setDeleteBugId] = useState<string | null>(null);
  const { data: bugs = [], isLoading } = useBugsQuery(projectId);
  const { data: members = [] } = useProjectMembersQuery(projectId);
  const updateBugMutation = useUpdateBugMutation(projectId);
  const deleteBugMutation = useDeleteBugMutation(projectId);

  const handlePatch = async (
    bugId: string,
    payload: { assigneeId?: string | null; status?: BugStatus; priority?: TaskPriority }
  ) => {
    try {
      await updateBugMutation.mutateAsync({ bugId, payload });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update bug");
    }
  };

  const handleDelete = async () => {
    if (!deleteBugId) return;
    try {
      await deleteBugMutation.mutateAsync(deleteBugId);
      toast.success("Bug deleted");
      setDeleteBugId(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete bug");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/60 overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          <div className="flex-1 text-left">Title</div>
          <div className="w-28 text-center">Status</div>
          <div className="w-24 text-center">Priority</div>
          <div className="w-20 text-center">Assignee</div>
          <div className="w-16 text-center">Actions</div>
        </div>
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-4 border-b border-border/25"
            >
              <div className="h-3 rounded bg-muted/60 animate-pulse" style={{ width: `${180 + i * 40}px` }} />
              <div className="ml-auto h-3 w-24 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-6 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-3 w-8 rounded bg-muted/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-background/60 overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center px-4 py-2 border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          <div className="flex-1 text-left">Title</div>
          <div className="w-28 text-center">Status</div>
          <div className="w-24 text-center">Priority</div>
          <div className="w-20 text-center">Assignee</div>
          <div className="w-16 text-center">Actions</div>
        </div>

        <div>
          {bugs.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No bugs reported yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Bug" to report your first bug</p>
            </div>
          ) : (
            bugs.map((bug) => (
              <div
                key={bug.id}
                className={cn(
                  "group/row flex items-center border-b border-border/25 hover:bg-accent/5 transition-colors cursor-pointer",
                  selectedBugId === bug.id && "bg-accent/10 hover:bg-accent/15"
                )}
                onClick={() => onSelectBug(bug.id)}
              >
                {/* Title */}
                <div className="flex-1 min-w-0 px-4 py-3">
                  <p className="text-sm font-medium truncate">
                    <span className="font-mono text-xs text-muted-foreground/70 mr-2">
                      BUG-{bug.bugNumber}
                    </span>
                    {bug.title}
                  </p>
                </div>

                {/* Status */}
                <div className="w-28 shrink-0 flex items-center justify-center px-2">
                  <StatusPill
                    status={bug.status}
                    onUpdate={(status) => handlePatch(bug.id, { status })}
                  />
                </div>

                {/* Priority */}
                <div className="w-24 shrink-0 flex items-center justify-center px-2">
                  <PriorityPill
                    priority={bug.priority}
                    onUpdate={(priority) => handlePatch(bug.id, { priority })}
                  />
                </div>

                {/* Assignee */}
                <div className="w-20 shrink-0 flex items-center justify-center">
                  <AssigneePicker
                    assigneeId={bug.assigneeId}
                    assigneeName={bug.assignee?.user?.name || null}
                    assigneeEmail={bug.assignee?.user?.email || null}
                    assigneeImage={bug.assignee?.user?.image || null}
                    members={members.map((m) => ({
                      id: m.id,
                      name: m.name,
                      email: m.email,
                      image: m.image,
                    }))}
                    onUpdate={(assigneeId) => handlePatch(bug.id, { assigneeId })}
                  />
                </div>

                {/* Actions */}
                <div
                  className="w-16 shrink-0 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 border border-border/60 bg-background/60 hover:bg-accent/40"
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                      <DropdownMenuItem onClick={() => onSelectBug(bug.id)} className="cursor-pointer">
                        Open details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteBugId(bug.id)}
                        className="cursor-pointer"
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteBugId} onOpenChange={(open) => !open && setDeleteBugId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bug</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this bug and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
