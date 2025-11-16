import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labelSetups, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateExcelBufferFromLabelSetups } from "@/lib/excel";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for optional filtering
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);

    // Fetch label setups by joining with projects to verify user ownership
    let setups;
    if (ids && ids.length > 0) {
      setups = await db
        .select()
        .from(labelSetups)
        .innerJoin(projects, eq(labelSetups.projectId, projects.id))
        .where(eq(projects.userId, session.user.id))
        .orderBy(labelSetups.createdAt);

      // Filter by provided IDs
      setups = setups.filter(setup => ids.includes(setup.label_setups.id));
    } else {
      setups = await db
        .select()
        .from(labelSetups)
        .innerJoin(projects, eq(labelSetups.projectId, projects.id))
        .where(eq(projects.userId, session.user.id))
        .orderBy(labelSetups.createdAt);
    }

    if (setups.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 });
    }

    // Load template file
    const templatePath = path.join(process.cwd(), "public", "MLA-Setup-Sheet.xlsx");

    let templateArrayBuffer: ArrayBuffer;
    try {
      const templateBuffer = fs.readFileSync(templatePath);
      templateArrayBuffer = templateBuffer.buffer.slice(
        templateBuffer.byteOffset,
        templateBuffer.byteOffset + templateBuffer.byteLength
      );
    } catch (error) {
      console.error("Template file not found:", templatePath);
      return NextResponse.json(
        { error: "Template file not found" },
        { status: 500 }
      );
    }

    // Flatten the joined results to get just the labelSetup data and provide defaults for null values
    const labelSetupData = setups.map(setup => ({
      ...setup.label_setups,
      projectId: setup.label_setups.projectId || '',
      name: setup.label_setups.name || '',
      labelLengthMm: Number(setup.label_setups.labelLengthMm) || 0,
      labelHeightMm: Number(setup.label_setups.labelHeightMm) || 0,
      labelThicknessMm: Number(setup.label_setups.labelThicknessMm) || 0,
      labelColourBackground: setup.label_setups.labelColourBackground || '',
      textColour: setup.label_setups.textColour || '',
      labelQuantity: setup.label_setups.labelQuantity || 1,
      style: setup.label_setups.style || '',
      noOfHoles: setup.label_setups.noOfHoles || 0,
      holeSizeMm: Number(setup.label_setups.holeSizeMm) || 0,
      holeDistanceMm: Number(setup.label_setups.holeDistanceMm) || 0,
      lines: setup.label_setups.lines || [],
      createdAt: setup.label_setups.createdAt || new Date(),
      updatedAt: setup.label_setups.updatedAt || new Date(),
    }));

    // Generate Excel buffer
    const excelBuffer = await generateExcelBufferFromLabelSetups(
      templateArrayBuffer,
      labelSetupData
    );

    // Return the Excel file
    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const filename = `MLA-Setup-Export-${now}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting Excel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}