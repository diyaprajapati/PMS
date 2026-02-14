'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type AddProjectDialogProps = {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
};

export function AddProjectDialog({ onSuccess, trigger }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setNameError(null);
    setDescriptionError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = validateName(name);
    const dErr = validateDescription(description);
    setNameError(nErr);
    setDescriptionError(dErr);
    if (nErr || dErr) return;

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error ?? data?.message ?? 'Failed to create project.';
        toast.error(message);
        if (data?.field === 'name') setNameError(data.message ?? message);
        return;
      }

      toast.success('Project created.');
      handleOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" className="cursor-pointer">
            Create Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="add-project-name">Name</Label>
              <Input
                id="add-project-name"
                name="name"
                placeholder="Project name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(validateName(e.target.value));
                }}
                onBlur={() => setNameError(validateName(name) ?? null)}
                maxLength={NAME_MAX_LENGTH + 50}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'add-project-name-error' : undefined}
              />
              <FieldError id="add-project-name-error">{nameError}</FieldError>
            </Field>
            <Field>
              <Label htmlFor="add-project-description">Description (optional)</Label>
              <Input
                id="add-project-description"
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
                aria-describedby={descriptionError ? 'add-project-desc-error' : undefined}
              />
              <FieldError id="add-project-desc-error">{descriptionError}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter className='flex justify-end mt-4'>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="cursor-pointer" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
