import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateExcelBufferFromLabelSetups } from "@/lib/excel";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { labelSetups, projectName } = body;

    if (!labelSetups || !Array.isArray(labelSetups)) {
      return NextResponse.json({ error: "Invalid label setups data" }, { status: 400 });
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

    // Generate Excel buffer
    const excelBuffer = await generateExcelBufferFromLabelSetups(
      templateArrayBuffer,
      labelSetups
    );

    // Return the Excel file
    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const filename = `${projectName || "MLA-Setup"}-Export-${now}.xlsx`;

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