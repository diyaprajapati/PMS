import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess, requireMemberManagement } from "@/lib/route-auth";
import { sendProjectInvitationEmail } from "@/lib/email";
import { getPostHogClient } from "@/lib/posthog-server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/members – get all members of a project
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch members first
    let members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Only ensure owner has a ProjectMember record when missing (avoids write on every GET)
    const ownerInList = members.some((m) => m.userId === project.userId);
    if (!ownerInList) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: project.userId } },
        update: {},
        create: { projectId, userId: project.userId, role: "OWNER" },
      });
      members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, email: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    // Put owner first, then everyone else
    const ownerEntry = members.find((m) => m.userId === project.userId);
    const others = members.filter((m) => m.userId !== project.userId);
    const ordered = ownerEntry ? [ownerEntry, ...others] : members;

    const membersList = ordered.map((member) => ({
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      image: member.user.image,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }));

    return NextResponse.json(membersList);
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members – add a new member to the project
export async function POST(req: Request, context: RouteContext) {
  const auth = await requireMemberManagement(context.params);
  if (!auth.success) return auth.response;
  const { user, projectId } = auth;

  let body: { email: string; role: "ADMIN" | "DEVELOPER" | "CLIENT" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, role } = body;

  // Validate input
  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  if (!role || !["ADMIN", "DEVELOPER", "CLIENT"].includes(role)) {
    return NextResponse.json(
      { error: "Role must be ADMIN, DEVELOPER, or CLIENT" },
      { status: 400 }
    );
  }

  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is trying to add themselves (they're already the owner)
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You are already the owner of this project" },
        { status: 400 }
      );
    }

    // Find or create the user
    let targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      // Create a new user account for the invitee (they'll need to set password later)
      targetUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: null,
        },
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // Create the membership
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Send invitation email (don't fail if email fails)
    try {
      await sendProjectInvitationEmail(
        targetUser.email,
        user.name,
        user.email,
        project.name,
        role,
        projectId
      );
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Continue even if email fails - member is already added
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.id,
      event: "member_invited",
      properties: {
        project_id: projectId,
        invited_user_id: targetUser.id,
        role,
      },
    });

    return NextResponse.json(
      {
        id: member.id,
        userId: member.user.id,
        email: member.user.email,
        name: member.user.name,
        image: member.user.image,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding project member:", error);
    
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 }
    );
  }
}
