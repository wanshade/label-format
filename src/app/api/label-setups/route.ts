import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labelSetups, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CreateLabelSetupRequest } from "@/types/label";
import { z } from "zod";

const createLabelSetupSchema = z.object({
  projectId: z.string(),
  name: z.string().optional(),
  labelLengthMm: z.number().optional(),
  labelHeightMm: z.number().optional(),
  labelThicknessMm: z.number().optional(),
  labelColourBackground: z.string().optional(),
  textColour: z.string().optional(),
  labelQuantity: z.number().optional(),
  style: z.string().optional(),
  noOfHoles: z.number().optional(),
  holeSizeMm: z.number().optional(),
  holeDistanceMm: z.number().optional(),
  lines: z.array(z.object({
    text: z.string().optional(),
    textSizeMm: z.number().optional(),
    spacingTopMm: z.union([z.string(), z.number()]).optional(),
    spacingLeftMm: z.union([z.string(), z.number()]).optional(),
  })).min(1),
});

// GET - List all label setups for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for optional filtering by project
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    let setups;

    if (projectId) {
      // Filter by specific project
      // First verify the user owns the project
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (project.length === 0 || project[0].userId !== session.user.id) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      setups = await db
        .select()
        .from(labelSetups)
        .where(eq(labelSetups.projectId, projectId))
        .orderBy(labelSetups.createdAt);
    } else {
      // Get all label setups from all projects the user owns
      setups = await db
        .select({
          id: labelSetups.id,
          projectId: labelSetups.projectId,
          name: labelSetups.name,
          labelLengthMm: labelSetups.labelLengthMm,
          labelHeightMm: labelSetups.labelHeightMm,
          labelThicknessMm: labelSetups.labelThicknessMm,
          labelColourBackground: labelSetups.labelColourBackground,
          textColour: labelSetups.textColour,
          labelQuantity: labelSetups.labelQuantity,
          style: labelSetups.style,
          noOfHoles: labelSetups.noOfHoles,
          holeSizeMm: labelSetups.holeSizeMm,
          holeDistanceMm: labelSetups.holeDistanceMm,
          lines: labelSetups.lines,
          createdAt: labelSetups.createdAt,
          updatedAt: labelSetups.updatedAt,
          projectName: projects.name,
        })
        .from(labelSetups)
        .innerJoin(projects, eq(labelSetups.projectId, projects.id))
        .where(eq(projects.userId, session.user.id))
        .orderBy(labelSetups.createdAt);
    }

    return NextResponse.json(setups);
  } catch (error) {
    console.error("Error fetching label setups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new label setup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLabelSetupSchema.parse(body);

    // Verify the user owns the project
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, validatedData.projectId))
      .limit(1);

    if (project.length === 0 || project[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Process the data with fallbacks and convert numbers to strings
    const processedData = {
      projectId: validatedData.projectId,
      name: validatedData.name,
      labelLengthMm: String(validatedData.labelLengthMm ?? 0),
      labelHeightMm: String(validatedData.labelHeightMm ?? 0),
      labelThicknessMm: String(validatedData.labelThicknessMm ?? 0.8),
      labelColourBackground: validatedData.labelColourBackground ?? "WHITE",
      textColour: validatedData.textColour ?? "BLACK",
      labelQuantity: validatedData.labelQuantity ?? 1,
      style: validatedData.style ?? "Adhesive",
      noOfHoles: validatedData.noOfHoles ?? 0,
      holeSizeMm: String(validatedData.holeSizeMm ?? 0),
      holeDistanceMm: String(validatedData.holeDistanceMm ?? 0),
      lines: validatedData.lines?.map(line => ({
        text: line.text ?? "",
        textSizeMm: line.textSizeMm ?? 0,
        spacingTopMm: line.spacingTopMm ?? "AUTO",
        spacingLeftMm: line.spacingLeftMm ?? "AUTO",
      })) ?? [],
    };

    const newSetup = await db.insert(labelSetups).values(processedData).returning();

    return NextResponse.json(newSetup[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating label setup:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}