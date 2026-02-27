import type { TaskPriority } from "./task";

export type BugStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "FIXED"
  | "CLOSED";

export type Bug = {
  id: string;
  bugNumber: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: BugStatus;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  } | null;
  comments?: BugComment[];
};

export type BugComment = {
  id: string;
  bugId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export const BUG_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "P0", label: "Critical" },
  { value: "P1", label: "High" },
  { value: "P2", label: "Medium High" },
  { value: "P3", label: "Medium" },
  { value: "P4", label: "Low" },
  { value: "P5", label: "Lowest" },
];

export const BUG_STATUS_OPTIONS: { value: BugStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "FIXED", label: "Fixed" },
  { value: "CLOSED", label: "Closed" },
];
