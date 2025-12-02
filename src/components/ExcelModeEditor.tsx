"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent, ClipboardEvent } from "react";
import { LabelSetup } from "@/components/LabelSetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExcelModeEditorProps {
  labelSetups: LabelSetup[];
  onUpdate: (setups: LabelSetup[]) => void;
  projectId: string;
}

type CellType = "text" | "number" | "select";

interface ColumnDef {
  key: string;
  label: string;
  width: string;
  type: CellType;
  options?: string[];
  getValue: (setup: LabelSetup, lineIndex?: number) => string | number;
  setValue: (setup: LabelSetup, value: string | number, lineIndex?: number) => LabelSetup;
  isLineField?: boolean;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "name",
    label: "Name",
    width: "w-32",
    type: "text",
    getValue: (setup) => setup.name || "",
    setValue: (setup, value) => ({ ...setup, name: String(value) }),
  },
  {
    key: "labelLengthMm",
    label: "Length",
    width: "w-20",
    type: "number",
    getValue: (setup) => setup.labelLengthMm,
    setValue: (setup, value) => ({ ...setup, labelLengthMm: Number(value) || 0 }),
  },
  {
    key: "labelHeightMm",
    label: "Height",
    width: "w-20",
    type: "number",
    getValue: (setup) => setup.labelHeightMm,
    setValue: (setup, value) => ({ ...setup, labelHeightMm: Number(value) || 0 }),
  },
  {
    key: "labelQuantity",
    label: "Qty",
    width: "w-16",
    type: "number",
    getValue: (setup) => setup.labelQuantity,
    setValue: (setup, value) => ({ ...setup, labelQuantity: Number(value) || 1 }),
  },
  {
    key: "labelThicknessMm",
    label: "Thickness",
    width: "w-24",
    type: "select",
    options: ["0.8", "1.6"],
    getValue: (setup) => String(setup.labelThicknessMm),
    setValue: (setup, value) => ({ ...setup, labelThicknessMm: Number(value) }),
  },
  {
    key: "labelColourBackground",
    label: "Background",
    width: "w-28",
    type: "select",
    options: ["WHITE", "BLACK", "RED", "BLUE", "GREEN", "YELLOW"],
    getValue: (setup) => setup.labelColourBackground,
    setValue: (setup, value) => ({ ...setup, labelColourBackground: String(value) }),
  },
  {
    key: "textColour",
    label: "Text Color",
    width: "w-28",
    type: "select",
    options: ["BLACK", "WHITE", "RED", "BLUE", "GREEN", "YELLOW"],
    getValue: (setup) => setup.textColour,
    setValue: (setup, value) => ({ ...setup, textColour: String(value) }),
  },
  {
    key: "style",
    label: "Style",
    width: "w-28",
    type: "select",
    options: ["Adhesive", "Non Adhesive"],
    getValue: (setup) => setup.style,
    setValue: (setup, value) => ({ ...setup, style: String(value) }),
  },
  {
    key: "noOfHoles",
    label: "Holes",
    width: "w-16",
    type: "number",
    getValue: (setup) => setup.noOfHoles,
    setValue: (setup, value) => ({ ...setup, noOfHoles: Number(value) || 0 }),
  },
  {
    key: "holeSizeMm",
    label: "Hole Size",
    width: "w-20",
    type: "number",
    getValue: (setup) => setup.holeSizeMm,
    setValue: (setup, value) => ({ ...setup, holeSizeMm: Number(value) || 0 }),
  },
  {
    key: "holeDistanceMm",
    label: "Hole Dist",
    width: "w-20",
    type: "number",
    getValue: (setup) => setup.holeDistanceMm,
    setValue: (setup, value) => ({ ...setup, holeDistanceMm: Number(value) || 0 }),
  },
];

const LINE_COLUMNS: ColumnDef[] = [
  {
    key: "text",
    label: "Text",
    width: "w-40",
    type: "text",
    isLineField: true,
    getValue: (setup, lineIndex) => setup.lines[lineIndex!]?.text || "",
    setValue: (setup, value, lineIndex) => ({
      ...setup,
      lines: setup.lines.map((line, i) => i === lineIndex ? { ...line, text: String(value) } : line),
    }),
  },
  {
    key: "textSizeMm",
    label: "Size",
    width: "w-16",
    type: "number",
    isLineField: true,
    getValue: (setup, lineIndex) => setup.lines[lineIndex!]?.textSizeMm || 0,
    setValue: (setup, value, lineIndex) => ({
      ...setup,
      lines: setup.lines.map((line, i) => i === lineIndex ? { ...line, textSizeMm: Number(value) || 0 } : line),
    }),
  },
];

interface CellPosition {
  rowIndex: number;
  colIndex: number;
  lineIndex?: number;
}

export default function ExcelModeEditor({ labelSetups, onUpdate, projectId }: ExcelModeEditorProps) {
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [quickEditMode, setQuickEditMode] = useState(true); // Single click to edit
  
  // Fill handle drag state
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [fillDragStart, setFillDragStart] = useState<CellPosition | null>(null);
  const [fillDragEnd, setFillDragEnd] = useState<number | null>(null); // target row index
  
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allColumns = [...COLUMNS, ...LINE_COLUMNS];
  const totalMainCols = COLUMNS.length;

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const startEditing = useCallback((pos: CellPosition) => {
    const col = pos.colIndex < totalMainCols ? COLUMNS[pos.colIndex] : LINE_COLUMNS[pos.colIndex - totalMainCols];
    const setup = labelSetups[pos.rowIndex];
    const value = col.getValue(setup, pos.lineIndex);
    setEditingCell(pos);
    setEditValue(String(value));
  }, [labelSetups, totalMainCols]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    
    const col = editingCell.colIndex < totalMainCols 
      ? COLUMNS[editingCell.colIndex] 
      : LINE_COLUMNS[editingCell.colIndex - totalMainCols];
    
    const updatedSetups = [...labelSetups];
    updatedSetups[editingCell.rowIndex] = col.setValue(
      updatedSetups[editingCell.rowIndex],
      editValue,
      editingCell.lineIndex
    );
    
    onUpdate(updatedSetups);
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, labelSetups, onUpdate, totalMainCols]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const navigateCell = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (!activeCell) return;

    let newRow = activeCell.rowIndex;
    let newCol = activeCell.colIndex;
    let newLineIndex = activeCell.lineIndex;

    const isInLineColumns = activeCell.colIndex >= totalMainCols;
    const currentSetup = labelSetups[activeCell.rowIndex];
    const maxLineIndex = currentSetup?.lines.length - 1 || 0;

    switch (direction) {
      case "up":
        if (isInLineColumns && newLineIndex !== undefined && newLineIndex > 0) {
          newLineIndex--;
        } else if (newRow > 0) {
          newRow--;
          if (isInLineColumns) {
            newLineIndex = labelSetups[newRow]?.lines.length - 1 || 0;
          }
        }
        break;
      case "down":
        if (isInLineColumns && newLineIndex !== undefined && newLineIndex < maxLineIndex) {
          newLineIndex++;
        } else if (newRow < labelSetups.length - 1) {
          newRow++;
          if (isInLineColumns) {
            newLineIndex = 0;
          }
        }
        break;
      case "left":
        if (newCol > 0) {
          newCol--;
          if (newCol < totalMainCols) {
            newLineIndex = undefined;
          } else if (newLineIndex === undefined) {
            newLineIndex = 0;
          }
        }
        break;
      case "right":
        if (newCol < allColumns.length - 1) {
          newCol++;
          if (newCol >= totalMainCols && newLineIndex === undefined) {
            newLineIndex = 0;
          }
        }
        break;
    }

    setActiveCell({ rowIndex: newRow, colIndex: newCol, lineIndex: newLineIndex });
  }, [activeCell, labelSetups, totalMainCols, allColumns.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingCell) {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          commitEdit();
          navigateCell("down");
          break;
        case "Tab":
          e.preventDefault();
          commitEdit();
          navigateCell(e.shiftKey ? "left" : "right");
          break;
        case "Escape":
          e.preventDefault();
          cancelEdit();
          break;
      }
      return;
    }

    if (!activeCell) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        navigateCell("up");
        break;
      case "ArrowDown":
        e.preventDefault();
        navigateCell("down");
        break;
      case "ArrowLeft":
        e.preventDefault();
        navigateCell("left");
        break;
      case "ArrowRight":
        e.preventDefault();
        navigateCell("right");
        break;
      case "Tab":
        e.preventDefault();
        navigateCell(e.shiftKey ? "left" : "right");
        break;
      case "Enter":
      case "F2":
        e.preventDefault();
        startEditing(activeCell);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        const col = activeCell.colIndex < totalMainCols 
          ? COLUMNS[activeCell.colIndex] 
          : LINE_COLUMNS[activeCell.colIndex - totalMainCols];
        const updatedSetups = [...labelSetups];
        updatedSetups[activeCell.rowIndex] = col.setValue(
          updatedSetups[activeCell.rowIndex],
          col.type === "number" ? 0 : "",
          activeCell.lineIndex
        );
        onUpdate(updatedSetups);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setEditingCell(activeCell);
          setEditValue(e.key);
        }
    }
  }, [activeCell, editingCell, commitEdit, cancelEdit, navigateCell, startEditing, labelSetups, onUpdate, totalMainCols]);

  const handleCopy = useCallback(() => {
    if (selectedRows.size > 0) {
      const rowsToCopy = labelSetups.filter((_, i) => selectedRows.has(i));
      const tsvData = rowsToCopy.map(setup => {
        const mainValues = COLUMNS.map(col => col.getValue(setup));
        const lineValues = setup.lines.map(line => `${line.text}|${line.textSizeMm}`).join(";");
        return [...mainValues, lineValues].join("\t");
      }).join("\n");
      
      navigator.clipboard.writeText(tsvData);
      toast.success(`Copied ${rowsToCopy.length} row(s)`);
    } else if (activeCell) {
      const col = activeCell.colIndex < totalMainCols 
        ? COLUMNS[activeCell.colIndex] 
        : LINE_COLUMNS[activeCell.colIndex - totalMainCols];
      const value = col.getValue(labelSetups[activeCell.rowIndex], activeCell.lineIndex);
      navigator.clipboard.writeText(String(value));
      toast.success("Copied cell value");
    }
  }, [selectedRows, labelSetups, activeCell, totalMainCols]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split("\n").filter(row => row.trim());
      
      if (rows.length === 0) return;

      if (rows[0].includes("\t")) {
        const newSetups = rows.map(row => {
          const values = row.split("\t");
          const setup: LabelSetup = {
            projectId,
            name: values[0] || "",
            labelLengthMm: Number(values[1]) || 50,
            labelHeightMm: Number(values[2]) || 20,
            labelQuantity: Number(values[3]) || 1,
            labelThicknessMm: Number(values[4]) || 0.8,
            labelColourBackground: values[5] || "WHITE",
            textColour: values[6] || "BLACK",
            style: values[7] || "Adhesive",
            noOfHoles: Number(values[8]) || 0,
            holeSizeMm: Number(values[9]) || 0,
            holeDistanceMm: Number(values[10]) || 0,
            lines: [{ text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }],
          };

          if (values[11]) {
            const lineData = values[11].split(";");
            setup.lines = lineData.map(ld => {
              const [text, size] = ld.split("|");
              return { text: text || "", textSizeMm: Number(size) || 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" };
            });
          }

          return setup;
        });

        if (activeCell) {
          const updatedSetups = [...labelSetups];
          updatedSetups.splice(activeCell.rowIndex, 0, ...newSetups);
          onUpdate(updatedSetups);
        } else {
          onUpdate([...labelSetups, ...newSetups]);
        }
        toast.success(`Pasted ${newSetups.length} row(s)`);
      } else if (activeCell) {
        const col = activeCell.colIndex < totalMainCols 
          ? COLUMNS[activeCell.colIndex] 
          : LINE_COLUMNS[activeCell.colIndex - totalMainCols];
        const updatedSetups = [...labelSetups];
        updatedSetups[activeCell.rowIndex] = col.setValue(
          updatedSetups[activeCell.rowIndex],
          text.trim(),
          activeCell.lineIndex
        );
        onUpdate(updatedSetups);
        toast.success("Pasted cell value");
      }
    } catch {
      toast.error("Failed to paste from clipboard");
    }
  }, [activeCell, labelSetups, onUpdate, projectId, totalMainCols]);

  const handleClipboardEvent = useCallback((e: ClipboardEvent) => {
    if (e.type === "copy") {
      e.preventDefault();
      handleCopy();
    } else if (e.type === "paste") {
      e.preventDefault();
      handlePaste();
    }
  }, [handleCopy, handlePaste]);

  const addRow = useCallback((afterIndex?: number) => {
    const newSetup: LabelSetup = {
      projectId,
      name: "",
      labelLengthMm: 50,
      labelHeightMm: 20,
      labelQuantity: 1,
      labelThicknessMm: 0.8,
      labelColourBackground: "WHITE",
      textColour: "BLACK",
      style: "Adhesive",
      noOfHoles: 0,
      holeSizeMm: 0,
      holeDistanceMm: 0,
      lines: [{ text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }],
    };

    const updatedSetups = [...labelSetups];
    if (afterIndex !== undefined) {
      updatedSetups.splice(afterIndex + 1, 0, newSetup);
    } else {
      updatedSetups.push(newSetup);
    }
    onUpdate(updatedSetups);
    toast.success("Row added");
  }, [labelSetups, onUpdate, projectId]);

  const deleteRows = useCallback((indices: number[]) => {
    const updatedSetups = labelSetups.filter((_, i) => !indices.includes(i));
    onUpdate(updatedSetups);
    setSelectedRows(new Set());
    toast.success(`Deleted ${indices.length} row(s)`);
  }, [labelSetups, onUpdate]);

  const duplicateRow = useCallback((index: number) => {
    const setup = labelSetups[index];
    const duplicated = {
      ...setup,
      name: setup.name ? `${setup.name} (Copy)` : "",
      lines: setup.lines.map(line => ({ ...line })),
    };
    const updatedSetups = [...labelSetups];
    updatedSetups.splice(index + 1, 0, duplicated);
    onUpdate(updatedSetups);
    toast.success("Row duplicated");
  }, [labelSetups, onUpdate]);

  const addLineToSetup = useCallback((setupIndex: number) => {
    const updatedSetups = [...labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: [...updatedSetups[setupIndex].lines, { text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }],
    };
    onUpdate(updatedSetups);
    setExpandedRows(prev => new Set([...prev, setupIndex]));
  }, [labelSetups, onUpdate]);

  const deleteLineFromSetup = useCallback((setupIndex: number, lineIndex: number) => {
    const setup = labelSetups[setupIndex];
    if (setup.lines.length <= 1) {
      toast.error("Cannot delete the last line");
      return;
    }
    const updatedSetups = [...labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: updatedSetups[setupIndex].lines.filter((_, i) => i !== lineIndex),
    };
    onUpdate(updatedSetups);
  }, [labelSetups, onUpdate]);

  const toggleRowExpand = useCallback((index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleRowSelection = useCallback((index: number, multi: boolean) => {
    setSelectedRows(prev => {
      const next = new Set(multi ? prev : []);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Auto-increment logic: detects patterns like "Label 1" -> "Label 2", or just numbers
  const getIncrementedValue = useCallback((baseValue: string | number, increment: number): string | number => {
    const strValue = String(baseValue);
    
    // Check if it's a pure number
    if (!isNaN(Number(baseValue)) && strValue.trim() !== "") {
      return Number(baseValue) + increment;
    }
    
    // Check for text ending with a number (e.g., "Label 1", "Item-001", "Test_10")
    const match = strValue.match(/^(.*?)(\d+)(\D*)$/);
    if (match) {
      const [, prefix, numStr, suffix] = match;
      const num = parseInt(numStr, 10);
      const newNum = num + increment;
      // Preserve leading zeros
      const paddedNum = String(newNum).padStart(numStr.length, '0');
      return `${prefix}${paddedNum}${suffix}`;
    }
    
    // No pattern detected, just append the increment number
    if (strValue.trim() !== "") {
      return `${strValue} ${increment + 1}`;
    }
    
    return baseValue;
  }, []);

  // Handle fill drag start
  const handleFillDragStart = useCallback((pos: CellPosition) => {
    setIsFillDragging(true);
    setFillDragStart(pos);
    setFillDragEnd(pos.rowIndex);
  }, []);

  // Handle fill drag move (called on row hover during drag)
  const handleFillDragMove = useCallback((targetRowIndex: number) => {
    if (isFillDragging && fillDragStart) {
      // Only allow dragging down for now
      if (targetRowIndex >= fillDragStart.rowIndex) {
        setFillDragEnd(targetRowIndex);
      }
    }
  }, [isFillDragging, fillDragStart]);

  // Handle fill drag end - apply the fill
  const handleFillDragEnd = useCallback(() => {
    if (!isFillDragging || !fillDragStart || fillDragEnd === null) {
      setIsFillDragging(false);
      setFillDragStart(null);
      setFillDragEnd(null);
      return;
    }

    const startRow = fillDragStart.rowIndex;
    const endRow = fillDragEnd;
    const colIndex = fillDragStart.colIndex;
    const lineIndex = fillDragStart.lineIndex;

    if (endRow <= startRow) {
      setIsFillDragging(false);
      setFillDragStart(null);
      setFillDragEnd(null);
      return;
    }

    const col = colIndex < totalMainCols 
      ? COLUMNS[colIndex] 
      : LINE_COLUMNS[colIndex - totalMainCols];
    
    const baseValue = col.getValue(labelSetups[startRow], lineIndex);
    const updatedSetups = [...labelSetups];

    for (let i = startRow + 1; i <= endRow; i++) {
      const increment = i - startRow;
      const newValue = getIncrementedValue(baseValue, increment);
      updatedSetups[i] = col.setValue(updatedSetups[i], newValue, lineIndex);
    }

    onUpdate(updatedSetups);
    toast.success(`Filled ${endRow - startRow} cell(s)`);

    setIsFillDragging(false);
    setFillDragStart(null);
    setFillDragEnd(null);
  }, [isFillDragging, fillDragStart, fillDragEnd, labelSetups, onUpdate, totalMainCols, getIncrementedValue]);

  // Global mouse up handler for fill drag
  useEffect(() => {
    const handleMouseUp = () => {
      if (isFillDragging) {
        handleFillDragEnd();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isFillDragging, handleFillDragEnd]);

  const renderCell = (setup: LabelSetup, col: ColumnDef, rowIndex: number, colIndex: number, lineIndex?: number) => {
    const isActive = activeCell?.rowIndex === rowIndex && 
                     activeCell?.colIndex === colIndex && 
                     activeCell?.lineIndex === lineIndex;
    const isEditing = editingCell?.rowIndex === rowIndex && 
                      editingCell?.colIndex === colIndex && 
                      editingCell?.lineIndex === lineIndex;

    const value = col.getValue(setup, lineIndex);

    if (isEditing) {
      if (col.type === "select") {
        return (
          <Select
            value={editValue}
            onValueChange={(val) => {
              setEditValue(val);
              const updatedSetups = [...labelSetups];
              updatedSetups[rowIndex] = col.setValue(updatedSetups[rowIndex], val, lineIndex);
              onUpdate(updatedSetups);
              setEditingCell(null);
            }}
            open={true}
          >
            <SelectTrigger className="h-7 text-xs border-0 focus:ring-2 focus:ring-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {col.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
              navigateCell("down");
            } else if (e.key === "Tab") {
              e.preventDefault();
              commitEdit();
              navigateCell(e.shiftKey ? "left" : "right");
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          className="h-7 text-xs border-0 focus:ring-2 focus:ring-primary px-1"
          type={col.type === "number" ? "number" : "text"}
          step={col.type === "number" ? "0.1" : undefined}
        />
      );
    }

    // Check if this cell is in the fill range
    const isInFillRange = isFillDragging && 
                          fillDragStart && 
                          fillDragEnd !== null &&
                          fillDragStart.colIndex === colIndex &&
                          fillDragStart.lineIndex === lineIndex &&
                          rowIndex > fillDragStart.rowIndex && 
                          rowIndex <= fillDragEnd;

    return (
      <div
        className={cn(
          "h-7 px-1 flex items-center text-xs cursor-cell truncate relative",
          isActive && "ring-2 ring-primary ring-inset bg-primary/5",
          isInFillRange && "bg-primary/20 ring-1 ring-primary/50 ring-inset"
        )}
        onClick={() => {
          if (quickEditMode) {
            setActiveCell({ rowIndex, colIndex, lineIndex });
            startEditing({ rowIndex, colIndex, lineIndex });
          } else {
            setActiveCell({ rowIndex, colIndex, lineIndex });
          }
        }}
        onDoubleClick={() => {
          if (!quickEditMode) {
            startEditing({ rowIndex, colIndex, lineIndex });
          }
        }}
        onMouseEnter={() => {
          if (isFillDragging) {
            handleFillDragMove(rowIndex);
          }
        }}
      >
        {col.type === "select" && (col.key === "labelColourBackground" || col.key === "textColour") ? (
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded border" 
              style={{ backgroundColor: String(value).toLowerCase() }} 
            />
            <span>{value}</span>
          </div>
        ) : (
          value
        )}
        {/* Fill handle - small square at bottom-right corner */}
        {isActive && !editingCell && (
          <div
            className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary cursor-crosshair z-10 hover:bg-primary/80"
            style={{ transform: 'translate(50%, 50%)' }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFillDragStart({ rowIndex, colIndex, lineIndex });
            }}
            title="Drag to fill"
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={tableRef}
      className="border rounded-lg overflow-hidden bg-card focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onCopy={handleClipboardEvent}
      onPaste={handleClipboardEvent}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        <Button size="sm" variant="outline" onClick={() => addRow()}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Row
        </Button>
        {selectedRows.size > 0 && (
          <>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy ({selectedRows.size})
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteRows([...selectedRows])}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedRows.size})
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={handlePaste}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Paste
        </Button>
        <div className="flex-1" />
        {/* Quick Edit Toggle */}
        <button
          onClick={() => setQuickEditMode(!quickEditMode)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
            quickEditMode 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
          title={quickEditMode ? "Quick Edit: ON (single click to edit)" : "Quick Edit: OFF (double click to edit)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Quick Edit {quickEditMode ? "ON" : "OFF"}
        </button>
        <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-full ml-2">
          <span className="text-xs text-muted-foreground">Total Qty:</span>
          <span className="text-xs font-semibold text-primary">
            {labelSetups.reduce((sum, setup) => sum + (Number(setup.labelQuantity) || 0), 0)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="w-8 px-1 py-2 text-left font-medium text-xs border-r">
                <input
                  type="checkbox"
                  checked={selectedRows.size === labelSetups.length && labelSetups.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(labelSetups.map((_, i) => i)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="w-8 px-1 py-2 text-left font-medium text-xs border-r">#</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className={cn("px-1 py-2 text-left font-medium text-xs border-r", col.width)}>
                  {col.label}
                </th>
              ))}
              <th className="px-1 py-2 text-left font-medium text-xs border-r w-8">Lines</th>
              {LINE_COLUMNS.map((col) => (
                <th key={col.key} className={cn("px-1 py-2 text-left font-medium text-xs border-r", col.width)}>
                  {col.label}
                </th>
              ))}
              <th className="w-16 px-1 py-2 text-left font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {labelSetups.map((setup, rowIndex) => {
              const isExpanded = expandedRows.has(rowIndex);
              const lineCount = setup.lines.length;

              return (
                <ContextMenu key={rowIndex}>
                  <ContextMenuTrigger asChild>
                    <tr
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors",
                        selectedRows.has(rowIndex) && "bg-primary/10",
                        isFillDragging && fillDragStart && fillDragEnd !== null && 
                          rowIndex > fillDragStart.rowIndex && rowIndex <= fillDragEnd && "bg-primary/10"
                      )}
                      onMouseEnter={() => {
                        if (isFillDragging) {
                          handleFillDragMove(rowIndex);
                        }
                      }}
                    >
                      <td className="px-1 py-1 border-r">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowIndex)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowSelection(rowIndex, e.shiftKey);
                          }}
                          onChange={() => {}}
                          className="rounded"
                        />
                      </td>
                      <td className="px-1 py-1 text-xs text-muted-foreground border-r font-mono">
                        {rowIndex + 1}
                      </td>
                      {COLUMNS.map((col, colIndex) => (
                        <td key={col.key} className={cn("px-0 py-0 border-r", col.width)}>
                          {renderCell(setup, col, rowIndex, colIndex)}
                        </td>
                      ))}
                      <td className="px-1 py-1 border-r">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleRowExpand(rowIndex)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <svg
                              className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {lineCount}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addLineToSetup(rowIndex);
                            }}
                            className="p-0.5 hover:bg-primary/10 rounded text-primary"
                            title="Add Line"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      {LINE_COLUMNS.map((col, colIndex) => (
                        <td key={col.key} className={cn("px-0 py-0 border-r", col.width)}>
                          {renderCell(setup, col, rowIndex, colIndex + totalMainCols, 0)}
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => duplicateRow(rowIndex)}
                            className="p-1 hover:bg-muted rounded"
                            title="Duplicate"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteRows([rowIndex])}
                            className="p-1 hover:bg-destructive/10 rounded text-destructive"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => addRow(rowIndex)}>
                      Insert Row Below
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => duplicateRow(rowIndex)}>
                      Duplicate Row
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => addLineToSetup(rowIndex)}>
                      Add Line
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={handleCopy}>
                      Copy
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handlePaste}>
                      Paste
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => deleteRows([rowIndex])} className="text-destructive">
                      Delete Row
                    </ContextMenuItem>
                  </ContextMenuContent>

                  {/* Expanded lines */}
                  {isExpanded && (
                    <>
                      {setup.lines.slice(1).map((_, lineIdx) => {
                        const actualLineIndex = lineIdx + 1;
                        return (
                          <tr key={`${rowIndex}-line-${actualLineIndex}`} className="border-b bg-muted/10">
                            <td className="px-1 py-1 border-r" />
                            <td className="px-1 py-1 text-xs text-muted-foreground border-r" />
                            {COLUMNS.map((col) => (
                              <td key={col.key} className="px-1 py-1 border-r" />
                            ))}
                            <td className="px-1 py-1 border-r text-xs text-muted-foreground">
                              L{actualLineIndex + 1}
                            </td>
                            {LINE_COLUMNS.map((col, colIndex) => (
                              <td key={col.key} className={cn("px-0 py-0 border-r", col.width)}>
                                {renderCell(setup, col, rowIndex, colIndex + totalMainCols, actualLineIndex)}
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              <button
                                onClick={() => deleteLineFromSetup(rowIndex, actualLineIndex)}
                                className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                title="Delete Line"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Add Line row */}
                      <tr key={`${rowIndex}-add-line`} className="border-b bg-muted/5 hover:bg-muted/20">
                        <td className="px-1 py-1 border-r" />
                        <td className="px-1 py-1 border-r" />
                        {COLUMNS.map((col) => (
                          <td key={col.key} className="px-1 py-1 border-r" />
                        ))}
                        <td className="px-1 py-1 border-r">
                          <button
                            onClick={() => addLineToSetup(rowIndex)}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                        </td>
                        <td colSpan={LINE_COLUMNS.length} className="px-1 py-1 border-r text-xs text-muted-foreground">
                          Click to add new line
                        </td>
                        <td className="px-1 py-1" />
                      </tr>
                    </>
                  )}
                </ContextMenu>
              );
            })}
            {labelSetups.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + LINE_COLUMNS.length + 4} className="text-center py-8 text-muted-foreground">
                  No setups yet. Click &quot;Add Row&quot; or paste from Excel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
