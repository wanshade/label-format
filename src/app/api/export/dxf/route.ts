import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDxfFiles } from "@/lib/dxf";
import { generatePdfFiles } from "@/lib/pdf";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { labelSetups, projectName, sheetWidth = 600, sheetHeight = 300 } = body;

    if (!labelSetups || !Array.isArray(labelSetups) || labelSetups.length === 0) {
      return NextResponse.json({ error: "No label setups provided" }, { status: 400 });
    }

    const sheetConfig = {
      width: sheetWidth,
      height: sheetHeight,
      margin: 0,
      gap: 0,
    };

    // Generate DXF files
    const dxfFiles = generateDxfFiles(labelSetups, projectName || "Labels", sheetConfig);

    // Generate PDF files
    const pdfFiles = await generatePdfFiles(labelSetups, projectName || "Labels", sheetConfig);

    if (dxfFiles.length === 0 && pdfFiles.length === 0) {
      return NextResponse.json({ error: "No files generated" }, { status: 500 });
    }

    // Create ZIP file containing all DXF and PDF files
    const zip = new JSZip();
    
    // Add DXF files
    for (const file of dxfFiles) {
      zip.file(file.filename, file.content);
    }
    
    // Add PDF files
    for (const file of pdfFiles) {
      zip.file(file.filename, file.content);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFilename = `${projectName || "Labels"}.zip`;

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating DXF:", error);
    return NextResponse.json(
      { error: "Failed to generate DXF file" },
      { status: 500 }
    );
  }
}

// GET endpoint to preview sheet arrangement without generating files
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // For now, return info about sheet configuration
    return NextResponse.json({
      sheetConfig: {
        width: 600,
        height: 300,
        margin: 0,
        gap: 0,
      },
      info: "Use POST with labelSetups to generate DXF files",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
