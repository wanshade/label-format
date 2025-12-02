"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LabelSetupWizard, { LabelSetup } from "@/components/LabelSetupWizard";
import AddLineModal from "@/components/AddLineModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalProjectData {
  project: Project;
  labelSetups: LabelSetup[];
  isSaved: boolean;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [projectData, setProjectData] = useState<LocalProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [editingLine, setEditingLine] = useState<{ setupIndex: number; lineIndex: number } | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingColor, setEditingColor] = useState<{ setupIndex: number; type: 'background' | 'text' | 'style' | 'thickness' | 'size' | 'quantity' | 'lineSize'; lineIndex?: number } | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [modalSetupIndex, setModalSetupIndex] = useState<number | null>(null);
  const [deleteSetupIndex, setDeleteSetupIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const localData = localStorage.getItem(`project-${projectId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          setProjectData(parsed);
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const project = await response.json();
          const setupsResponse = await fetch(`/api/label-setups?projectId=${projectId}`);
          const labelSetups = setupsResponse.ok ? await setupsResponse.json() : [];

          setProjectData({
            project,
            labelSetups,
            isSaved: true,
          });
        } else {
          setError("Project not found");
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectData) {
      localStorage.setItem(`project-${projectId}`, JSON.stringify(projectData));
    }
  }, [projectData, projectId]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('input, select, button') || target.closest('.inline-editor')) {
        return;
      }
      if (editingColor !== null) {
        setEditingColor(null);
      }
      if (editingLine !== null) {
        setEditingLine(null);
        setEditingText("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingColor, editingLine]);

  const addLabelSetup = () => {
    setEditingIndex(null);
    setShowLabelForm(true);
  };

  const updateLabelSetup = (index: number) => {
    setEditingIndex(index);
    setShowLabelForm(true);
  };

  const deleteLabelSetup = () => {
    if (!projectData || deleteSetupIndex === null) return;
    setProjectData({
      ...projectData,
      labelSetups: projectData.labelSetups.filter((_, i) => i !== deleteSetupIndex),
      isSaved: false,
    });
    setDeleteSetupIndex(null);
  };

  const copyLabelSetup = (index: number) => {
    if (!projectData) return;
    const setupToCopy = projectData.labelSetups[index];
    const copiedSetup = {
      ...setupToCopy,
      name: setupToCopy.name ? `${setupToCopy.name} (Copy)` : undefined,
      lines: setupToCopy.lines.map(line => ({ ...line })),
    };

    setProjectData({
      ...projectData,
      labelSetups: [
        ...projectData.labelSetups.slice(0, index + 1),
        copiedSetup,
        ...projectData.labelSetups.slice(index + 1)
      ],
      isSaved: false,
    });
  };

  const handleLabelSetupSave = (labelSetup: LabelSetup) => {
    if (!projectData) return;
    const completeSetup = { ...labelSetup, projectId };
    const updatedLabelSetups = [...projectData.labelSetups];
    if (editingIndex !== null) {
      updatedLabelSetups[editingIndex] = completeSetup;
    } else {
      updatedLabelSetups.push(completeSetup);
    }

    setProjectData({
      ...projectData,
      labelSetups: updatedLabelSetups,
      isSaved: false,
    });
    setShowLabelForm(false);
    setEditingIndex(null);
  };

  const handleLabelSetupCancel = () => {
    setShowLabelForm(false);
    setEditingIndex(null);
  };

  const toggleLineEdit = (setupIndex: number, lineIndex: number) => {
    if (editingLine?.setupIndex === setupIndex && editingLine?.lineIndex === lineIndex) {
      setEditingLine(null);
      setEditingText("");
    } else {
      if (projectData) {
        const currentText = projectData.labelSetups[setupIndex].lines[lineIndex].text || "";
        setEditingLine({ setupIndex, lineIndex });
        setEditingText(currentText);
      }
    }
  };

  const saveLineText = (setupIndex: number, lineIndex: number) => {
    if (!projectData || !editingLine) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: updatedSetups[setupIndex].lines.map((line, index) =>
        index === lineIndex ? { ...line, text: editingText } : line
      )
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
    setEditingLine(null);
    setEditingText("");
  };

  const updateColorSetup = (setupIndex: number, type: 'background' | 'text', color: string) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    if (type === 'background') {
      updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], labelColourBackground: color };
    } else {
      updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], textColour: color };
    }
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const updateStyleSetup = (setupIndex: number, style: string) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], style };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const updateThicknessSetup = (setupIndex: number, thickness: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], labelThicknessMm: parseFloat(thickness.toString()) || 0 };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const updateSizeSetup = (setupIndex: number, dimension: 'length' | 'height', value: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    if (dimension === 'length') {
      updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], labelLengthMm: parseFloat(value.toString()) || 0 };
    } else {
      updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], labelHeightMm: parseFloat(value.toString()) || 0 };
    }
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const updateQuantitySetup = (setupIndex: number, quantity: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], labelQuantity: parseInt(quantity.toString()) || 1 };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const updateLineTextSize = (setupIndex: number, lineIndex: number, textSize: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: updatedSetups[setupIndex].lines.map((line, index) =>
        index === lineIndex ? { ...line, textSizeMm: parseFloat(textSize.toString()) || 0 } : line
      )
    };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const deleteLine = (setupIndex: number, lineIndex: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    if (updatedSetups[setupIndex].lines.length > 1) {
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        lines: updatedSetups[setupIndex].lines.filter((_, index) => index !== lineIndex)
      };
      setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
    }
  };

  const copyLine = (setupIndex: number, lineIndex: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    const lineToCopy = updatedSetups[setupIndex].lines[lineIndex];
    const copiedLine = { ...lineToCopy, text: lineToCopy.text ? `${lineToCopy.text} (Copy)` : "" };
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: [
        ...updatedSetups[setupIndex].lines.slice(0, lineIndex + 1),
        copiedLine,
        ...updatedSetups[setupIndex].lines.slice(lineIndex + 1)
      ],
    };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const addQuickLine = (setupIndex: number) => {
    setModalSetupIndex(setupIndex);
    setShowAddLineModal(true);
  };

  const handleModalAddLine = (text: string, textSize: number) => {
    if (!projectData || modalSetupIndex === null) return;
    const updatedSetups = [...projectData.labelSetups];
    const newLine = { text: text.trim(), textSizeMm: textSize, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" };
    updatedSetups[modalSetupIndex] = {
      ...updatedSetups[modalSetupIndex],
      lines: [...updatedSetups[modalSetupIndex].lines, newLine],
    };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
    setShowAddLineModal(false);
    setModalSetupIndex(null);
  };

  const saveToDatabase = async () => {
    if (!projectData) return;
    setSaveLoading(true);
    setError("");

    try {
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectData.project.name, description: projectData.project.description }),
      });

      if (!projectResponse.ok) throw new Error("Failed to save project");

      const existingSetupsResponse = await fetch(`/api/label-setups?projectId=${projectId}`);
      if (existingSetupsResponse.ok) {
        const existingSetups = await existingSetupsResponse.json();
        await Promise.all(
          existingSetups.map((setup: any) => fetch(`/api/label-setups/${setup.id}`, { method: "DELETE" }))
        );
      }

      await Promise.all(
        projectData.labelSetups.map((setup) => {
          const sanitizedSetup = {
            ...setup,
            projectId,
            name: setup.name || "",
            labelLengthMm: parseFloat(setup.labelLengthMm as any) || 0,
            labelHeightMm: parseFloat(setup.labelHeightMm as any) || 0,
            labelThicknessMm: parseFloat(setup.labelThicknessMm as any) || 0,
            labelQuantity: parseInt(setup.labelQuantity as any) || 1,
            noOfHoles: parseInt(setup.noOfHoles as any) || 0,
            holeSizeMm: parseFloat(setup.holeSizeMm as any) || 0,
            holeDistanceMm: parseFloat(setup.holeDistanceMm as any) || 0,
            lines: setup.lines.map(line => ({
              ...line,
              text: line.text || "",
              textSizeMm: parseFloat(line.textSizeMm as any) || 0,
              spacingTopMm: line.spacingTopMm || "AUTO",
              spacingLeftMm: line.spacingLeftMm || "AUTO",
            }))
          };
          return fetch("/api/label-setups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sanitizedSetup),
          });
        })
      );

      setProjectData({ ...projectData, isSaved: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save to database");
    } finally {
      setSaveLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch("/api/export/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelSetups: projectData?.labelSetups || [], projectName: projectData?.project.name }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectData?.project.name || "Project"}-Export.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError("Failed to export to Excel");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="text-center py-16">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error || "Project not found"}</AlertDescription>
        </Alert>
        <Button variant="link" asChild className="mt-4">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/dashboard">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{projectData.project.name}</h1>
            {projectData.project.description && (
              <p className="text-muted-foreground mt-1">{projectData.project.description}</p>
            )}
            {!projectData.isSaved && (
              <Badge variant="outline" className="mt-2 text-amber-600 border-amber-300 bg-amber-50">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </Button>
            <Button onClick={saveToDatabase} disabled={saveLoading || projectData.isSaved}>
              {saveLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : projectData.isSaved ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Database
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Label Setups</h2>
            <p className="text-sm text-muted-foreground">{projectData.labelSetups.length} setup{projectData.labelSetups.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={addLabelSetup}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Label Setup
          </Button>
        </div>

        {projectData.labelSetups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No label setups yet</h3>
              <p className="text-muted-foreground mb-6">Add your first label setup to get started</p>
              <Button onClick={addLabelSetup}>Add Your First Label Setup</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {projectData.labelSetups.map((labelSetup, setupIndex) => (
              <Card key={setupIndex} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{labelSetup.name || `Label Setup ${setupIndex + 1}`}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">
                          {editingColor?.setupIndex === setupIndex && editingColor?.type === 'size' ? (
                            <div className="inline-flex items-center gap-1 inline-editor" onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="number"
                                value={labelSetup.labelLengthMm}
                                onChange={(e) => updateSizeSetup(setupIndex, 'length', parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingColor(null); }}
                                className="w-14 h-6 text-xs"
                                step="0.1"
                                min="1"
                                autoFocus
                              />
                              <span>x</span>
                              <Input
                                type="number"
                                value={labelSetup.labelHeightMm}
                                onChange={(e) => updateSizeSetup(setupIndex, 'height', parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingColor(null); }}
                                className="w-14 h-6 text-xs"
                                step="0.1"
                                min="1"
                              />
                              <span>mm</span>
                            </div>
                          ) : (
                            <span className="cursor-pointer" onClick={() => setEditingColor({ setupIndex, type: 'size' })}>
                              {labelSetup.labelLengthMm} x {labelSetup.labelHeightMm} mm
                            </span>
                          )}
                        </Badge>
                        <Badge variant="secondary">
                          {editingColor?.setupIndex === setupIndex && editingColor?.type === 'quantity' ? (
                            <div className="inline-editor">
                              <Input
                                type="number"
                                value={labelSetup.labelQuantity}
                                onChange={(e) => updateQuantitySetup(setupIndex, parseInt(e.target.value) || 1)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingColor(null); }}
                                className="w-14 h-6 text-xs"
                                min="1"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className="cursor-pointer" onClick={() => setEditingColor({ setupIndex, type: 'quantity' })}>
                              Qty: {labelSetup.labelQuantity}
                            </span>
                          )}
                        </Badge>
                        <Badge variant="outline">{labelSetup.lines.length} line{labelSetup.lines.length !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => updateLabelSetup(setupIndex)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => copyLabelSetup(setupIndex)}>Copy</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteSetupIndex(setupIndex)}>Delete</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {labelSetup.lines.map((line, lineIndex) => (
                      <Card key={lineIndex} className="border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Line {lineIndex + 1}</Badge>
                              {editingColor?.setupIndex === setupIndex && editingColor?.type === 'lineSize' && editingColor?.lineIndex === lineIndex ? (
                                <div className="inline-editor inline-flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={line.textSizeMm}
                                    onChange={(e) => updateLineTextSize(setupIndex, lineIndex, parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingColor(null); }}
                                    className="w-12 h-5 text-xs"
                                    step="0.1"
                                    min="0.1"
                                    autoFocus
                                  />
                                  <span className="text-xs text-muted-foreground">mm</span>
                                </div>
                              ) : (
                                <span
                                  className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                                  onClick={() => setEditingColor({ setupIndex, type: 'lineSize', lineIndex })}
                                >
                                  {line.textSizeMm}mm
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyLine(setupIndex, lineIndex)}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </Button>
                              {labelSetup.lines.length > 1 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteLine(setupIndex, lineIndex)}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </div>

                          {editingLine?.setupIndex === setupIndex && editingLine?.lineIndex === lineIndex ? (
                            <div className="space-y-2">
                              <Input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                placeholder="Enter text for this line"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => saveLineText(setupIndex, lineIndex)}>Save</Button>
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => toggleLineEdit(setupIndex, lineIndex)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="min-h-[40px] p-3 bg-muted/50 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => toggleLineEdit(setupIndex, lineIndex)}
                            >
                              {line.text || <span className="text-muted-foreground italic">Click to add text...</span>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Background:</span>
                        <Select value={labelSetup.labelColourBackground} onValueChange={(v) => updateColorSetup(setupIndex, 'background', v)}>
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: labelSetup.labelColourBackground.toLowerCase() }} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WHITE">White</SelectItem>
                            <SelectItem value="BLACK">Black</SelectItem>
                            <SelectItem value="RED">Red</SelectItem>
                            <SelectItem value="BLUE">Blue</SelectItem>
                            <SelectItem value="GREEN">Green</SelectItem>
                            <SelectItem value="YELLOW">Yellow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Text:</span>
                        <Select value={labelSetup.textColour} onValueChange={(v) => updateColorSetup(setupIndex, 'text', v)}>
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: labelSetup.textColour.toLowerCase() }} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BLACK">Black</SelectItem>
                            <SelectItem value="WHITE">White</SelectItem>
                            <SelectItem value="RED">Red</SelectItem>
                            <SelectItem value="BLUE">Blue</SelectItem>
                            <SelectItem value="GREEN">Green</SelectItem>
                            <SelectItem value="YELLOW">Yellow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Style:</span>
                        <Select value={labelSetup.style} onValueChange={(v) => updateStyleSetup(setupIndex, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Adhesive">Adhesive</SelectItem>
                            <SelectItem value="Non Adhesive">Non Adhesive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Thickness:</span>
                        <Select value={String(labelSetup.labelThicknessMm)} onValueChange={(v) => updateThicknessSetup(setupIndex, parseFloat(v))}>
                          <SelectTrigger className="w-20 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.8">0.8</SelectItem>
                            <SelectItem value="1.6">1.6</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => addQuickLine(setupIndex)}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Line
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddLineModal
          isOpen={showAddLineModal}
          onClose={() => setShowAddLineModal(false)}
          onAdd={handleModalAddLine}
        />

        {showLabelForm && (
          <LabelSetupWizard
            initialData={editingIndex !== null ? projectData.labelSetups[editingIndex] : undefined}
            projects={projects}
            onSave={handleLabelSetupSave}
            onCancel={handleLabelSetupCancel}
            editingIndex={editingIndex}
          />
        )}
      </div>

      <Dialog open={deleteSetupIndex !== null} onOpenChange={() => setDeleteSetupIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Label Setup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this label setup? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSetupIndex(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteLabelSetup}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
