import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface LabelLine {
  text: string;
  textSizeMm: number;
  spacingTopMm: string | number;
  spacingLeftMm: string | number;
}

interface LabelSetup {
  name?: string;
  labelLengthMm: number;
  labelHeightMm: number;
  labelThicknessMm: number;
  labelColourBackground: string;
  textColour: string;
  labelQuantity: number;
  style: string;
  noOfHoles: number;
  holeSizeMm: number;
  holeDistanceMm: number;
  lines: LabelLine[];
}

interface SheetConfig {
  width: number;
  height: number;
  margin: number;
  gap: number;
}

interface PlacedLabel {
  setup: LabelSetup;
  x: number;
  y: number;
}

const DEFAULT_SHEET: SheetConfig = {
  width: 600,
  height: 300,
  margin: 0,
  gap: 0,
};

// MM to points conversion (1mm = 2.83465 points)
const MM_TO_PT = 2.83465;

function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

// Convert color name to RGB
function colorNameToRgb(colorName: string): { r: number; g: number; b: number } {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    white: { r: 1, g: 1, b: 1 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 1, g: 0, b: 0 },
    green: { r: 0, g: 0.5, b: 0 },
    blue: { r: 0, g: 0, b: 1 },
    yellow: { r: 1, g: 1, b: 0 },
    orange: { r: 1, g: 0.65, b: 0 },
    purple: { r: 0.5, g: 0, b: 0.5 },
    pink: { r: 1, g: 0.75, b: 0.8 },
    brown: { r: 0.6, g: 0.3, b: 0 },
    gray: { r: 0.5, g: 0.5, b: 0.5 },
    grey: { r: 0.5, g: 0.5, b: 0.5 },
    cyan: { r: 0, g: 1, b: 1 },
    magenta: { r: 1, g: 0, b: 1 },
    silver: { r: 0.75, g: 0.75, b: 0.75 },
    gold: { r: 1, g: 0.84, b: 0 },
    navy: { r: 0, g: 0, b: 0.5 },
    maroon: { r: 0.5, g: 0, b: 0 },
    olive: { r: 0.5, g: 0.5, b: 0 },
    teal: { r: 0, g: 0.5, b: 0.5 },
    lime: { r: 0, g: 1, b: 0 },
    aqua: { r: 0, g: 1, b: 1 },
    fuchsia: { r: 1, g: 0, b: 1 },
  };
  
  const normalized = colorName.toLowerCase().trim();
  return colors[normalized] || { r: 0, g: 0, b: 0 }; // Default to black
}

// Group key for separating by color/thickness/style
function getGroupKey(setup: LabelSetup): string {
  const text = setup.textColour || "Black";
  const bg = setup.labelColourBackground || "White";
  const thickness = setup.labelThicknessMm || 0.8;
  const style = setup.style || "Adhesive";
  return `${text}|${bg}|${thickness}|${style}`;
}

// Arrange labels on sheets (same logic as DXF)
function arrangeLabelsOnSheets(
  setups: LabelSetup[],
  sheet: SheetConfig = DEFAULT_SHEET
): PlacedLabel[][] {
  const sheets: PlacedLabel[][] = [];
  
  // Expand setups by quantity
  const allLabels: LabelSetup[] = [];
  for (const setup of setups) {
    const qty = setup.labelQuantity || 1;
    for (let i = 0; i < qty; i++) {
      allLabels.push(setup);
    }
  }

  let currentSheet: PlacedLabel[] = [];
  let currentX = sheet.margin;
  let currentY = sheet.height - sheet.margin;
  let rowHeight = 0;

  for (const label of allLabels) {
    const labelWidth = label.labelLengthMm;
    const labelHeight = label.labelHeightMm;

    if (rowHeight === 0) {
      rowHeight = labelHeight;
    }

    if (currentX + labelWidth > sheet.width - sheet.margin) {
      currentX = sheet.margin;
      currentY -= rowHeight + sheet.gap;
      rowHeight = labelHeight;
    }

    if (currentY - labelHeight < sheet.margin) {
      if (currentSheet.length > 0) {
        sheets.push(currentSheet);
      }
      currentSheet = [];
      currentX = sheet.margin;
      currentY = sheet.height - sheet.margin;
      rowHeight = labelHeight;
    }

    currentSheet.push({
      setup: label,
      x: currentX,
      y: currentY - labelHeight,
    });

    rowHeight = Math.max(rowHeight, labelHeight);
    currentX += labelWidth + sheet.gap;
  }

  if (currentSheet.length > 0) {
    sheets.push(currentSheet);
  }

  return sheets;
}

// Generate PDF for a single sheet
async function generateSheetPdf(
  labels: PlacedLabel[],
  sheetConfig: SheetConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const page = pdfDoc.addPage([mmToPt(sheetConfig.width), mmToPt(sheetConfig.height)]);
  const { height: pageHeight } = page.getSize();

  // Draw sheet border (black)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: mmToPt(sheetConfig.width),
    height: mmToPt(sheetConfig.height),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Draw each label
  for (const placedLabel of labels) {
    const { setup, x, y } = placedLabel;
    const width = setup.labelLengthMm;
    const height = setup.labelHeightMm;

    // pdf-lib uses bottom-left origin, same as our calculation
    const pdfX = mmToPt(x);
    const pdfY = mmToPt(y);

    // Get colors from setup
    const bgColor = colorNameToRgb(setup.labelColourBackground || "White");
    const txtColor = colorNameToRgb(setup.textColour || "Black");

    // Draw label with background fill and black border
    page.drawRectangle({
      x: pdfX,
      y: pdfY,
      width: mmToPt(width),
      height: mmToPt(height),
      color: rgb(bgColor.r, bgColor.g, bgColor.b),
      borderColor: rgb(0, 0, 0), // Black border
      borderWidth: 0.5,
    });

    // Draw holes if specified
    if (setup.noOfHoles > 0 && setup.holeSizeMm > 0) {
      const holeRadius = setup.holeSizeMm / 2;
      const holeDistance = setup.holeDistanceMm || 5;

      const drawHole = (hx: number, hy: number) => {
        page.drawCircle({
          x: mmToPt(hx),
          y: mmToPt(hy),
          size: mmToPt(holeRadius),
          borderColor: rgb(0, 0, 0), // Black holes
          borderWidth: 0.5,
        });
      };

      if (setup.noOfHoles === 1) {
        drawHole(x + holeDistance, y + height / 2);
      } else if (setup.noOfHoles === 2) {
        drawHole(x + holeDistance, y + height / 2);
        drawHole(x + width - holeDistance, y + height / 2);
      } else if (setup.noOfHoles === 4) {
        drawHole(x + holeDistance, y + holeDistance);
        drawHole(x + width - holeDistance, y + holeDistance);
        drawHole(x + holeDistance, y + height - holeDistance);
        drawHole(x + width - holeDistance, y + height - holeDistance);
      } else {
        const spacing = (width - 2 * holeDistance) / (setup.noOfHoles - 1);
        for (let i = 0; i < setup.noOfHoles; i++) {
          drawHole(x + holeDistance + i * spacing, y + height / 2);
        }
      }
    }

    // Draw text lines (centered)
    const validLines = setup.lines.filter(line => line.text && line.text.trim() !== "");
    
    if (validLines.length > 0) {
      const lineSpacing = 1;
      const padding = 2;
      
      // Calculate text heights
      const lineData: { text: string; height: number }[] = [];
      let totalTextHeight = 0;
      
      for (const line of validLines) {
        let textHeight = line.textSizeMm || 2;
        const estimatedWidth = line.text.length * textHeight * 0.5;
        if (estimatedWidth > width - padding * 2) {
          textHeight = (width - padding * 2) / (line.text.length * 0.5);
          textHeight = Math.max(0.5, textHeight);
        }
        lineData.push({ text: line.text, height: textHeight });
        totalTextHeight += textHeight;
      }
      totalTextHeight += (lineData.length - 1) * lineSpacing;

      // Draw text centered
      let textY = y + (height + totalTextHeight) / 2;
      
      for (const ld of lineData) {
        const fontSize = mmToPt(ld.height);
        const textWidth = font.widthOfTextAtSize(ld.text, fontSize);
        const textX = pdfX + (mmToPt(width) - textWidth) / 2;
        
        textY -= ld.height;
        
        page.drawText(ld.text, {
          x: textX,
          y: mmToPt(textY),
          size: fontSize,
          font,
          color: rgb(txtColor.r, txtColor.g, txtColor.b),
        });
        
        textY -= lineSpacing;
      }
    }

    // Draw size label at bottom (e.g., "50x20mm") - same color as text
    const sizeText = `${width}x${height}mm`;
    const sizeFontSize = mmToPt(1.5);
    const sizeWidth = font.widthOfTextAtSize(sizeText, sizeFontSize);
    
    page.drawText(sizeText, {
      x: pdfX + (mmToPt(width) - sizeWidth) / 2,
      y: pdfY + mmToPt(1),
      size: sizeFontSize,
      font,
      color: rgb(txtColor.r, txtColor.g, txtColor.b),
    });
  }

  return await pdfDoc.save();
}

// Main export function
export async function generatePdfFiles(
  setups: LabelSetup[],
  projectName: string = "Project",
  sheetConfig: SheetConfig = DEFAULT_SHEET
): Promise<{ filename: string; content: Uint8Array }[]> {
  const files: { filename: string; content: Uint8Array }[] = [];

  // Group setups by color/thickness
  const groups = new Map<string, LabelSetup[]>();
  for (const setup of setups) {
    const key = getGroupKey(setup);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(setup);
  }

  // Process each group separately
  for (const [key, groupSetups] of groups) {
    const [textColour, bgColour, thicknessStr, style] = key.split("|");
    const thickness = parseFloat(thicknessStr);
    
    const sheets = arrangeLabelsOnSheets(groupSetups, sheetConfig);
    
    for (let i = 0; i < sheets.length; i++) {
      const pdfContent = await generateSheetPdf(sheets[i], sheetConfig);
      
      const pageNum = String(i + 1).padStart(2, "0");
      const styleSuffix = style === "Non Adhesive" ? " Non AD" : "";
      const filename = `MLA ${textColour} on ${bgColour} ${thickness}mm${styleSuffix} ${pageNum}.pdf`;
      
      files.push({ filename, content: pdfContent });
    }
  }

  return files;
}

export { DEFAULT_SHEET as PDF_DEFAULT_SHEET, type SheetConfig as PdfSheetConfig };
