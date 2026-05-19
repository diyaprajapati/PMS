"use client";

import { type ReactNode, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MentionsInput, Mention } from "react-mentions";
import { useProjectFromSearchParams } from "@/hooks/use-project-from-search-params";
import {
  useBugDetailQuery,
  useCreateBugCommentMutation,
  useProjectMembersQuery,
  useUpdateBugMutation,
} from "@/queries/bugs.queries";
import { BUG_PRIORITY_OPTIONS, BUG_STATUS_OPTIONS, type BugStatus } from "@/types/bug";
import type { TaskPriority } from "@/types/task";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

type BugDetailSheetProps = {
  bugId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function initials(name: string | null | undefined, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return email.slice(0, 2).toUpperCase();
}

function renderCommentText(content: string) {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    nodes.push(
      <span
        key={`${match[2]}-${match.index}`}
        className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20"
      >
        @{match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

export function BugDetailSheet({ bugId, open, onOpenChange }: BugDetailSheetProps) {
  const { projectId } = useProjectFromSearchParams();
  const [comment, setComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");

  const { data: bug, isLoading } = useBugDetailQuery(projectId, bugId);
  const { data: members = [] } = useProjectMembersQuery(projectId);
  const updateMutation = useUpdateBugMutation(projectId);
  const commentMutation = useCreateBugCommentMutation(projectId, bugId);

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      await commentMutation.mutateAsync(comment);
      setComment("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    }
  };

  const patchBug = async (patch: {
    status?: BugStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    title?: string;
    description?: string | null;
  }) => {
    try {
      if (!bugId) return;
      await updateMutation.mutateAsync({ bugId, payload: patch });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update bug");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            {isEditingTitle ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-display h-auto py-2"
                  disabled={updateMutation.isPending}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await patchBug({ title: editTitle });
                      setIsEditingTitle(false);
                    }}
                    disabled={updateMutation.isPending || !editTitle.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditTitle(bug?.title ?? "");
                    }}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <SheetTitle className="text-xl font-display">{bug ? bug.title : "Bug details"}</SheetTitle>
                {bug && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    onClick={() => {
                      setEditTitle(bug.title);
                      setIsEditingTitle(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
              </>
            )}
          </div>
          <SheetDescription className="text-xs font-medium font-mono text-muted-foreground/80">
            {bug ? `BUG-${bug.bugNumber}` : "Loading bug details"}
          </SheetDescription>
        </SheetHeader>
        {isLoading || !bug ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading bug details...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">Description</Label>
                  {!isEditingDescription && bug && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => {
                        setEditDescription(bug.description || "");
                        setIsEditingDescription(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      disabled={updateMutation.isPending}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          await patchBug({ description: editDescription.trim() || null });
                          setIsEditingDescription(false);
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingDescription(false);
                          setEditDescription(bug.description || "");
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 bg-muted/30 rounded-lg p-3 border border-border/40">
                    {bug.description || "No description provided."}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">Status</Label>
                  <Select
                    value={bug.status}
                    onValueChange={(value) => patchBug({ status: value as BugStatus })}
                  >
                    <SelectTrigger className="w-full h-9 bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUG_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">Priority</Label>
                  <Select
                    value={bug.priority}
                    onValueChange={(value) => patchBug({ priority: value as TaskPriority })}
                  >
                    <SelectTrigger className="w-full h-9 bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUG_PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.value} - {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">Assignee</Label>
                  <Select
                    value={bug.assigneeId ?? "unassigned"}
                    onValueChange={(value) =>
                      patchBug({ assigneeId: value === "unassigned" ? null : value })
                    }
                  >
                    <SelectTrigger className="w-full h-9 bg-background/60">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 border-t border-border/50 pt-6">
                <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">Comments</Label>
                <div className="space-y-3">
                  <MentionsInput
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment... Type @ to mention teammates"
                    disabled={commentMutation.isPending}
                    a11ySuggestionsListLabel="Suggested team members"
                    singleLine={false}
                    customSuggestionsContainer={(children) => (
                      <div className="mentions-suggestions-wrapper">{children}</div>
                    )}
                    style={{
                      control: {
                        fontSize: 14,
                        lineHeight: 1.6,
                        minHeight: 100,
                      },
                      input: {
                        padding: '12px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: '0.65rem',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        minHeight: 100,
                        outline: 'none',
                      },
                      highlighter: {
                        padding: '12px 14px',
                        border: '1px solid transparent',
                        borderRadius: '0.65rem',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        lineHeight: 1.6,
                      },
                      suggestions: {
                        list: {
                          backgroundColor: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.65rem',
                          fontSize: 14,
                          maxHeight: 240,
                          overflow: 'auto',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        },
                        item: {
                          padding: '10px 12px',
                          borderRadius: '0.5rem',
                          backgroundColor: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          cursor: 'pointer',
                          '&focused': {
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-foreground)',
                          },
                        },
                      },
                    }}
                  >
                    <Mention
                      trigger="@"
                      data={members.map((m) => ({
                        id: m.userId,
                        display: m.name || m.email,
                      }))}
                      markup="@[__display__](__id__)"
                      displayTransform={(_id, display) => `@${display}`}
                      style={{
                        backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                        border: '1px solid color-mix(in oklch, var(--primary) 20%, transparent)',
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    />
                  </MentionsInput>
                  <div className="flex justify-end">
                    <Button
                      onClick={submitComment}
                      disabled={commentMutation.isPending || !comment.trim()}
                      className="transition-all"
                    >
                      {commentMutation.isPending ? "Posting..." : "Post comment"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {(bug.comments ?? []).length === 0 ? (
                    <div className="text-center py-8 rounded-lg bg-muted/20 border border-dashed border-border/60">
                      <p className="text-sm text-muted-foreground">No comments yet.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Be the first to comment!</p>
                    </div>
                  ) : (
                    bug.comments?.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/60 bg-background/40 p-4 transition-all hover:border-border/80 hover:bg-background/60">
                        <div className="mb-3 flex items-center gap-3">
                          <Avatar size="sm">
                            {item.author.image && <AvatarImage src={item.author.image} />}
                            <AvatarFallback className="text-[10px] font-medium">
                              {initials(item.author.name, item.author.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.author.name || item.author.email}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {renderCommentText(item.content)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
