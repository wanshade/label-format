import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authenticateUser } from "@/lib/jwt";
import { db } from "@/db";
import { projects, labelSetups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CreateProjectRequest } from "@/types/label";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

// GET - List all projects for the current user
export async function GET(request: NextRequest) {
  try {
    // Try NextAuth session first (for web app usage)
    const session = await getServerSession(authOptions);

    // If no NextAuth session, try JWT token (for API usage)
    const userFromToken = !session ? await authenticateUser(request) : null;

    const userId = session?.user?.id || userFromToken?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - No valid session or token" }, { status: 401 });
    }

    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        labelSetupCount: db.$count(labelSetups).as('labelSetupCount'),
      })
      .from(projects)
      .leftJoin(labelSetups, eq(projects.id, labelSetups.projectId))
      .where(eq(projects.userId, userId))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt));

    return NextResponse.json(userProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Try NextAuth session first (for web app usage)
    const session = await getServerSession(authOptions);

    // If no NextAuth session, try JWT token (for API usage)
    const userFromToken = !session ? await authenticateUser(request) : null;

    const userId = session?.user?.id || userFromToken?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - No valid session or token" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const newProject = await db.insert(projects).values({
      ...validatedData,
      userId: userId,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}