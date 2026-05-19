'use client';

import { useState } from 'react';
import { Button } from '../ui/button'
import { Pencil, Trash2, MoreVertical, Users, Shield, Code, User } from 'lucide-react'
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
import { useMembersQuery } from '@/queries/members.queries'
import type { ProjectMember } from '@/services/members.service'

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
  const { data: members, isLoading: loading } = useMembersQuery(projectId);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      <div className='flex flex-col gap-6 h-full w-full'>
        <div className='flex items-center justify-between pb-4 border-b'>
          <div>
            <h2 className='text-2xl font-semibold'>Team Members</h2>
            <p className='text-sm text-muted-foreground'>Please select a project to view team members.</p>
          </div>
        </div>
      </div>
    );
  }

  const memberList = (members ?? []) as TeamMember[];

  const roleStats = memberList.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className='flex flex-col gap-6 h-full w-full'>
      {/* Header */}
      <div className='flex items-center justify-between pb-4 border-b'>
        <div>
          <h2 className='text-2xl font-semibold'>Team Members</h2>
          <p className='text-sm text-muted-foreground'>Manage your project team members</p>
        </div>
        <AddMember projectId={projectId} />
      </div>

      {/* Stats */}
      {!loading && memberList.length > 0 && (
        <div className='grid md:grid-cols-4 grid-cols-2 gap-4'>
          <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
            <div className='flex items-center gap-2'>
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Members</span>
            </div>
            <div className="text-3xl font-bold">{memberList.length}</div>
          </div>

          <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
            <div className='flex items-center gap-2'>
              <Shield className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <div className="text-3xl font-bold">{(roleStats['OWNER'] || 0) + (roleStats['ADMIN'] || 0)}</div>
          </div>

          <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
            <div className='flex items-center gap-2'>
              <Code className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Developers</span>
            </div>
            <div className="text-3xl font-bold">{roleStats['DEVELOPER'] || 0}</div>
          </div>

          <div className='flex flex-col gap-2 p-4 rounded-lg border bg-background/60'>
            <div className='flex items-center gap-2'>
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clients</span>
            </div>
            <div className="text-3xl font-bold">{roleStats['CLIENT'] || 0}</div>
          </div>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        </div>
      ) : memberList.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background/60'>
          <p className='text-sm text-muted-foreground'>No team members yet.</p>
          <p className='text-xs text-muted-foreground mt-1'>Add members to collaborate on this project.</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {memberList.map((member) => (
            <div key={member.id} className='flex border items-center justify-between gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors'>
              <div className='flex items-center gap-3 flex-1'>
                <Avatar className='size-10'>
                  <AvatarImage src={member.image || undefined} />
                  <AvatarFallback>{getInitials(member.name, member.email)}</AvatarFallback>
                </Avatar>
                <div className='flex flex-col flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold'>
                      {member.name || member.email.split('@')[0]}
                    </span>
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
        </div>
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
      />
    </div>
  );
}
