import * as XLSX from "xlsx";
import type { LabelSetup } from "@/types/label";

export async function generateExcelBufferFromLabelSetups(
  templateArrayBuffer: ArrayBuffer,
  items: LabelSetup[]
): Promise<Buffer> {
  const wb = XLSX.read(templateArrayBuffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  let row = 5; // 1-based

  items.forEach((item) => {
    let col = 0;

    const write = (value: any) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });

      // Get the original cell if it exists
      const originalCell = ws[cellAddress];

      if (originalCell) {
        // Preserve all original cell properties, only update the value
        const preservedCell = { ...originalCell };
        preservedCell.v = value ?? "";

        // Update cell type based on value
        if (value !== null && value !== undefined && value !== "") {
          preservedCell.t = typeof value === "number" ? "n" : "s";
        } else {
          preservedCell.t = "s"; // Default to string for empty values
        }

        ws[cellAddress] = preservedCell;
      } else {
        // Create new cell if original doesn't exist
        ws[cellAddress] = {
          t: typeof value === "number" ? "n" : "s",
          v: value ?? ""
        };
      }

      col++;
    };

    // Global properties
    write(item.labelLengthMm);
    write(item.labelHeightMm);
    write(item.labelThicknessMm);
    write(item.labelColourBackground);
    write(item.textColour);
    write(item.labelQuantity);
    write(item.style);
    write(item.noOfHoles);
    write(item.holeSizeMm);
    write(item.holeDistanceMm);

    // Lines 1–8 (4 fields per line)
    for (let i = 0; i < 8; i++) {
      const line = item.lines[i] ?? {
        text: "",
        textSizeMm: 0,
        spacingTopMm: 0,
        spacingLeftMm: 0,
      };

      write(line.text);
      write(line.textSizeMm);
      write(line.spacingTopMm);
      write(line.spacingLeftMm);
    }

    row++;
  });

  // Convert to Buffer for sending via route handler, preserving all formatting
  const wbout = XLSX.write(wb, {
    bookType: "xlsx",
    type: "buffer",
    bookSST: false,
    compression: true
  });
  return wbout as Buffer;
}