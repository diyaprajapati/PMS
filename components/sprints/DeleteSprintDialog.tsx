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

export type Sprint = {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type DeleteSprintDialogProps = {
  sprint: Sprint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sprint: Sprint) => void | Promise<void>;
  deleting?: boolean;
};

export function DeleteSprintDialog({
  sprint,
  open,
  onOpenChange,
  onConfirm,
  deleting = false,
}: DeleteSprintDialogProps) {
  const [confirmValue, setConfirmValue] = useState('');

  useEffect(() => {
    if (open) setConfirmValue('');
  }, [open, sprint?.id]);

  if (!sprint) return null;

  const nameMatches = confirmValue.trim() === sprint.title;
  const canDelete = nameMatches && !deleting;

  const handleConfirm = async () => {
    if (!canDelete) return;
    await onConfirm(sprint);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete sprint</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{sprint.title}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="delete-confirm-title" className="text-sm font-medium">
            Type <span className="font-mono font-semibold text-foreground">&quot;{sprint.title}&quot;</span> to confirm
          </Label>
          <Input
            id="delete-confirm-title"
            type="text"
            placeholder="Enter sprint title"
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
