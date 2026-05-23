"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MilkdownEditor } from "@/components/milkdown-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WikiPage } from "@/types/wiki";

type SaveStatus = "saved" | "saving" | "error";

type WikiEditorProps = {
  page: WikiPage | null | undefined;
  onSave: (pageId: string, payload: { title?: string; content?: string }) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
  isSaving: boolean;
};

function formatLastUpdated(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WikiEditor({ page, onSave, onDelete, isSaving }: WikiEditorProps) {
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSaveStatus("saved");
      lastSavedRef.current = JSON.stringify({ title: page.title, content: page.content });
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [page?.id]);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (!page) return;

      const currentTitle = titleRef.current;
      const currentState = JSON.stringify({ title: currentTitle });

      if (currentState === lastSavedRef.current) return;

      setSaveStatus("saving");

      onSave(page.id, { title: currentTitle })
        .then(() => {
          setSaveStatus("saved");
          lastSavedRef.current = currentState;
        })
        .catch((error) => {
          setSaveStatus("error");
          const message = error instanceof Error ? error.message : "Failed to save";
          toast.error(message);
        });
    }, 1000);
  }, [page, onSave]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    scheduleSave();
  };

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!page) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const currentTitle = titleRef.current;
        const currentState = JSON.stringify({ title: currentTitle, content: newContent });

        if (currentState === lastSavedRef.current) return;

        setSaveStatus("saving");

        onSave(page.id, {
          title: currentTitle,
          content: newContent,
        })
          .then(() => {
            setSaveStatus("saved");
            lastSavedRef.current = currentState;
          })
          .catch((error) => {
            setSaveStatus("error");
            const message = error instanceof Error ? error.message : "Failed to save";
            toast.error(message);
          });
      }, 1000);
    },
    [page, onSave]
  );

  const handleDeleteConfirm = async () => {
    if (!page) return;
    setDeleting(true);
    try {
      await onDelete(page.id);
      setDeleteOpen(false);
      toast.success("Wiki page deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete page";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (!page) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">Select or create a wiki page</p>
        <p className="text-sm">Choose a page from the sidebar to start editing</p>
      </div>
    );
  }

  const authorName = page.author?.name || page.author?.email || "Unknown";
  const authorInitials = (page.author?.name || page.author?.email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header: title + meta + actions */}
      <div className="flex items-start justify-between border-b px-8 py-6 gap-4">
        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-none bg-transparent text-3xl font-bold tracking-tight focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
            placeholder="Page title"
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={page.author?.image ?? undefined} />
                <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
              </Avatar>
              <span className="text-foreground">{authorName}</span>
            </span>
            <span className="text-border" aria-hidden>·</span>
            <span>
              Last updated{" "}
              <span className="text-foreground">{formatLastUpdated(page.updatedAt)}</span>
            </span>
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-destructive flex items-center gap-1 text-xs">
                <AlertCircle className="h-3 w-3" />
                Save failed
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
          onClick={() => setDeleteOpen(true)}
          title="Delete page"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <MilkdownEditor
          content={page.content ?? ""}
          onChange={handleContentChange}
          placeholder="Start writing your wiki content..."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Wiki Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{page.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
