import { Badge } from "@/components/ui/badge";
import type { BugStatus } from "@/types/bug";

type BugStatusBadgeProps = {
  status: BugStatus;
};

const variants: Record<BugStatus, { label: string; className: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
  },
  IN_REVIEW: {
    label: "In Review",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700",
  },
  FIXED: {
    label: "Fixed",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700",
  },
  CLOSED: {
    label: "Closed",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100 border-violet-300 dark:border-violet-700",
  },
};

export function BugStatusBadge({ status }: BugStatusBadgeProps) {
  const config = variants[status] ?? variants.NOT_STARTED;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
