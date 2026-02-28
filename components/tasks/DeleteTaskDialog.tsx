'use client';
import { useEffect } from 'react';
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
  useEffect(() => {
  }, [open, task?.id]);
  
  if (!task) return null;
  
  const handleConfirm = async () => {
    if (deleting) return;
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
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting} className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting}
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