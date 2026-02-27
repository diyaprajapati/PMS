"use client";

import { useState } from "react";
import { BugIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import { useCreateBugMutation } from "@/queries/bugs.queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AddBugDialogProps = {
  onSuccess?: () => void;
};

export function AddBugDialog({ onSuccess }: AddBugDialogProps) {
  const { projectId } = useProjectFromSearchParams();
  const createBugMutation = useCreateBugMutation(projectId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setTitle("");
    setDescription("");
    setTitleError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Title is required");
      return;
    }

    setTitleError(null);
    setLoading(true);
    try {
      await createBugMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || null,
      });

      toast.success("Bug created. Team participants were notified by email.");
      handleClose();
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create bug";
      setTitleError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="size-4" />
          Add Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BugIcon className="size-4" />
            Add Bug
          </DialogTitle>
          <DialogDescription>
            Report a new bug with a title and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="bug-title">Title *</Label>
              <Input
                id="bug-title"
                name="title"
                placeholder="Short bug summary"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (titleError) setTitleError(null);
                }}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? "bug-title-error" : undefined}
              />
              <FieldError id="bug-title-error">{titleError}</FieldError>
            </Field>

            <Field>
              <Label htmlFor="bug-description">Description</Label>
              <Textarea
                id="bug-description"
                name="description"
                rows={4}
                placeholder="What is happening, expected behavior, and steps to reproduce"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Bug"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
