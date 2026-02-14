import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

// GET /api/projects – list projects for the current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.project) {
    return NextResponse.json(
      {
        error:
          "Prisma client is out of date. Restart the dev server (and run `npx prisma generate` if needed).",
      },
      { status: 503 }
    );
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(projects);
}

// POST /api/projects – create a project
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const description =
    typeof body.description === "string" ? body.description.trim() || null : null;

  if (!prisma.project) {
    return NextResponse.json(
      {
        error:
          "Prisma client is out of date. Restart the dev server (and run `npx prisma generate` if needed).",
      },
      { status: 503 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
