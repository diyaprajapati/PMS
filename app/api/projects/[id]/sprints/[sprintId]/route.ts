import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { parseDate } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string; sprintId: string }> };

// PATCH /api/projects/[id]/sprints/[sprintId] – update a sprint
export async function PATCH(req: Request, context: RouteContext) {
    const auth = await requireProjectAccess(context.params);
    if (!auth.success) return auth.response;
    const { projectId } = auth;
    const routeParams = await context.params;
    const sprintId = routeParams.sprintId;

    if (!sprintId) {
        return NextResponse.json({ error: "Sprint ID is required" }, { status: 400 });
    }

    let body: {
        title?: string
        startDate?: string
        endDate?: string
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    const data: any = {};

    if(typeof body.title === "string") {
        const title = body.title.trim();
        if(!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        data.title = title;
    }

    if(typeof body.startDate === "string") {
        const date = parseDate(body.startDate);
        if(!date) {
            return NextResponse.json({ error: "Invalid start date format. Use DD-MM-YYYY or ISO format" }, { status: 400 });
        }
        data.startDate = date;
    }
    if(typeof body.endDate === "string") {
        const date = parseDate(body.endDate);
        if(!date) {
            return NextResponse.json({ error: "Invalid end date format. Use DD-MM-YYYY or ISO format" }, { status: 400 });
        }
        data.endDate = date;
    }

    if(!Object.keys(data).length) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    try {
        const updatedSprint = await prisma.sprint.update({
            where: {
                id: sprintId,
                projectId: projectId
            },
            data: data,
            select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
            }
        });
        return NextResponse.json(updatedSprint);
    } catch (error: any) {
        console.error("Error updating sprint:", error);
        if(error.code === "P2025") {
            return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/sprints/[sprintId] – delete a sprint
export async function DELETE(req: Request, context: RouteContext) {
    const auth = await requireProjectAccess(context.params);
    if (!auth.success) return auth.response;
    const { projectId } = auth;
    const routeParams = await context.params;
    const sprintId = routeParams.sprintId;

    if (!sprintId) {
        return NextResponse.json({ error: "Sprint ID is required" }, { status: 400 });
    }
    try {
        await prisma.sprint.delete({
            where: {
                id: sprintId,
                projectId: projectId
            }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("Error deleting sprint:", error);
        if(error.code === "P2025") {
            return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete sprint" }, { status: 500 });
    }
}