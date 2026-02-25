'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Task } from '@/types/task';

type DeleteTaskDialogProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (task: Task) => void | Promise<void>;
  deleting?: boolean;
};

export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
  deleting = false,
}: DeleteTaskDialogProps) {
  const [confirmValue, setConfirmValue] = useState('');

  useEffect(() => {
    if (open) setConfirmValue('');
  }, [open, task?.id]);

  if (!task) return null;

  const nameMatches = confirmValue.trim() === task.title;
  const canDelete = nameMatches && !deleting;

  const handleConfirm = async () => {
    if (!canDelete) return;
    await onConfirm(task);
  };

  const hasSubtasks = task._count && task._count.subtasks > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{task.title}&quot;?
            {hasSubtasks && (
              <span className="block mt-2 text-destructive font-medium">
                Warning: This task has {task._count?.subtasks} subtask{task._count?.subtasks === 1 ? '' : 's'} that will also be deleted.
              </span>
            )}
            <span className="block mt-2">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="delete-confirm-title" className="text-sm font-medium">
            Type <span className="font-mono font-semibold text-foreground">&quot;{task.title}&quot;</span> to confirm
          </Label>
          <Input
            id="delete-confirm-title"
            type="text"
            placeholder="Enter task title"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            className="font-mono"
            aria-invalid={confirmValue.length > 0 && !nameMatches}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting} className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!canDelete}
            className="cursor-pointer"
            onClick={handleConfirm}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
