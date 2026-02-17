import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { canManageProjectMembers } from "@/lib/project-permissions";

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

// PATCH /api/projects/[id]/members/[memberId] – update a member's role
export async function PATCH(req: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, memberId } = await context.params;
  if (!projectId || !memberId) {
    return NextResponse.json(
      { error: "Project ID and Member ID are required" },
      { status: 400 }
    );
  }

  // Check if user can manage members
  const canManage = await canManageProjectMembers(user.id, projectId);
  if (!canManage) {
    return NextResponse.json(
      { error: "You don't have permission to manage members of this project" },
      { status: 403 }
    );
  }

  let body: { role?: "ADMIN" | "DEVELOPER" | "CLIENT" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = body;

  if (!role || !["ADMIN", "DEVELOPER", "CLIENT"].includes(role)) {
    return NextResponse.json(
      { error: "Role must be ADMIN, DEVELOPER, or CLIENT" },
      { status: 400 }
    );
  }

  try {
    // Verify the member exists and belongs to this project
    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (existingMember.projectId !== projectId) {
      return NextResponse.json(
        { error: "Member does not belong to this project" },
        { status: 400 }
      );
    }

    // Prevent changing the owner's role (they're not a member, they're the owner)
    if (existingMember.project.userId === existingMember.userId) {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 400 }
      );
    }

    // Update the member's role
    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
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

    return NextResponse.json({
      id: updatedMember.id,
      userId: updatedMember.user.id,
      email: updatedMember.user.email,
      name: updatedMember.user.name,
      image: updatedMember.user.image,
      role: updatedMember.role,
      createdAt: updatedMember.createdAt.toISOString(),
      updatedAt: updatedMember.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error updating project member:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update project member" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members/[memberId] – remove a member from the project
export async function DELETE(_req: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, memberId } = await context.params;
  if (!projectId || !memberId) {
    return NextResponse.json(
      { error: "Project ID and Member ID are required" },
      { status: 400 }
    );
  }

  // Check if user can manage members
  const canManage = await canManageProjectMembers(user.id, projectId);
  if (!canManage) {
    return NextResponse.json(
      { error: "You don't have permission to manage members of this project" },
      { status: 403 }
    );
  }

  try {
    // Verify the member exists and belongs to this project
    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (existingMember.projectId !== projectId) {
      return NextResponse.json(
        { error: "Member does not belong to this project" },
        { status: 400 }
      );
    }

    // Prevent deleting the owner (they're not a member, they're the owner)
    if (existingMember.project.userId === existingMember.userId) {
      return NextResponse.json(
        { error: "Cannot remove the project owner" },
        { status: 400 }
      );
    }

    // Prevent users from removing themselves if they're not admin/owner
    if (existingMember.userId === user.id) {
      const isOwner = existingMember.project.userId === user.id;
      if (!isOwner) {
        // Allow self-removal for non-owners
        await prisma.projectMember.delete({
          where: { id: memberId },
        });
        return new NextResponse(null, { status: 204 });
      }
    }

    // Delete the member
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Error deleting project member:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete project member" },
      { status: 500 }
    );
  }
}
