"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { TipTapEditor } from "@/components/tiptap-editor";
import type { WikiPage } from "@/types/wiki";

type WikiEditorProps = {
  page: WikiPage | null | undefined;
  onSave: (pageId: string, payload: { title?: string; content?: object }) => Promise<void>;
  isSaving: boolean;
};

export function WikiEditor({ page, onSave, isSaving }: WikiEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Refs so the debounce callback always reads the latest values
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Sync local state when page changes, and cancel any pending save from the previous page
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content ?? {});
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
      const currentContent = contentRef.current;
      const currentState = JSON.stringify({ title: currentTitle, content: currentContent });

      if (currentState === lastSavedRef.current) return;

      setSaveStatus("saving");

      onSave(page.id, {
        title: currentTitle,
        content: currentContent,
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

  const handleContentChange = (newContent: object) => {
    setContent(newContent);
    scheduleSave();
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
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="border-none bg-transparent text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
          placeholder="Page title"
        />
        <div className="text-xs text-muted-foreground min-w-[60px] text-right">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {/* key forces a remount so useEditor gets the new initial content */}
        <TipTapEditor
          key={page.id}
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing your wiki content..."
        />
      </div>
    </div>
  );
}
