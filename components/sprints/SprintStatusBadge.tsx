import { Badge } from "@/components/ui/badge";
import type { SprintStatus } from "@/types/task";

type SprintStatusBadgeProps = {
  status: SprintStatus;
};

const variants: Record<SprintStatus, { label: string; className: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
  },
};

export function SprintStatusBadge({ status }: SprintStatusBadgeProps) {
  const config = variants[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
