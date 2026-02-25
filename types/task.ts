export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  status: TaskStatus;
  estimatedHours: number | null;
  projectId: string;
  sprintId: string | null;
  assigneeId: string | null;
  parentTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations (populated when needed)
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
  sprint?: {
    id: string;
    title: string;
    status: string;
  } | null;
  subtasks?: Task[];
  _count?: {
    subtasks: number;
  };
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  estimatedHours?: number | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
};

export type TaskFilters = {
  sprintId?: string | null | "backlog";
  status?: TaskStatus;
  assigneeId?: string | null;
  parentTaskId?: string | null;
};

export type SprintStatus = "NOT_STARTED" | "ACTIVE" | "COMPLETED";
