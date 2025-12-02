import { DxfWriter, point3d, Units, Colors, MTextAttachmentPoint } from "@tarikjabiri/dxf";

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
  quantity: number;
}

interface DxfSheet {
  pageNumber: number;
  labels: PlacedLabel[];
}

const DEFAULT_SHEET: SheetConfig = {
  width: 600,
  height: 300,
  margin: 0,
  gap: 0,
};

// Arrange labels on sheets using simple row-based bin packing
function arrangeLabelsOnSheets(
  setups: LabelSetup[],
  sheet: SheetConfig = DEFAULT_SHEET
): DxfSheet[] {
  const sheets: DxfSheet[] = [];
  const usableWidth = sheet.width - 2 * sheet.margin;
  const usableHeight = sheet.height - 2 * sheet.margin;

  // Expand setups by quantity
  const allLabels: LabelSetup[] = [];
  for (const setup of setups) {
    const qty = setup.labelQuantity || 1;
    for (let i = 0; i < qty; i++) {
      allLabels.push(setup);
    }
  }

  let currentSheet: DxfSheet = { pageNumber: 1, labels: [] };
  let currentX = sheet.margin;
  let currentY = sheet.height - sheet.margin; // Start from top
  let rowHeight = 0;

  for (const label of allLabels) {
    const labelWidth = label.labelLengthMm;
    const labelHeight = label.labelHeightMm;

    // First label in row - set row height
    if (rowHeight === 0) {
      rowHeight = labelHeight;
    }

    // Check if label fits in current row
    if (currentX + labelWidth > sheet.width - sheet.margin) {
      // Move to next row (downward)
      currentX = sheet.margin;
      currentY -= rowHeight + sheet.gap;
      rowHeight = labelHeight;
    }

    // Check if label fits in current sheet (from top going down)
    if (currentY - labelHeight < sheet.margin) {
      // Save current sheet and start new one
      if (currentSheet.labels.length > 0) {
        sheets.push(currentSheet);
      }
      currentSheet = { pageNumber: sheets.length + 1, labels: [] };
      currentX = sheet.margin;
      currentY = sheet.height - sheet.margin; // Reset to top
      rowHeight = labelHeight;
    }

    // Check if single label is too big for sheet
    if (labelWidth > usableWidth || labelHeight > usableHeight) {
      console.warn(`Label ${label.name || 'unnamed'} (${labelWidth}x${labelHeight}mm) is too large for sheet (${usableWidth}x${usableHeight}mm)`);
      // Still place it, it will overflow
    }

    // Place label (Y is bottom-left corner, so subtract height from currentY)
    currentSheet.labels.push({
      setup: label,
      x: currentX,
      y: currentY - labelHeight,
      quantity: 1,
    });

    rowHeight = Math.max(rowHeight, labelHeight);
    currentX += labelWidth + sheet.gap;
  }

  // Add last sheet if it has labels
  if (currentSheet.labels.length > 0) {
    sheets.push(currentSheet);
  }

  return sheets;
}

// Estimate text width based on character count and height (approximate)
function estimateTextWidth(text: string, textHeight: number): number {
  // Calibri font width-to-height ratio is approximately 0.5-0.6
  const avgCharWidthRatio = 0.55;
  return text.length * textHeight * avgCharWidthRatio;
}

// Calculate text height to fit within available width
function calculateFitTextHeight(text: string, maxWidth: number, desiredHeight: number, padding: number = 2): number {
  const availableWidth = maxWidth - (padding * 2);
  const estimatedWidth = estimateTextWidth(text, desiredHeight);
  
  if (estimatedWidth <= availableWidth) {
    return desiredHeight; // Text fits, use desired height
  }
  
  // Scale down to fit
  const scaleFactor = availableWidth / estimatedWidth;
  const newHeight = desiredHeight * scaleFactor;
  
  // Minimum text height of 0.5mm
  return Math.max(0.5, newHeight);
}

// Generate DXF content for a single sheet
function generateSheetDxf(sheet: DxfSheet, sheetConfig: SheetConfig = DEFAULT_SHEET): string {
  const dxf = new DxfWriter();
  
  // Set units to millimeters
  dxf.setUnits(Units.Millimeters);

  // Add Calibri text style
  const calibriStyle = dxf.tables.styleTable.addStyle("CALIBRI");
  calibriStyle.fontFileName = "calibri.ttf";

  // Add layers
  dxf.addLayer("Cutting", Colors.Red);           // Outermost border - red (1)
  dxf.addLayer("Break", Colors.Cyan);             // Inner label outlines - cyan (4)
  dxf.addLayer("Holes", Colors.Red);             // Holes - red (1)
  dxf.addLayer("TEXT", Colors.Blue);             // Text - blue (5)

  // Draw sheet border (outermost - red)
  dxf.setCurrentLayerName("Cutting");
  dxf.addLine(point3d(0, 0), point3d(sheetConfig.width, 0));
  dxf.addLine(point3d(sheetConfig.width, 0), point3d(sheetConfig.width, sheetConfig.height));
  dxf.addLine(point3d(sheetConfig.width, sheetConfig.height), point3d(0, sheetConfig.height));
  dxf.addLine(point3d(0, sheetConfig.height), point3d(0, 0));

  // Draw each label
  for (const placedLabel of sheet.labels) {
    const { setup, x, y } = placedLabel;
    const width = setup.labelLengthMm;
    const height = setup.labelHeightMm;

    // Draw label outline (inner - cyan)
    dxf.setCurrentLayerName("Break");
    dxf.addLine(point3d(x, y), point3d(x + width, y));
    dxf.addLine(point3d(x + width, y), point3d(x + width, y + height));
    dxf.addLine(point3d(x + width, y + height), point3d(x, y + height));
    dxf.addLine(point3d(x, y + height), point3d(x, y));

    // Draw holes if specified
    if (setup.noOfHoles > 0 && setup.holeSizeMm > 0) {
      dxf.setCurrentLayerName("Holes");
      const holeRadius = setup.holeSizeMm / 2;
      const holeDistance = setup.holeDistanceMm || 5;

      if (setup.noOfHoles === 1) {
        // Single hole in center-left
        dxf.addCircle(point3d(x + holeDistance, y + height / 2), holeRadius);
      } else if (setup.noOfHoles === 2) {
        // Two holes on left and right (center vertically)
        dxf.addCircle(point3d(x + holeDistance, y + height / 2), holeRadius);
        dxf.addCircle(point3d(x + width - holeDistance, y + height / 2), holeRadius);
      } else if (setup.noOfHoles === 4) {
        // Four holes at each corner
        dxf.addCircle(point3d(x + holeDistance, y + holeDistance), holeRadius); // Bottom-left
        dxf.addCircle(point3d(x + width - holeDistance, y + holeDistance), holeRadius); // Bottom-right
        dxf.addCircle(point3d(x + holeDistance, y + height - holeDistance), holeRadius); // Top-left
        dxf.addCircle(point3d(x + width - holeDistance, y + height - holeDistance), holeRadius); // Top-right
      } else {
        // Other: evenly distributed horizontally in center
        const spacing = (width - 2 * holeDistance) / (setup.noOfHoles - 1);
        for (let i = 0; i < setup.noOfHoles; i++) {
          dxf.addCircle(point3d(x + holeDistance + i * spacing, y + height / 2), holeRadius);
        }
      }
    }

    // Draw text lines - centered horizontally and vertically
    dxf.setCurrentLayerName("TEXT");
    
    // Filter valid text lines
    const validLines = setup.lines.filter(line => line.text && line.text.trim() !== "");
    
    if (validLines.length > 0) {
      // Calculate total height needed for all text lines
      const lineSpacing = 1; // 1mm gap between lines
      const padding = 2; // 2mm padding from edges
      
      // Calculate heights for each line (with auto-compress)
      const lineData = validLines.map(line => {
        const desiredHeight = line.textSizeMm || 2;
        const fitHeight = calculateFitTextHeight(line.text, width, desiredHeight, padding);
        return { text: line.text, height: fitHeight };
      });
      
      const totalTextHeight = lineData.reduce((sum, ld) => sum + ld.height, 0) + 
                              (lineData.length - 1) * lineSpacing;
      
      // Calculate starting Y position to center all text vertically
      const centerX = x + width / 2;
      let currentY = y + (height + totalTextHeight) / 2;
      
      for (const ld of lineData) {
        currentY -= ld.height;
        
        // Add centered MTEXT with Calibri font (easier to edit in AutoCAD)
        const mtextEntity = dxf.addMText(
          point3d(centerX, currentY + ld.height / 2),
          ld.height,
          ld.text,
          {
            attachmentPoint: MTextAttachmentPoint.MiddleCenter,
            width: width - 4, // Text box width with padding
          }
        );
        mtextEntity.textStyle = "CALIBRI";
        
        currentY -= lineSpacing;
      }
    }

  }

  return dxf.stringify();
}

// Group key for separating by color/thickness
function getGroupKey(setup: LabelSetup): string {
  const text = setup.textColour || "Black";
  const bg = setup.labelColourBackground || "White";
  const thickness = setup.labelThicknessMm || 0.8;
  return `${text}|${bg}|${thickness}`;
}

// Main export function
export function generateDxfFiles(
  setups: LabelSetup[],
  projectName: string = "Project",
  sheetConfig: SheetConfig = DEFAULT_SHEET
): { filename: string; content: string }[] {
  const files: { filename: string; content: string }[] = [];

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
    const [textColour, bgColour, thicknessStr] = key.split("|");
    const thickness = parseFloat(thicknessStr);
    
    // Arrange labels for this group
    const sheets = arrangeLabelsOnSheets(groupSetups, sheetConfig);
    
    for (const sheet of sheets) {
      const dxfContent = generateSheetDxf(sheet, sheetConfig);
      // Format: MLA {textColour} on {bgColour} {thickness}mm {pageNumber}.dxf
      const pageNum = String(sheet.pageNumber).padStart(2, "0");
      const filename = `MLA ${textColour} on ${bgColour} ${thickness}mm ${pageNum}.dxf`;
      
      files.push({ filename, content: dxfContent });
    }
  }

  return files;
}

// Generate summary of sheet arrangement
export function getSheetSummary(
  setups: LabelSetup[],
  sheetConfig: SheetConfig = DEFAULT_SHEET
): { totalSheets: number; labelsPerSheet: number[]; totalLabels: number } {
  const sheets = arrangeLabelsOnSheets(setups, sheetConfig);
  return {
    totalSheets: sheets.length,
    labelsPerSheet: sheets.map(s => s.labels.length),
    totalLabels: sheets.reduce((sum, s) => sum + s.labels.length, 0),
  };
}

export { DEFAULT_SHEET, type SheetConfig, type LabelSetup as DxfLabelSetup };
