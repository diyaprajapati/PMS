'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';

type Sprint = {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
};

type EditSprintDialogProps = {
  sprint: Sprint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EditSprintDialog({
  sprint,
  open,
  onOpenChange,
  onSuccess,
}: EditSprintDialogProps) {
  const { projectId } = useProjectFromSearchParams();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sprint) {
      setTitle(sprint.title);
      setStartDate(sprint.startDate ? new Date(sprint.startDate) : undefined);
      setEndDate(sprint.endDate ? new Date(sprint.endDate) : undefined);
      setTitleError(null);
    }
  }, [sprint, open]);

  const handleClose = () => {
    if (!loading) onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sprint || !projectId) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required');
      return;
    }
    setTitleError(null);

    if (startDate && endDate && startDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: trimmedTitle,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error ?? 'Failed to update sprint.';
        toast.error(message);
        if (data?.field === 'title') setTitleError(data.message ?? message);
        return;
      }

      toast.success('Sprint updated successfully');
      handleClose();
      onSuccess?.();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!sprint) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sprint</DialogTitle>
          <DialogDescription>
            Update the sprint details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="edit-title">Title</Label>
              <Input 
                id="edit-title" 
                name="title" 
                placeholder="Enter the title of the sprint"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'edit-title-error' : undefined}
              />
              <FieldError id="edit-title-error">{titleError}</FieldError>
            </Field>
            <Field>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </FieldGroup>
          <DialogFooter className='flex justify-end mt-4'>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className='cursor-pointer hover:text-white transition-all duration-200 ease-in-out' disabled={loading}>
              {loading ? 'Updating...' : 'Update Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
