import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { createBug } from "@/lib/bug-service";
import { sendBugCreatedEmail } from "@/lib/email";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/bugs - list bugs for a project
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;

  try {
    const bugs = await prisma.bug.findMany({
      where: { projectId },
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
      orderBy: { bugNumber: "desc" },
    });

    return NextResponse.json(bugs);
  } catch (error) {
    console.error("Error fetching bugs:", error);
    return NextResponse.json({ error: "Failed to fetch bugs" }, { status: 500 });
  }
}

// POST /api/projects/[id]/bugs - create a new bug
export async function POST(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId, user } = auth;

  let body: {
    title?: string;
    description?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const bug = await createBug({
      projectId,
      title,
      description: body.description ?? null,
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        members: {
          select: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (project) {
      const recipients = [project.owner, ...project.members.map((member) => member.user)]
        .filter((recipient) => recipient.id !== user.id)
        .filter((recipient, index, arr) => arr.findIndex((r) => r.email === recipient.email) === index);

      for (const recipient of recipients) {
        void sendBugCreatedEmail({
          toEmail: recipient.email,
          recipientName: recipient.name,
          creatorName: user.name,
          creatorEmail: user.email,
          projectName: project.name,
          bugIdentifier: `BUG-${bug.bugNumber}`,
          bugTitle: bug.title,
          projectId,
        }).catch((emailError) => {
          console.error("Failed to send bug created email:", emailError);
        });
      }
    }

    return NextResponse.json(bug, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bug:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create bug" },
      { status: 400 }
    );
  }
}
