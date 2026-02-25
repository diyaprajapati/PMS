import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types/task";

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const variants: Record<TaskStatus, { label: string; className: string }> = {
    TODO: {
      label: "To Do",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
    },
    DONE: {
      label: "Done",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
    },
  };

  const config = variants[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
