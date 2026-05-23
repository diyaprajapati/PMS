import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validatePassword } from "@/lib/password";
import { getPostHogClient } from "@/lib/posthog-server";

// POST /api/auth/register
export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 },
            );
        }

        const pwCheck = validatePassword(password);
        if (!pwCheck.valid) {
            return NextResponse.json(
                { error: pwCheck.message ?? "Password does not meet requirements" },
                { status: 400 },
            );
        }

        const exisitngUser = await prisma.user.findUnique({
            where: { email },
        });

        if (exisitngUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const posthog = getPostHogClient();
        posthog.identify({
            distinctId: user.id,
            properties: { email: user.email, name: user.name },
        });
        posthog.capture({
            distinctId: user.id,
            event: "user_signed_up",
            properties: { email: user.email, name: user.name },
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                },
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
