import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labelSetups, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateLabelSetupSchema = z.object({
  labelLengthMm: z.string().optional(),
  labelHeightMm: z.string().optional(),
  labelThicknessMm: z.string().optional(),
  labelColourBackground: z.string().optional(),
  textColour: z.string().optional(),
  labelQuantity: z.number().min(1).optional(),
  style: z.string().optional(),
  noOfHoles: z.number().min(0).optional(),
  holeSizeMm: z.string().optional(),
  holeDistanceMm: z.string().optional(),
  lines: z.array(z.object({
    text: z.string(),
    textSizeMm: z.number().min(0),
    spacingTopMm: z.union([z.string(), z.number()]),
    spacingLeftMm: z.union([z.string(), z.number()]),
  })).length(8).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setup = await db
      .select()
      .from(labelSetups)
      .innerJoin(projects, eq(labelSetups.projectId, projects.id))
      .where(eq(labelSetups.id, id))
      .limit(1);

    if (!setup.length) {
      return NextResponse.json({ error: "Setup not found" }, { status: 404 });
    }

    if (setup[0].projects.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(setup[0].label_setups);
  } catch (error) {
    console.error("Error fetching label setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingSetup = await db
      .select()
      .from(labelSetups)
      .innerJoin(projects, eq(labelSetups.projectId, projects.id))
      .where(eq(labelSetups.id, id))
      .limit(1);

    if (!existingSetup.length) {
      return NextResponse.json({ error: "Setup not found" }, { status: 404 });
    }

    if (existingSetup[0].projects.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateLabelSetupSchema.parse(body);

    const updatedSetup = await db
      .update(labelSetups)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(labelSetups.id, id))
      .returning();

    return NextResponse.json(updatedSetup[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating label setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingSetup = await db
      .select()
      .from(labelSetups)
      .innerJoin(projects, eq(labelSetups.projectId, projects.id))
      .where(eq(labelSetups.id, id))
      .limit(1);

    if (!existingSetup.length) {
      return NextResponse.json({ error: "Setup not found" }, { status: 404 });
    }

    if (existingSetup[0].projects.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(labelSetups).where(eq(labelSetups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting label setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}