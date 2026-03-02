'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { getSprints, createSprint, type Sprint } from '@/services/sprints.service';
import { ApiError } from '@/services/http-client';

export function AddSprintDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { projectId } = useProjectFromSearchParams();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transferUnfinishedTasks, setTransferUnfinishedTasks] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);

  const resetForm = () => {
    setTitle('');
    setStartDate(undefined);
    setEndDate(undefined);
    setTitleError(null);
    setTransferUnfinishedTasks(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    setOpen(next);
  };

  // Fetch sprints when dialog opens
  useEffect(() => {
    if (open && projectId) {
      setLoadingSprints(true);
      getSprints(projectId)
        .then((data) => setSprints(data))
        .catch(() => setSprints([]))
        .finally(() => setLoadingSprints(false));
    }
  }, [open, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    setLoading(true);
    try {
      await createSprint(projectId, {
        title: trimmedTitle,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        transferUnfinishedTasks,
      });

      toast.success('Sprint created successfully');
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className='cursor-pointer transition-all duration-200 ease-in-out'>
          <Plus />
          Create Sprint
        </Button>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Add Sprint</DialogTitle>
          <DialogDescription>
            Add a new sprint to your project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Enter the title of the sprint"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
              />
              <FieldError id="title-error">{titleError}</FieldError>
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
            {!loadingSprints && sprints.length > 0 && (
              <Field>
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="transferUnfinishedTasks"
                    checked={transferUnfinishedTasks}
                    onCheckedChange={(checked) => setTransferUnfinishedTasks(checked as boolean)}
                  />
                  <Label
                    htmlFor="transferUnfinishedTasks"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Transfer unfinished tasks (To Do / In Progress) from previous sprints
                  </Label>
                </div>
              </Field>
            )}
          </FieldGroup>
          <DialogFooter className='flex justify-end mt-4'>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" className='cursor-pointer hover:text-white transition-all duration-200 ease-in-out' disabled={loading}>
              {loading ? 'Creating...' : 'Add Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
