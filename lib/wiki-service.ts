import { prisma } from "@/lib/prisma";

type CreateWikiPageInput = {
  projectId: string;
  title: string;
  content: string;
  authorId: string;
};

type UpdateWikiPageInput = {
  projectId: string;
  pageId: string;
  title?: string;
  content?: string;
};

export async function createWikiPage(input: CreateWikiPageInput) {
  const { projectId, title, content, authorId } = input;

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }

  return prisma.wikiPage.create({
    data: {
      projectId,
      title: trimmedTitle,
      content: content ?? "",
      authorId,
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

export async function getWikiPages(projectId: string) {
  return prisma.wikiPage.findMany({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getWikiPageById(projectId: string, pageId: string) {
  return prisma.wikiPage.findFirst({
    where: { id: pageId, projectId },
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

export async function updateWikiPage(input: UpdateWikiPageInput) {
  const { projectId, pageId, title, content } = input;

  const existing = await prisma.wikiPage.findFirst({
    where: { id: pageId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Wiki page not found");
  }

  const data: {
    title?: string;
    content?: string;
  } = {};

  if (title !== undefined) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error("Title cannot be empty");
    }
    data.title = trimmedTitle;
  }

  if (content !== undefined) {
    data.content = content;
  }

  if (!Object.keys(data).length) {
    throw new Error("No valid fields to update");
  }

  return prisma.wikiPage.update({
    where: { id: pageId, projectId },
    data,
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

export async function deleteWikiPage(projectId: string, pageId: string) {
  const existing = await prisma.wikiPage.findFirst({
    where: { id: pageId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Wiki page not found");
  }

  await prisma.wikiPage.delete({
    where: { id: pageId, projectId },
  });

  return { id: pageId };
}
