import { TaskStatus, type Prisma } from "@prisma/client";

type SprintTransferClient = Prisma.TransactionClient;

const UNFINISHED_TASK_STATUSES = [TaskStatus.TODO, TaskStatus.IN_PROGRESS] as const;

export async function transferUnfinishedTasksToSprint(
  tx: SprintTransferClient,
  projectId: string,
  sprintId: string,
) {
  const unfinishedParentTasks = await tx.task.findMany({
    where: {
      projectId,
      sprintId: { not: null },
      status: { in: [...UNFINISHED_TASK_STATUSES] },
      parentTaskId: null,
    },
    select: { id: true },
  });

  const parentTaskIds = unfinishedParentTasks.map((task) => task.id);
  if (parentTaskIds.length === 0) return;

  await tx.task.updateMany({
    where: {
      id: { in: parentTaskIds },
      projectId,
      status: { in: [...UNFINISHED_TASK_STATUSES] },
    },
    data: { sprintId },
  });

  await tx.task.updateMany({
    where: {
      parentTaskId: { in: parentTaskIds },
      projectId,
      status: { in: [...UNFINISHED_TASK_STATUSES] },
    },
    data: { sprintId },
  });
}
