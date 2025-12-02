import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // Generate PDF files
    const pdfFiles = await generatePdfFiles(labelSetups, projectName || "Labels", sheetConfig);

    if (pdfFiles.length === 0) {
      return NextResponse.json({ error: "No PDF files generated" }, { status: 500 });
    }

    // Create ZIP file containing all PDF files
    const zip = new JSZip();
    for (const file of pdfFiles) {
      zip.file(file.filename, file.content);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFilename = `${projectName || "Labels"}_PDF.zip`;

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF file" },
      { status: 500 }
    );
  }
}
