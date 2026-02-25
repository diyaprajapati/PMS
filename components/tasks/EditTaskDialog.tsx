'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import type { Task, TaskStatus } from '@/types/task';

type Sprint = {
  id: string;
  title: string;
};

type ProjectMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

type EditTaskDialogProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: EditTaskDialogProps) {
  const { projectId } = useProjectFromSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [estimatedHours, setEstimatedHours] = useState('');
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAcceptanceCriteria(task.acceptanceCriteria || '');
      setStatus(task.status);
      setEstimatedHours(task.estimatedHours?.toString() || '');
      setSprintId(task.sprintId);
      setAssigneeId(task.assigneeId);
      setTitleError(null);
    }
  }, [task, open]);

  useEffect(() => {
    if (open && projectId) {
      fetchSprintsAndMembers();
    }
  }, [open, projectId]);

  const fetchSprintsAndMembers = async () => {
    if (!projectId) return;

    setLoadingData(true);
    try {
      const [sprintsRes, membersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/sprints`, { credentials: 'include' }),
        fetch(`/api/projects/${projectId}/members`, { credentials: 'include' }),
      ]);

      if (sprintsRes.ok) {
        const sprintsData = await sprintsRes.json();
        setSprints(sprintsData);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleClose = () => {
    if (!loading) onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task || !projectId) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required');
      return;
    }
    setTitleError(null);

    const hoursValue = estimatedHours.trim() ? parseFloat(estimatedHours) : null;
    if (hoursValue !== null && (isNaN(hoursValue) || hoursValue < 0)) {
      toast.error('Estimated hours must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          acceptanceCriteria: acceptanceCriteria.trim() || null,
          status,
          estimatedHours: hoursValue,
          sprintId: sprintId || null,
          assigneeId: assigneeId || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error ?? 'Failed to update task.';
        toast.error(message);
        if (data?.field === 'title') setTitleError(data.message ?? message);
        return;
      }

      toast.success('Task updated successfully');
      handleClose();
      onSuccess?.();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="edit-task-title">Title *</Label>
              <Input
                id="edit-task-title"
                name="title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'edit-task-title-error' : undefined}
              />
              <FieldError id="edit-task-title-error">{titleError}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="edit-task-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger id="edit-task-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                name="description"
                placeholder="Describe the task"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>

            <Field>
              <Label htmlFor="edit-task-acceptance">Acceptance Criteria</Label>
              <Textarea
                id="edit-task-acceptance"
                name="acceptanceCriteria"
                placeholder="Define what 'done' means for this task"
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                rows={3}
              />
            </Field>

            <Field>
              <Label htmlFor="edit-task-hours">Estimated Hours</Label>
              <Input
                id="edit-task-hours"
                name="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g., 4.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </Field>

            <Field>
              <Label htmlFor="edit-task-sprint">Sprint</Label>
              <Select value={sprintId || "backlog"} onValueChange={(value) => setSprintId(value === "backlog" ? null : value)}>
                <SelectTrigger id="edit-task-sprint">
                  <SelectValue placeholder={loadingData ? "Loading..." : "Select sprint"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog (No Sprint)</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="edit-task-assignee">Assignee</Label>
              <Select value={assigneeId || "unassigned"} onValueChange={(value) => setAssigneeId(value === "unassigned" ? null : value)}>
                <SelectTrigger id="edit-task-assignee">
                  <SelectValue placeholder={loadingData ? "Loading..." : "Select assignee"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter className="flex justify-end mt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer hover:text-white transition-all duration-200 ease-in-out" disabled={loading}>
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
