'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Project } from './EditProjectDialog';

type DeleteProjectDialogProps = {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (project: Project) => void;
  deleting?: boolean;
};

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
  deleting = false,
}: DeleteProjectDialogProps) {
  const [confirmValue, setConfirmValue] = useState('');

  useEffect(() => {
    if (open) setConfirmValue('');
  }, [open, project?.id]);

  if (!project) return null;

  const nameMatches = confirmValue.trim() === project.name;
  const canDelete = nameMatches && !deleting;

  const handleConfirm = () => {
    if (!canDelete) return;
    onConfirm(project);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="delete-confirm-name" className="text-sm font-medium">
            Type <span className="font-mono font-semibold text-foreground">&quot;{project.name}&quot;</span> to confirm
          </Label>
          <Input
            id="delete-confirm-name"
            type="text"
            placeholder="Enter project name"
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
