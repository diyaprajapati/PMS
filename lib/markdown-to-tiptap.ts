// Markdown import is now trivial — we just pass the raw markdown text directly.
// This file is kept for consistency with the import flow in WikiSidebar.

export function markdownToTipTapJson(markdown: string): object {
  // We used to convert markdown → TipTap JSON. Now we store markdown directly.
  // This function is no longer used for content conversion but kept as a no-op
  // so existing import code doesn't break if it still references it.
  return {};
}

export function readMarkdownFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
