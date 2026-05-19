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
import { SprintStatusBadge } from './SprintStatusBadge';
import { useSprintsQuery, useDeleteSprintMutation } from '@/queries/sprints.queries';

const tableHeaderRowClass = "bg-muted hover:bg-muted font-semibold";

export function SprintTable({ onRefresh }: { onRefresh?: () => void }) {
  const { projectId } = useProjectFromSearchParams();
  const { data: sprints = [], isLoading: loading } = useSprintsQuery(projectId);
  const deleteSprintMutation = useDeleteSprintMutation(projectId);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [deleteSprint, setDeleteSprint] = useState<Sprint | null>(null);

  const handleEdit = (sprint: Sprint) => {
    setEditSprint(sprint);
  };

  const handleDeleteClick = (sprint: Sprint) => {
    setDeleteSprint(sprint);
  };

  const handleDeleteConfirm = async (sprint: Sprint) => {
    try {
      await deleteSprintMutation.mutateAsync(sprint.id);
      toast.success('Sprint deleted successfully');
      setDeleteSprint(null);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete sprint');
    }
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
            <TableCell colSpan={5} className="text-center text-muted-foreground">
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
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
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
          onOpenChange={(open) => {
            if (!open) setEditSprint(null);
          }}
        />
        <DeleteSprintDialog
          sprint={deleteSprint}
          open={!!deleteSprint}
          onOpenChange={(open) => !open && setDeleteSprint(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleteSprintMutation.isPending}
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
            <TableHead>Status</TableHead>
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
                <SprintStatusBadge status={sprint.status} />
              </TableCell>
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
        onOpenChange={(open) => {
          if (!open) setEditSprint(null);
        }}
      />

      <DeleteSprintDialog
        sprint={deleteSprint}
        open={!!deleteSprint}
        onOpenChange={(open) => {
          if (!open) setDeleteSprint(null);
        }}
        onConfirm={handleDeleteConfirm}
        deleting={deleteSprintMutation.isPending}
      />
    </>
  );
}
