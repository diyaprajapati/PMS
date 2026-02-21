'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from 'sonner';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { EditSprintDialog } from './EditSprintDialog';
import { DeleteSprintDialog, type Sprint } from './DeleteSprintDialog';

const tableHeaderRowClass = "bg-muted hover:bg-muted font-semibold";

export function SprintTable({ onRefresh }: { onRefresh?: () => void }) {
  const { projectId } = useProjectFromSearchParams();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [deleteSprint, setDeleteSprint] = useState<Sprint | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSprints = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch sprints');
      }
      
      const data = await res.json();
      setSprints(data);
    } catch (err) {
      toast.error('Failed to load sprints');
      console.error('Error fetching sprints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprints();
  }, [projectId]);

  const handleEdit = (sprint: Sprint) => {
    setEditSprint(sprint);
  };

  const handleDeleteClick = (sprint: Sprint) => {
    setDeleteSprint(sprint);
  };

  const handleDeleteConfirm = async (sprint: Sprint) => {
    if (!projectId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to delete sprint');
      }

      toast.success('Sprint deleted successfully');
      setDeleteSprint(null);
      fetchSprints();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete sprint');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchSprints();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <Table>
        <TableHeader>
          <TableRow className={tableHeaderRowClass}>
            <TableHead>Title</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              Loading...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <>
        <div className="rounded-lg border overflow-hidden ">
        <Table>
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead>Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12">
                <div className='flex flex-col items-center justify-center gap-2'>
                  <p className='text-muted-foreground'>No sprints found</p>
                  <p className='text-sm text-muted-foreground'>Create your first sprint to get started</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </div>
        <EditSprintDialog
          sprint={editSprint}
          open={!!editSprint}
          onOpenChange={(open) => !open && setEditSprint(null)}
          onSuccess={handleEditSuccess}
        />
        <DeleteSprintDialog
          sprint={deleteSprint}
          open={!!deleteSprint}
          onOpenChange={(open) => !open && setDeleteSprint(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className={tableHeaderRowClass}>
            <TableHead>Title</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sprints.map((sprint) => (
            <TableRow key={sprint.id}>
              <TableCell className="font-medium">{sprint.title}</TableCell>
              <TableCell>
                {sprint.startDate ? format(new Date(sprint.startDate), 'MMM dd, yyyy') : '-'}
              </TableCell>
              <TableCell>
                {sprint.endDate ? format(new Date(sprint.endDate), 'MMM dd, yyyy') : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(sprint)}>
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      variant="destructive"
                      onClick={() => handleDeleteClick(sprint)}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <EditSprintDialog
        sprint={editSprint}
        open={!!editSprint}
        onOpenChange={(open) => !open && setEditSprint(null)}
        onSuccess={handleEditSuccess}
      />

      <DeleteSprintDialog
        sprint={deleteSprint}
        open={!!deleteSprint}
        onOpenChange={(open) => !open && setDeleteSprint(null)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </>
  );
}
