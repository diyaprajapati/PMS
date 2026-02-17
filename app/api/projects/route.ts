import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

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

    // Get projects owned by the user
    const ownedProjects = await prisma.project.findMany({
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

    // Combine and deduplicate (in case user is both owner and member, which shouldn't happen)
    const allProjects = [
      ...ownedProjects,
      ...memberProjects.map((mp: { project: any; }) => mp.project),
    ];

    // Remove duplicates by id
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    );

    // Sort by updatedAt descending
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

  return NextResponse.json(project, { status: 201 });
}
