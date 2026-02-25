import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@/lib/generated/prisma/client";
import { TaskPriority } from "@/lib/generated/prisma/enums";

type CreateTaskInput = {
  projectId: string;
  title: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  estimatedHours?: number | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  priority?: TaskPriority | null;
};

type UpdateTaskInput = {
  projectId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  status?: TaskStatus;
  estimatedHours?: number | null;
  sprintId?: string | null;
  priority?: TaskPriority | null;
};

async function recalcParentAggregates(parentTaskId: string) {
  const parent = await prisma.task.findUnique({
    where: { id: parentTaskId },
    include: { subtasks: true },
  });
  if (!parent) return;

  const subs = parent.subtasks;
  if (subs.length === 0) {
    // no subtasks → parent keeps its own status/estimate
    return;
  }

  const total = subs.length;
  const done = subs.filter((s) => s.status === TaskStatus.DONE).length;
  const allTodo = subs.every((s) => s.status === TaskStatus.TODO);

  let status: TaskStatus;
  if (done === total) status = TaskStatus.DONE;
  else if (allTodo) status = TaskStatus.TODO;
  else status = TaskStatus.IN_PROGRESS;

  const estimatedHours =
    subs.reduce((sum, s) => sum + Number(s.estimatedHours ?? 0), 0) || null;

  await prisma.task.update({
    where: { id: parentTaskId },
    data: { status, estimatedHours },
  });
}

async function validateParentForSubtask(projectId: string, parentTaskId: string) {
  const parent = await prisma.task.findUnique({
    where: { id: parentTaskId },
    select: { id: true, projectId: true, parentTaskId: true },
  });

  if (!parent) {
    throw new Error("Parent task not found");
  }

  if (parent.projectId !== projectId) {
    throw new Error("Parent task does not belong to this project");
  }

  if (parent.parentTaskId) {
    throw new Error("Subtasks cannot have their own subtasks");
  }
}

export async function createTaskWithRules(input: CreateTaskInput) {
  const {
    projectId,
    title,
    description,
    acceptanceCriteria,
    estimatedHours,
    sprintId,
    assigneeId,
    parentTaskId,
    priority,
  } = input;

  return prisma.$transaction(async (tx) => {
    // validate assignee belongs to project
    if (assigneeId) {
      const member = await tx.projectMember.findUnique({
        where: { id: assigneeId },
        select: { projectId: true },
      });
      if (!member) {
        throw new Error("Assignee not found");
      }
      if (member.projectId !== projectId) {
        throw new Error("Assignee is not a member of this project");
      }
    }

    // creating a subtask
    if (parentTaskId) {
      await validateParentForSubtask(projectId, parentTaskId);

      // subtasks cannot have explicit sprint; inherit from parent
      if (sprintId) {
        throw new Error("Subtasks cannot have their own sprint");
      }

      const parent = await tx.task.findUnique({
        where: { id: parentTaskId },
        select: { sprintId: true },
      });

      const task = await tx.task.create({
        data: {
          projectId,
          title,
          description: description ?? null,
          acceptanceCriteria: acceptanceCriteria ?? null,
          priority: priority ?? undefined,
          estimatedHours: estimatedHours ?? null,
          sprintId: parent?.sprintId ?? null,
          assigneeId: assigneeId ?? null,
          parentTaskId,
        },
        include: {
          assignee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          sprint: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: { subtasks: true },
          },
        },
      });

      await recalcParentAggregates(parentTaskId);
      return task;
    }

    // creating a parent task
    let finalSprintId: string | null = null;
    if (sprintId) {
      const sprint = await tx.sprint.findUnique({
        where: { id: sprintId },
        select: { projectId: true },
      });
      if (!sprint) throw new Error("Sprint not found");
      if (sprint.projectId !== projectId) {
        throw new Error("Sprint does not belong to this project");
      }
      finalSprintId = sprintId;
    }

    const task = await tx.task.create({
      data: {
        projectId,
        title,
        description: description ?? null,
        acceptanceCriteria: acceptanceCriteria ?? null,
        priority: priority ?? undefined,
        estimatedHours: estimatedHours ?? null,
        sprintId: finalSprintId,
        assigneeId: assigneeId ?? null,
        parentTaskId: null,
      },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        sprint: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: { subtasks: true },
        },
      },
    });

    return task;
  });
}

export async function updateTaskWithRules(input: UpdateTaskInput) {
  const {
    projectId,
    taskId,
    title,
    description,
    acceptanceCriteria,
    status,
    estimatedHours,
    sprintId,
    priority,
  } = input;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        parentTaskId: true,
      },
    });

    if (!existing) {
      throw new Error("Task not found");
    }
    if (existing.projectId !== projectId) {
      throw new Error("Task does not belong to this project");
    }

    const data: any = {};

    if (typeof title === "string") {
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Title cannot be empty");
      data.title = trimmed;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (acceptanceCriteria !== undefined) {
      data.acceptanceCriteria = acceptanceCriteria;
    }

    // status rules
    if (status) {
      if (!existing.parentTaskId) {
        // parent: only allow if it has no subtasks
        const count = await tx.task.count({
          where: { parentTaskId: taskId },
        });
        if (count > 0) {
          throw new Error(
            "Cannot manually change status of a parent task that has subtasks"
          );
        }
      }
      data.status = status;
    }

    // estimate rules
    if (estimatedHours !== undefined) {
      if (estimatedHours !== null && estimatedHours < 0) {
        throw new Error("Estimated hours must be a positive number");
      }

      if (!existing.parentTaskId) {
        // parent: if it has subtasks, estimate is derived
        const count = await tx.task.count({
          where: { parentTaskId: taskId },
        });
        if (count > 0) {
          throw new Error(
            "Estimated hours for a parent task are derived from its subtasks"
          );
        }
      }
      data.estimatedHours = estimatedHours;
    }

    // sprint rules
    if (sprintId !== undefined) {
      if (existing.parentTaskId) {
        // cannot set sprint directly on subtask
        throw new Error("Cannot assign a sprint directly to a subtask");
      }

      let finalSprintId: string | null = null;
      if (sprintId) {
        const sprint = await tx.sprint.findUnique({
          where: { id: sprintId },
          select: { projectId: true },
        });
        if (!sprint) throw new Error("Sprint not found");
        if (sprint.projectId !== projectId) {
          throw new Error("Sprint does not belong to this project");
        }
        finalSprintId = sprintId;
      }
      data.sprintId = finalSprintId;
    }

    if (priority !== undefined) {
      data.priority = priority;
    }

    if (!Object.keys(data).length) {
      throw new Error("No valid fields to update");
    }

    const updated = await tx.task.update({
      where: {
        id: taskId,
        projectId,
      },
      data,
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        sprint: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
    });

    // if this is a subtask, recalc parent aggregates
    if (existing.parentTaskId) {
      await recalcParentAggregates(existing.parentTaskId);
    }

    // if sprint changed on parent, propagate to subtasks
    if (!existing.parentTaskId && sprintId !== undefined) {
      await tx.task.updateMany({
        where: { parentTaskId: taskId },
        data: { sprintId: data.sprintId ?? null },
      });
    }

    return updated;
  });
}

