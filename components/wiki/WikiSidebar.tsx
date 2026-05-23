"use client";

import { useState } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WikiPage } from "@/types/wiki";

type WikiSidebarProps = {
  pages: WikiPage[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onCreatePage: (title: string) => Promise<void>;
  onDeletePage: (pageId: string) => Promise<void>;
  isLoading?: boolean;
};

export function WikiSidebar({
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  isLoading,
}: WikiSidebarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setTitleError("Title is required");
      return;
    }
    setTitleError(null);
    setCreating(true);
    try {
      await onCreatePage(trimmed);
      setNewTitle("");
      setCreateOpen(false);
      toast.success("Wiki page created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create page";
      setTitleError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletePageId) return;
    setDeleting(true);
    try {
      await onDeletePage(deletePageId);
      setDeleteOpen(false);
      setDeletePageId(null);
      toast.success("Wiki page deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete page";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex h-full w-72 flex-col border-r bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-sm font-semibold">Wiki Pages</h2>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setCreateOpen(true)}
            title="New page"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No pages yet.
              <br />
              Click + to create one.
            </div>
          ) : (
            <div className="space-y-1">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                    selectedPageId === page.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => onSelectPage(page.id)}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{page.title}</span>
                  <button
                    type="button"
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      selectedPageId === page.id && "text-primary-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePageId(page.id);
                      setDeleteOpen(true);
                    }}
                    title="Delete page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Wiki Page</DialogTitle>
            <DialogDescription>
              Give your new wiki page a title.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="wiki-title">Title</Label>
              <Input
                id="wiki-title"
                placeholder="Page title"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
              {titleError && (
                <p className="text-sm text-destructive">{titleError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setNewTitle("");
                setTitleError(null);
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Wiki Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wiki page? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletePageId(null);
              }}
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
    </>
  );
}
