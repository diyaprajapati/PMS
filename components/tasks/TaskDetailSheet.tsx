"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
};

type TaskDetailSheetProps = {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

function initials(name: string | null | undefined, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return email.slice(0, 2).toUpperCase();
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
  onUpdated,
}: TaskDetailSheetProps) {
  const { projectId } = useProjectFromSearchParams();
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("P3");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectId || !taskId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [taskRes, membersRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
            credentials: "include",
          }),
          fetch(`/api/projects/${projectId}/members`, {
            credentials: "include",
          }),
        ]);

        if (!taskRes.ok) {
          throw new Error("Failed to load task details");
        }
        const taskData: Task = await taskRes.json();
        setTask(taskData);

        setTitle(taskData.title);
        setDescription(taskData.description || "");
        setAcceptanceCriteria(taskData.acceptanceCriteria || "");
        setStatus(taskData.status);
        setPriority(taskData.priority ?? "P3");
        setEstimatedHours(
          taskData.estimatedHours != null
            ? String(taskData.estimatedHours)
            : ""
        );
        setAssigneeId(taskData.assigneeId);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load subtask details");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [open, projectId, taskId]);

  const handleSave = async () => {
    if (!projectId || !taskId || !task) return;

    const hoursValue = estimatedHours.trim()
      ? parseFloat(estimatedHours)
      : null;
    if (hoursValue !== null && (isNaN(hoursValue) || hoursValue < 0)) {
      toast.error("Estimated hours must be a positive number");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        acceptanceCriteria: acceptanceCriteria.trim() || null,
        priority,
        estimatedHours: hoursValue,
      };

      // Only subtasks can change status directly; parents with subtasks are controlled by rules
      if (task.parentTaskId) {
        payload.status = status;
      }

      const [updateRes, assignRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }),
        fetch(`/api/projects/${projectId}/tasks/${taskId}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ assigneeId }),
        }),
      ]);

      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update subtask");
      }
      if (!assignRes.ok) {
        const data = await assignRes.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update subtask assignee");
      }

      const updated: Task = await updateRes.json();
      setTask(updated);
      toast.success("Subtask updated");
      onUpdated?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update subtask",
      );
    } finally {
      setSaving(false);
    }
  };

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      onOpenChange(false);
      setTask(null);
    } else {
      onOpenChange(true);
    }
  };

  const isSubtask = !!task?.parentTaskId;

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <SheetTitle className="text-xl font-display">
            {task ? task.title : "Subtask details"}
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-muted-foreground/80">
            {task
              ? isSubtask
                ? "Subtask"
                : "Task"
              : "Loading subtask details"}
          </SheetDescription>
        </SheetHeader>

        {loading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading subtask details...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                  Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Add markdown-friendly description, links, etc."
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground/80">
                      Preview
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">
                      Supports GitHub-flavored Markdown
                    </span>
                  </div>
                  <div className="border border-border/60 rounded-lg px-3 py-2 bg-muted/20 text-sm text-foreground/90 min-h-[72px]">
                    {description.trim() ? (
                      <MarkdownRenderer content={description} />
                    ) : (
                      <span className="text-xs text-muted-foreground/70 italic">
                        Nothing to preview yet. Start typing above to see it here.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                  Acceptance criteria
                </Label>
                <Textarea
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  rows={3}
                  placeholder="Define what 'done' means for this subtask"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as TaskStatus)
                    }
                    disabled={!isSubtask}
                  >
                    <SelectTrigger className="w-full h-9 bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isSubtask && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Parent task status is derived from its subtasks.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as TaskPriority)
                    }
                  >
                    <SelectTrigger className="w-full h-9 bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P0">P0 – Critical</SelectItem>
                      <SelectItem value="P1">P1 – High</SelectItem>
                      <SelectItem value="P2">P2 – Medium High</SelectItem>
                      <SelectItem value="P3">P3 – Medium</SelectItem>
                      <SelectItem value="P4">P4 – Low</SelectItem>
                      <SelectItem value="P5">P5 – Lowest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                    Estimated hours
                  </Label>
                  <Input
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="e.g. 3.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/80">
                  Assignee
                </Label>
                <Select
                  value={assigneeId || "unassigned"}
                  onValueChange={(value) =>
                    setAssigneeId(value === "unassigned" ? null : value)
                  }
                >
                  <SelectTrigger className="w-full h-9 bg-background/60">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {task.assignee && task.assignee.user && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/80">
                    <Avatar size="sm">
                      {task.assignee.user.image && (
                        <AvatarImage
                          src={task.assignee.user.image}
                          alt={task.assignee.user.name ?? ""}
                        />
                      )}
                      <AvatarFallback className="text-[10px] font-medium">
                        {initials(
                          task.assignee.user.name,
                          task.assignee.user.email,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {task.assignee.user.name || task.assignee.user.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs text-muted-foreground/80 border-t border-border/60 pt-4">
                <div>
                  <span className="font-medium text-foreground block">
                    Created
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(task.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-foreground block">
                    Last updated
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(task.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-t border-border/60 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => close(false)}
            disabled={saving}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !task}
            className="cursor-pointer"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

