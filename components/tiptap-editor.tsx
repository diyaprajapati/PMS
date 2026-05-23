"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TipTapEditorProps = {
  content: object;
  onChange: (content: object) => void;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  editor,
  command,
  args,
  activeCheck,
  icon: Icon,
  label,
}: {
  editor: Editor;
  command: string;
  args?: unknown;
  activeCheck?: string;
  icon: React.ElementType;
  label: string;
}) {
  const isActive = activeCheck ? editor.isActive(activeCheck) : false;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", isActive && "bg-accent text-accent-foreground")}
      onClick={() => {
        // @ts-expect-error dynamic command access
        editor.chain().focus()[command](args).run();
      }}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className,
}: TipTapEditorProps) {
  const lastContentString = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const newJson = editor.getJSON();
      const newStr = JSON.stringify(newJson);
      // Only notify parent if this change wasn't triggered by setContent from the effect below
      if (lastContentString.current !== newStr) {
        lastContentString.current = newStr;
        onChangeRef.current(newJson);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none min-h-[300px] focus:outline-none leading-loose prose-p:my-3 prose-headings:mb-4 prose-headings:mt-6 prose-li:my-1.5 prose-blockquote:my-5 prose-pre:my-5",
      },
    },
  });

  // Update editor content when the parent provides new content (e.g. switching pages).
  // This runs after mount and whenever the content prop changes.
  useEffect(() => {
    if (editor && content) {
      const contentStr = JSON.stringify(content);
      if (lastContentString.current !== contentStr) {
        lastContentString.current = contentStr;
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [editor, content]);

  if (!editor) {
    return (
      <div className={cn("rounded-md border bg-card p-4", className)}>
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 w-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border bg-card", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <ToolbarButton
          editor={editor}
          command="toggleBold"
          activeCheck="bold"
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          editor={editor}
          command="toggleItalic"
          activeCheck="italic"
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          editor={editor}
          command="toggleUnderline"
          activeCheck="underline"
          icon={UnderlineIcon}
          label="Underline"
        />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          editor={editor}
          command="toggleHeading"
          args={{ level: 1 }}
          activeCheck="heading"
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          editor={editor}
          command="toggleHeading"
          args={{ level: 2 }}
          activeCheck="heading"
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          editor={editor}
          command="toggleHeading"
          args={{ level: 3 }}
          activeCheck="heading"
          icon={Heading3}
          label="Heading 3"
        />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          editor={editor}
          command="toggleBulletList"
          activeCheck="bulletList"
          icon={List}
          label="Bullet List"
        />
        <ToolbarButton
          editor={editor}
          command="toggleOrderedList"
          activeCheck="orderedList"
          icon={ListOrdered}
          label="Ordered List"
        />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          editor={editor}
          command="toggleBlockquote"
          activeCheck="blockquote"
          icon={Quote}
          label="Blockquote"
        />
        <ToolbarButton
          editor={editor}
          command="toggleCodeBlock"
          activeCheck="codeBlock"
          icon={Code}
          label="Code Block"
        />
        <ToolbarButton
          editor={editor}
          command="setHorizontalRule"
          icon={Minus}
          label="Horizontal Rule"
        />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ToolbarButton
          editor={editor}
          command="undo"
          icon={Undo}
          label="Undo"
        />
        <ToolbarButton
          editor={editor}
          command="redo"
          icon={Redo}
          label="Redo"
        />
      </div>
      <div className="p-6 md:p-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
