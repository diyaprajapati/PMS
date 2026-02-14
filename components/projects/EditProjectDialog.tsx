'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const NAME_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 1000;

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length > NAME_MAX_LENGTH) return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  return null;
}

function validateDescription(description: string): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length > DESCRIPTION_MAX_LENGTH) return `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`;
  return null;
}

export type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type EditProjectDialogProps = {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setNameError(null);
      setDescriptionError(null);
    }
  }, [project, open]);

  const handleClose = () => {
    if (!loading) onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const nErr = validateName(name);
    const dErr = validateDescription(description);
    setNameError(nErr);
    setDescriptionError(dErr);
    if (nErr || dErr) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error ?? data?.message ?? 'Failed to update project.';
        toast.error(message);
        if (data?.field === 'name') setNameError(data.message ?? message);
        return;
      }

      toast.success('Project updated.');
      handleClose();
      onSuccess?.();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project name and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="edit-project-name">Name</Label>
              <Input
                id="edit-project-name"
                name="name"
                placeholder="Project name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(validateName(e.target.value) ?? null);
                }}
                onBlur={() => setNameError(validateName(name) ?? null)}
                maxLength={NAME_MAX_LENGTH + 50}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'edit-project-name-error' : undefined}
              />
              <FieldError id="edit-project-name-error">{nameError}</FieldError>
            </Field>
            <Field>
              <Label htmlFor="edit-project-description">Description (optional)</Label>
              <Input
                id="edit-project-description"
                name="description"
                placeholder="Short description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError) setDescriptionError(validateDescription(e.target.value) ?? null);
                }}
                onBlur={() => setDescriptionError(validateDescription(description) ?? null)}
                maxLength={DESCRIPTION_MAX_LENGTH + 50}
                aria-invalid={!!descriptionError}
                aria-describedby={descriptionError ? 'edit-project-desc-error' : undefined}
              />
              <FieldError id="edit-project-desc-error">{descriptionError}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter className='flex justify-end mt-4'>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="cursor-pointer" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
