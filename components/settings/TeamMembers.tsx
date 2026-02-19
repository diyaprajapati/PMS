'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import AddMember from './AddMember'
import EditRoleDialog from './EditRoleDialog'
import DeleteMemberDialog from './DeleteMemberDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { toast } from 'sonner'

export type TeamMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'CLIENT';
  createdAt: string | null;
  updatedAt: string | null;
};

type TeamMembersProps = {
  projectId: string | null;
};

export default function TeamMembers({ projectId }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchMembers = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please log in to view team members.');
          return;
        }
        const data = await res.json();
        toast.error(data.error || 'Failed to load team members');
        return;
      }

      const data = await res.json();
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const handleEditClick = (member: TeamMember) => {
    setEditingMember(member);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setDeleteMember(member);
    setDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      case 'DEVELOPER':
        return 'outline';
      case 'CLIENT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
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

  if (!projectId) {
    return (
      <div className='flex justify-center'>
        <Card className='flex flex-col p-4 md:w-[80%] w-full gap-4 border-none'>
          <Label className='text-xl font-semibold'>Team Members</Label>
          <p className='text-sm text-muted-foreground'>Please select a project to view team members.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex justify-center'>
      <Card className='flex flex-col p-4 md:w-[80%] w-full gap-4 border-none'>
        <div className='flex justify-between items-center'>
          <div>
            <Label className='text-xl font-semibold'>Team Members</Label>
            <span className='text-sm text-muted-foreground'>Manage your project team members</span>
          </div>
          <AddMember projectId={projectId} onMemberAdded={fetchMembers} />
        </div>

        {loading ? (
          <Card className='border bg-transparent p-4'>
            <div className='flex items-center justify-center py-8'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
            </div>
          </Card>
        ) : members.length === 0 ? (
          <Card className='border bg-transparent p-4'>
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <p className='text-sm text-muted-foreground'>No team members yet.</p>
              <p className='text-xs text-muted-foreground mt-1'>Add members to collaborate on this project.</p>
            </div>
          </Card>
        ) : (
          <Card className='border-none bg-transparent p-0 py-4'>
            <CardContent className='flex flex-col gap-4'>
              {members.map((member) => (
                <div key={member.id} className='flex border items-center justify-between gap-3 px-3 py-4 rounded-xl hover:bg-muted/50 transition-colors'>
                  <div className='flex items-center gap-3 flex-1'>
                    <Avatar className='size-10'>
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback>{getInitials(member.name, member.email)}</AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col flex-1'>
                      <div className='flex items-center gap-2'>
                        <Label className='text-md font-semibold'>
                          {member.name || member.email.split('@')[0]}
                        </Label>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleDisplayName(member.role)}
                        </Badge>
                      </div>
                      <span className='text-sm text-muted-foreground'>{member.email}</span>
                    </div>
                  </div>

                  {member.role !== 'OWNER' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className='h-8 w-8 cursor-pointer'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditClick(member)}
                          className='cursor-pointer'
                        >
                          <Pencil className='mr-2 h-4 w-4' />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(member)}
                          className='cursor-pointer text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Edit Role Dialog */}
        <EditRoleDialog
          member={editingMember}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setEditingMember(null);
            }
          }}
          projectId={projectId || ''}
          onRoleUpdated={fetchMembers}
        />

        {/* Delete Member Dialog */}
        <DeleteMemberDialog
          member={deleteMember}
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setDeleteMember(null);
            }
          }}
          projectId={projectId || ''}
          onMemberDeleted={fetchMembers}
        />
      </Card>
    </div>
  );
}
