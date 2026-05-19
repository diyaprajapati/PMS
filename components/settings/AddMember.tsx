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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { useAddMemberMutation } from '@/queries/members.queries'

type AddMemberProps = {
  projectId: string;
};

export default function AddMember({ projectId }: AddMemberProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'DEVELOPER' | 'CLIENT'>('CLIENT');

  const mutation = useAddMemberMutation(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    mutation.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${email}`);
          setEmail('');
          setRole('CLIENT');
          setOpen(false);
        },
        onError: (error) => {
          console.error('Error adding member:', error);
          toast.error('Failed to add member');
        },
      }
    );
  };

  const loading = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='cursor-pointer transition-all duration-200 ease-in-out'>
          <UserPlus className='mr-2 h-4 w-4' />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Add a new member to your project. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className='mt-4'>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'ADMIN' | 'DEVELOPER' | 'CLIENT')}>
                <SelectTrigger id="role" disabled={loading}>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DEVELOPER">Developer</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Invite Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
