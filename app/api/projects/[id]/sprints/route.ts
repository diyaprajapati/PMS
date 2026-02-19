import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { parseDate } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/sprints – get all sprints for a project
export async function GET(_req: Request, context: RouteContext) {
    const auth = await requireProjectAccess(context.params);
    if (!auth.success) return auth.response;
    const { projectId } = auth;

    try {
        const sprints = await prisma.sprint.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(sprints);
    } catch (error) {
        console.error("Error fetching sprints:", error);
        return NextResponse.json({ error: "Failed to fetch sprints" }, { status: 500 });
    }
}

// POST /api/projects/[id]/sprints – create a new sprint
export async function POST(req: Request, context: RouteContext) {
    const auth = await requireProjectAccess(context.params);
    if (!auth.success) return auth.response;
    const { projectId } = auth;

    let body: { 
        title?: string
        startDate?: Date
        endDate?: Date
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Parse dates using utility function
    const startDate = parseDate(body.startDate);
    if (body.startDate !== undefined && body.startDate !== null && !startDate) {
        return NextResponse.json({ error: "Invalid start date format. Use DD-MM-YYYY or ISO format" }, { status: 400 });
    }

    const endDate = parseDate(body.endDate);
    if (body.endDate !== undefined && body.endDate !== null && !endDate) {
        return NextResponse.json({ error: "Invalid end date format. Use DD-MM-YYYY or ISO format" }, { status: 400 });
    }

    if (startDate && endDate && startDate > endDate) {
        return NextResponse.json({ error: "Start date cannot be after end date" }, { status: 400 });
    }

    try {
        const sprint = await prisma.sprint.create({
            data: { title, projectId, startDate, endDate },
        });
        return NextResponse.json(sprint, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating sprint:", error);
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return NextResponse.json(
                { error: "A sprint with this title already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Failed to create sprint" }, { status: 500 });
    }
}