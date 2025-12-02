import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const labelSetups: any[] = [];
    let row = 5; // Data starts at row 5

    while (true) {
      const firstCell = ws[XLSX.utils.encode_cell({ r: row - 1, c: 0 })];
      if (!firstCell || firstCell.v === undefined || firstCell.v === "") break;

      const read = (col: number) => {
        const cell = ws[XLSX.utils.encode_cell({ r: row - 1, c: col })];
        return cell?.v ?? "";
      };

      const lines = [];
      for (let i = 0; i < 8; i++) {
        const baseCol = 10 + i * 4;
        const text = read(baseCol);
        const textSizeMm = read(baseCol + 1);
        const spacingTopMm = read(baseCol + 2);
        const spacingLeftMm = read(baseCol + 3);
        
        // Only add lines that have text or size
        if (text || textSizeMm) {
          lines.push({
            text: String(text || ""),
            textSizeMm: parseFloat(textSizeMm) || 2,
            spacingTopMm: spacingTopMm || "AUTO",
            spacingLeftMm: spacingLeftMm || "AUTO",
          });
        }
      }

      // Ensure at least one line
      if (lines.length === 0) {
        lines.push({ text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" });
      }

      const setup = {
        name: "",
        labelLengthMm: parseFloat(read(0)) || 50,
        labelHeightMm: parseFloat(read(1)) || 20,
        labelThicknessMm: parseFloat(read(2)) || 0.8,
        labelColourBackground: String(read(3) || "WHITE").toUpperCase(),
        textColour: String(read(4) || "BLACK").toUpperCase(),
        labelQuantity: parseInt(read(5)) || 1,
        style: String(read(6) || "Adhesive"),
        noOfHoles: parseInt(read(7)) || 0,
        holeSizeMm: parseFloat(read(8)) || 0,
        holeDistanceMm: parseFloat(read(9)) || 0,
        lines,
      };

      labelSetups.push(setup);
      row++;
    }

    return NextResponse.json({ labelSetups });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to parse Excel file" }, { status: 500 });
  }
}
