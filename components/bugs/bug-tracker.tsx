"use client";

import { useState } from "react";
import { BugIcon } from "lucide-react";
import { AddBugDialog } from "@/components/bugs/AddBugDialog";
import { BugTable } from "@/components/bugs/BugTable";
import { BugDetailSheet } from "@/components/bugs/BugDetailSheet";

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
    </div>
  );
}
