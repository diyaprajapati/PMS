"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TipTapEditor } from "@/components/tiptap-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WikiPage } from "@/types/wiki";

type WikiEditorProps = {
  page: WikiPage | null | undefined;
  onSave: (pageId: string, payload: { title?: string; content?: object }) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
  isSaving: boolean;
};

export function WikiEditor({ page, onSave, onDelete, isSaving }: WikiEditorProps) {
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Track latest title for the debounced save callback
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // Sync title when page changes, and cancel any pending save from the previous page
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSaveStatus("idle");
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

      // We only compare title here; content is read from the editor instance
      // when the save actually fires via the TipTap onChange callback
      if (currentState === lastSavedRef.current) return;

      setSaveStatus("saving");

      onSave(page.id, {
        title: currentTitle,
      })
        .then(() => {
          setSaveStatus("saved");
          lastSavedRef.current = currentState;
          setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch((error) => {
          setSaveStatus("idle");
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
    (newContent: object) => {
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
            setTimeout(() => setSaveStatus("idle"), 2000);
          })
          .catch((error) => {
            setSaveStatus("idle");
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4 gap-4">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="border-none bg-transparent text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
          placeholder="Page title"
        />
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs text-muted-foreground min-w-[60px] text-right">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Delete page"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <TipTapEditor
          key={page.id}
          content={page.content ?? {}}
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
