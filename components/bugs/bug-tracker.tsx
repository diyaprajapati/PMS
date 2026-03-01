"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BugIcon } from "lucide-react";
import { AddBugDialog } from "@/components/bugs/AddBugDialog";
import { BugTable } from "@/components/bugs/BugTable";

// Lazy-load the detail sheet (includes react-mentions) so /bugs initial render is faster
const BugDetailSheet = dynamic(
  () => import("@/components/bugs/BugDetailSheet").then((m) => ({ default: m.BugDetailSheet })),
  { ssr: false }
);

export function BugTracker() {
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openBug = (bugId: string) => {
    setSelectedBugId(bugId);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 border border-primary/20">
            <BugIcon className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold tracking-tight">Bug Tracker</h2>
            <p className="text-xs text-muted-foreground/70">Report and track bugs across your project</p>
          </div>
        </div>
        <AddBugDialog />
      </div>

      <BugTable onSelectBug={openBug} selectedBugId={selectedBugId} />

      {/* Mount sheet only when opened so the detail chunk (react-mentions, etc.) loads on demand */}
      {sheetOpen && (
        <BugDetailSheet
          bugId={selectedBugId}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) {
              setSelectedBugId(null);
            }
          }}
        />
      )}
    </div>
  );
}
