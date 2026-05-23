"use client";

import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import type { CrepeFeature } from "@milkdown/crepe";

// Disable features we don't need
const DISABLED_FEATURES: CrepeFeature[] = [
  "image-block" as CrepeFeature,
  "latex" as CrepeFeature,
  "ai" as CrepeFeature,
  "top-bar" as CrepeFeature,
];

type MilkdownEditorProps = {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  readonly?: boolean;
};

export function MilkdownEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  readonly = false,
}: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Load Milkdown Crepe CSS (copied from node_modules because package exports block direct imports)
    const loadCss = async () => {
      await import("@/styles/milkdown/common/style.css");
      await import("@/styles/milkdown/nord/style.css");
    };
    loadCss().catch(console.error);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const features = Object.fromEntries(
      DISABLED_FEATURES.map((f) => [f, false])
    ) as Partial<Record<CrepeFeature, boolean>>;

    const crepe = new Crepe({
      root: containerRef.current,
      defaultValue: content,
      features,
      featureConfigs: {
        placeholder: { text: placeholder },
      },
    });

    crepe.setReadonly(readonly);

    crepe.on((api) => {
      api.markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          onChangeRef.current(markdown);
        }
      });
    });

    crepe.create().catch(console.error);

    return () => {
      crepe.destroy().catch(console.error);
    };
  }, []); // key={page.id} handles remounting on page switch

  return <div ref={containerRef} className="milkdown min-h-[400px]" />;
}
