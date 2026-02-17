'use client';

import { useState, useEffect } from 'react';
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
import { Field, FieldGroup } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import type { TeamMember } from './TeamMembers'

type EditRoleDialogProps = {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onRoleUpdated?: () => void;
};

export default function EditRoleDialog({
  member,
  open,
  onOpenChange,
  projectId,
  onRoleUpdated,
}: EditRoleDialogProps) {
  const [role, setRole] = useState<'ADMIN' | 'DEVELOPER' | 'CLIENT'>('CLIENT');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role === 'OWNER' ? 'ADMIN' : member.role);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member || !projectId) return;

    // Don't allow changing if already this role
    if (member.role === role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update member role');
        return;
      }

      toast.success(`Member role updated to ${role.charAt(0) + role.slice(1).toLowerCase()}`);
      onOpenChange(false);
      onRoleUpdated?.(); // Refresh the members list
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for this team member.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 py-4 px-1">
            <Avatar className='size-12'>
              <AvatarImage src={member.image || undefined} />
              <AvatarFallback>{getInitials(member.name, member.email)}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <Label className='text-md font-semibold'>
                {member.name || member.email.split('@')[0]}
              </Label>
              <span className='text-sm text-muted-foreground'>{member.email}</span>
            </div>
          </div>

          <FieldGroup className='mt-2'>
            <Field>
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as 'ADMIN' | 'DEVELOPER' | 'CLIENT')}
              >
                <SelectTrigger id="role" disabled={loading}>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DEVELOPER">Developer</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>
              {/* <p className="text-xs text-muted-foreground mt-1">
                Admins can manage team members. Developers can access project resources. Clients have view-only access.
              </p> */}
            </Field>
          </FieldGroup>

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
              type="submit"
              className='cursor-pointer transition-all duration-200 ease-in-out'
              disabled={loading || member.role === role}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
