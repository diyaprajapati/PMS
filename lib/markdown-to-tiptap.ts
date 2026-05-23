import { marked } from "marked";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Underline,
];

export function markdownToTipTapJson(markdown: string): object {
  const html = marked.parse(markdown, { gfm: true }) as string;
  return generateJSON(html, extensions);
}
