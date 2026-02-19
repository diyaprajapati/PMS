import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess, requireProjectOwnership } from "@/lib/route-auth";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id] – get a single project (must own it or be member)
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params, {
    errorMessage: "Project not found",
  });
  if (!auth.success) return auth.response;
  const { projectId: id } = auth;

  if (!prisma.project) {
    return NextResponse.json(
      {
        error:
          "Prisma client is out of date. Restart the dev server (and run `npx prisma generate` if needed).",
      },
      { status: 503 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/[id] – update a project (must own it)
async function updateProject(req: Request, context: RouteContext) {
  const auth = await requireProjectOwnership(context.params);
  if (!auth.success) return auth.response;
  const { projectId: id } = auth;

  if (!prisma.project) {
    return NextResponse.json(
      {
        error:
          "Prisma client is out of date. Restart the dev server (and run `npx prisma generate` if needed).",
      },
      { status: 503 }
    );
  }

  const existing = await prisma.project.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const updates: { name?: string; description?: string | null } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }
    updates.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    updates.description =
      typeof body.description === "string"
        ? (body.description.trim() || null)
        : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing);
  }

  const project = await prisma.project.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(project);
}

// PATCH /api/projects/[id] – update a project (must own it)
export async function PATCH(req: Request, context: RouteContext) {
  return updateProject(req, context);
}

// DELETE /api/projects/[id] – delete a project (must own it)
export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireProjectOwnership(context.params);
  if (!auth.success) return auth.response;
  const { projectId: id } = auth;

  if (!prisma.project) {
    return NextResponse.json(
      {
        error:
          "Prisma client is out of date. Restart the dev server (and run `npx prisma generate` if needed).",
      },
      { status: 503 }
    );
  }

  const existing = await prisma.project.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
