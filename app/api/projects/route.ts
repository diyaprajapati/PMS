import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getPostHogClient } from "@/lib/posthog-server";

// GET /api/projects – list projects for the current user
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
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

    // Get projects owned by the user (with member count and sample for avatars)
    const ownedProjects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          take: 5,
          select: {
            id: true,
            user: { select: { name: true, image: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    // Get projects where the user is a member
    let memberProjects: Array<{ project: any }> = [];
    try {
      memberProjects = await prisma.projectMember.findMany({
        where: { userId: user.id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              updatedAt: true,
              members: {
                take: 5,
                select: {
                  id: true,
                  user: { select: { name: true, image: true } },
                },
              },
              _count: { select: { members: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      // If ProjectMember table doesn't exist yet, just use empty array
      if (error?.message?.includes("does not exist")) {
        console.warn("ProjectMember table does not exist yet. Run migrations: npx prisma migrate dev");
        memberProjects = [];
      } else {
        throw error;
      }
    }

    // Build project id -> { project, myRole }; owner wins over member
    type ProjectWithMeta = {
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      myRole: string;
      members: Array<{ id: string; user: { name: string | null; image: string | null } }>;
      _count: { members: number };
    };
    const projectMap = new Map<string, ProjectWithMeta>();
    for (const p of ownedProjects) {
      projectMap.set(p.id, { ...p, myRole: "OWNER" });
    }
    for (const mp of memberProjects as Array<{ project: Omit<ProjectWithMeta, "myRole">; role: string }>) {
      if (!projectMap.has(mp.project.id)) {
        projectMap.set(mp.project.id, { ...mp.project, myRole: mp.role });
      }
    }

    const uniqueProjects = Array.from(projectMap.values());
    uniqueProjects.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json(uniqueProjects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects – create a project
export async function POST(req: Request) {
  const user = await getCurrentUser(req);
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

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "project_created",
    properties: { project_id: project.id, project_name: project.name },
  });

  return NextResponse.json(project, { status: 201 });
}
