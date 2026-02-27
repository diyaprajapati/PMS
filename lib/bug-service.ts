import { prisma } from "@/lib/prisma";
import { BugStatus, TaskPriority } from "@prisma/client";

type CreateBugInput = {
  projectId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: TaskPriority | null;
};

type UpdateBugInput = {
  projectId: string;
  bugId: string;
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: TaskPriority;
  status?: BugStatus;
};

type CreateBugCommentInput = {
  projectId: string;
  bugId: string;
  authorId: string;
  content: string;
};

function parseMentionUserIds(content: string): string[] {
  const ids = new Set<string>();
  const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      ids.add(match[1]);
    }
  }
  return [...ids];
}

async function validateAssignee(projectId: string, assigneeId: string | null) {
  if (!assigneeId) {
    return;
  }

  const member = await prisma.projectMember.findUnique({
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

export async function createBug(input: CreateBugInput) {
  const { projectId, title, description, assigneeId, priority } = input;

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }

  await validateAssignee(projectId, assigneeId ?? null);

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id: projectId },
      data: { bugCounter: { increment: 1 } },
      select: { bugCounter: true },
    });

    const bug = await tx.bug.create({
      data: {
        projectId,
        bugNumber: project.bugCounter,
        title: trimmedTitle,
        description: description?.trim() || null,
        assigneeId: assigneeId ?? null,
        priority: priority ?? undefined,
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
      },
    });

    return bug;
  });
}

export async function updateBug(input: UpdateBugInput) {
  const { projectId, bugId, title, description, assigneeId, priority, status } = input;

  const existing = await prisma.bug.findUnique({
    where: { id: bugId },
    select: { id: true, projectId: true },
  });

  if (!existing) {
    throw new Error("Bug not found");
  }

  if (existing.projectId !== projectId) {
    throw new Error("Bug does not belong to this project");
  }

  const data: {
    title?: string;
    description?: string | null;
    assigneeId?: string | null;
    priority?: TaskPriority;
    status?: BugStatus;
  } = {};

  if (title !== undefined) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error("Title cannot be empty");
    }
    data.title = trimmedTitle;
  }

  if (description !== undefined) {
    data.description = description?.trim() || null;
  }

  if (assigneeId !== undefined) {
    await validateAssignee(projectId, assigneeId);
    data.assigneeId = assigneeId;
  }

  if (priority !== undefined) {
    data.priority = priority;
  }

  if (status !== undefined) {
    data.status = status;
  }

  if (!Object.keys(data).length) {
    throw new Error("No valid fields to update");
  }

  return prisma.bug.update({
    where: { id: bugId, projectId },
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
    },
  });
}

export async function getBugById(projectId: string, bugId: string) {
  return prisma.bug.findFirst({
    where: { id: bugId, projectId },
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
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createBugComment(input: CreateBugCommentInput) {
  const { projectId, bugId, authorId, content } = input;
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Comment content is required");
  }

  const bug = await prisma.bug.findFirst({
    where: { id: bugId, projectId },
    select: { id: true },
  });

  if (!bug) {
    throw new Error("Bug not found");
  }

  const mentionIds = parseMentionUserIds(trimmed);
  if (mentionIds.length) {
    const usersInProject = await prisma.projectMember.findMany({
      where: { projectId, userId: { in: mentionIds } },
      select: { userId: true },
    });

    const validIds = new Set(usersInProject.map((member) => member.userId));
    const owner = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });
    if (owner?.userId) {
      validIds.add(owner.userId);
    }

    const invalidMention = mentionIds.find((id) => !validIds.has(id));
    if (invalidMention) {
      throw new Error("Comment contains invalid user mention");
    }
  }

  return prisma.bugComment.create({
    data: {
      bugId,
      authorId,
      content: trimmed,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}
