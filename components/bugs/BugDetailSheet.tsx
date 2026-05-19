"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MentionsInput, Mention } from "react-mentions";
import { UserRound } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<BugStatus, { label: string; dot: string; text: string }> = {
  NOT_STARTED: { label: "Not Started", dot: "bg-slate-400", text: "text-slate-500 dark:text-slate-400" },
  IN_PROGRESS: { label: "In Progress", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  IN_REVIEW: { label: "In Review", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  FIXED: { label: "Fixed", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  CLOSED: { label: "Closed", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
};

function statusConfig(s: BugStatus) {
  return STATUS_CONFIG[s];
}

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  P0: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700",
  P1: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700",
  P2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700",
  P3: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
  P4: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600",
  P5: "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700",
};

// ---------------------------------------------------------------------------
// Inline title editing – double-click to edit, blur/Enter to save
// ---------------------------------------------------------------------------

function TitleField({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => {
      ref.current?.focus();
      ref.current?.select();
    }, 0);
  };

  const commit = () => {
    const t = draft.trim();
    if (t && t !== value) onSave(t);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") setEditing(false);
        }}
        className="flex-1 min-w-0 bg-transparent outline-none text-xl font-display border-b border-dashed border-border/60 pb-0.5"
      />
    );
  }

  return (
    <span
      className="block text-xl font-display cursor-text select-none"
      onDoubleClick={startEdit}
      title="Double-click to edit"
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inline description editing – click to edit, blur to save
// ---------------------------------------------------------------------------

function DescriptionField({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const startEdit = () => {
    setDraft(value || "");
    setEditing(true);
    setTimeout(() => {
      ref.current?.focus();
    }, 0);
  };

  const commit = () => {
    const t = draft.trim();
    onSave(t || null);
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        rows={4}
        className="w-full bg-transparent outline-none text-sm leading-relaxed text-foreground/90 bg-muted/30 rounded-lg p-3 border border-border/40 resize-none"
        placeholder="Add a description..."
      />
    );
  }

  return (
    <p
      className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 bg-muted/30 rounded-lg p-3 border border-border/40 cursor-text min-h-[3rem]"
      onClick={startEdit}
      title="Click to edit"
    >
      {value || "No description provided."}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Status pill – popover picker
// ---------------------------------------------------------------------------

function StatusPill({
  status,
  onUpdate,
}: {
  status: BugStatus;
  onUpdate: (s: BugStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig(status);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium hover:bg-accent/50 transition-colors cursor-pointer">
          <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot)} />
          <span className={cfg.text}>{cfg.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 w-40">
        {BUG_STATUS_OPTIONS.map((o) => {
          const c = statusConfig(o.value);
          return (
            <button
              key={o.value}
              onClick={() => {
                onUpdate(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
                status === o.value && "bg-accent"
              )}
            >
              <span className={cn("size-1.5 rounded-full shrink-0", c.dot)} />
              <span className={c.text}>{o.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Priority pill – popover picker
// ---------------------------------------------------------------------------

function PriorityPill({
  priority,
  onUpdate,
}: {
  priority: TaskPriority;
  onUpdate: (p: TaskPriority) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer",
            PRIORITY_STYLES[priority]
          )}
        >
          <span className="font-semibold">{priority}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-1 w-44">
        {BUG_PRIORITY_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              onUpdate(o.value);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
              priority === o.value && "bg-accent"
            )}
          >
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                PRIORITY_STYLES[o.value]
              )}
            >
              {o.value}
            </span>
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Assignee picker – popover with avatars
// ---------------------------------------------------------------------------

function AssigneePicker({
  assignee,
  members,
  onUpdate,
}: {
  assignee: { id: string; user: { name: string | null; email: string; image: string | null } } | null;
  members: { id: string; name: string | null; email: string; image: string | null }[];
  onUpdate: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const user = assignee?.user;
  const name = user?.name || user?.email;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={name ?? "Assign member"}
          className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
        >
          {user ? (
            <Avatar size="sm">
              {user.image && <AvatarImage src={user.image} />}
              <AvatarFallback className="text-[10px]">
                {initials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center hover:border-muted-foreground/40 transition-colors">
              <UserRound className="size-3 text-muted-foreground/30" />
            </div>
          )}
          {user && (
            <span className="text-xs text-muted-foreground/80 truncate max-w-[120px]">
              {user.name || user.email}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-1 w-52">
        <button
          onClick={() => {
            onUpdate(null);
            setOpen(false);
          }}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
            !assignee && "bg-accent"
          )}
        >
          <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserRound className="size-3 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">Unassigned</span>
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              onUpdate(m.id);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-accent transition-colors text-left cursor-pointer",
              assignee?.id === m.id && "bg-accent"
            )}
          >
            <Avatar size="sm">
              {m.image && <AvatarImage src={m.image} />}
              <AvatarFallback className="text-[10px]">{initials(m.name, m.email)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{m.name || m.email}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Main sheet
// ---------------------------------------------------------------------------

export function BugDetailSheet({ bugId, open, onOpenChange }: BugDetailSheetProps) {
  const { projectId } = useProjectFromSearchParams();
  const [comment, setComment] = useState("");

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
          <SheetTitle className="text-xl font-display">
            {bug ? (
              <TitleField value={bug.title} onSave={(title) => patchBug({ title })} />
            ) : (
              "Bug details"
            )}
          </SheetTitle>
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
              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">
                  Description
                </Label>
                <DescriptionField
                  value={bug.description}
                  onSave={(description) => patchBug({ description })}
                />
              </div>

              {/* Status | Priority | Assignee */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">
                    Status
                  </Label>
                  <div className="flex items-center h-9">
                    <StatusPill status={bug.status} onUpdate={(status) => patchBug({ status })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">
                    Priority
                  </Label>
                  <div className="flex items-center h-9">
                    <PriorityPill
                      priority={bug.priority}
                      onUpdate={(priority) => patchBug({ priority })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">
                    Assignee
                  </Label>
                  <div className="flex items-center h-9">
                    <AssigneePicker
                      assignee={bug.assignee ?? null}
                      members={members}
                      onUpdate={(assigneeId) => patchBug({ assigneeId })}
                    />
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <Label className="text-xs uppercase tracking-wide font-medium text-muted-foreground/70">
                  Comments
                </Label>
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
                        padding: "12px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: "0.65rem",
                        backgroundColor: "var(--background)",
                        color: "var(--foreground)",
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        lineHeight: 1.6,
                        minHeight: 100,
                        outline: "none",
                      },
                      highlighter: {
                        padding: "12px 14px",
                        border: "1px solid transparent",
                        borderRadius: "0.65rem",
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        lineHeight: 1.6,
                      },
                      suggestions: {
                        list: {
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "0.65rem",
                          fontSize: 14,
                          maxHeight: 240,
                          overflow: "auto",
                          boxShadow:
                            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        },
                        item: {
                          padding: "10px 12px",
                          borderRadius: "0.5rem",
                          backgroundColor: "var(--popover)",
                          color: "var(--popover-foreground)",
                          cursor: "pointer",
                          "&focused": {
                            backgroundColor: "var(--accent)",
                            color: "var(--accent-foreground)",
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
                        backgroundColor: "color-mix(in oklch, var(--primary) 10%, transparent)",
                        border: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)",
                        borderRadius: "9999px",
                        padding: "2px 8px",
                        color: "var(--primary)",
                        fontSize: "0.75rem",
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
                      <div
                        key={item.id}
                        className="rounded-xl border border-border/60 bg-background/40 p-4 transition-all hover:border-border/80 hover:bg-background/60"
                      >
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
