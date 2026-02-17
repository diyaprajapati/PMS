'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { AlertTriangle } from 'lucide-react'
import type { TeamMember } from './TeamMembers'

type DeleteMemberDialogProps = {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onMemberDeleted?: () => void;
};

export default function DeleteMemberDialog({
  member,
  open,
  onOpenChange,
  projectId,
  onMemberDeleted,
}: DeleteMemberDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!member || !projectId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${member.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove member');
        return;
      }

      toast.success(`${member.email} has been removed from the project`);
      onOpenChange(false);
      onMemberDeleted?.(); // Refresh the members list
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Team Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member from the project? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-4 px-1 border rounded-lg bg-muted/50">
          <Avatar className='size-12'>
            <AvatarImage src={member.image || undefined} />
            <AvatarFallback>{getInitials(member.name, member.email)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-md font-semibold'>
              {member.name || member.email.split('@')[0]}
            </span>
            <span className='text-sm text-muted-foreground'>{member.email}</span>
            {member.role && (
              <span className='text-xs text-muted-foreground mt-1'>
                Current role: {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">
            <strong>Warning:</strong> This member will lose access to the project and all associated resources.
          </p>
        </div>

        <DialogFooter className='flex justify-end mt-4'>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className='cursor-pointer transition-all duration-200 ease-in-out'
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className='cursor-pointer transition-all duration-200 ease-in-out'
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
