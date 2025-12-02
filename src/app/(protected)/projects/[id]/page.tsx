"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LabelSetup } from "@/components/LabelSetupWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [deleteSetupIndex, setDeleteSetupIndex] = useState<number | null>(null);
  const [collapsedSetups, setCollapsedSetups] = useState<Set<number>>(new Set());
  const newSetupNameRef = useRef<HTMLInputElement>(null);

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

          setProjectData({ project, labelSetups, isSaved: true });
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

    if (projectId) loadProject();
  }, [projectId]);

  useEffect(() => {
    if (projectData) {
      localStorage.setItem(`project-${projectId}`, JSON.stringify(projectData));
    }
  }, [projectData, projectId]);



  const toggleCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedSetups);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedSetups(newCollapsed);
  };

  const updateSetup = (setupIndex: number, updates: Partial<LabelSetup>) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = { ...updatedSetups[setupIndex], ...updates };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const updateLine = (setupIndex: number, lineIndex: number, field: string, value: any) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: updatedSetups[setupIndex].lines.map((line, idx) =>
        idx === lineIndex ? { ...line, [field]: value } : line
      )
    };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const addLine = (setupIndex: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: [...updatedSetups[setupIndex].lines, { text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }]
    };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const deleteLine = (setupIndex: number, lineIndex: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    if (updatedSetups[setupIndex].lines.length > 1) {
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        lines: updatedSetups[setupIndex].lines.filter((_, idx) => idx !== lineIndex)
      };
      setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
    }
  };

  const copyLine = (setupIndex: number, lineIndex: number) => {
    if (!projectData) return;
    const updatedSetups = [...projectData.labelSetups];
    const lineToCopy = updatedSetups[setupIndex].lines[lineIndex];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: [
        ...updatedSetups[setupIndex].lines.slice(0, lineIndex + 1),
        { ...lineToCopy },
        ...updatedSetups[setupIndex].lines.slice(lineIndex + 1)
      ]
    };
    setProjectData({ ...projectData, labelSetups: updatedSetups, isSaved: false });
  };

  const addLabelSetup = () => {
    if (!projectData) return;
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
      lines: [{ text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }]
    };
    setProjectData({
      ...projectData,
      labelSetups: [...projectData.labelSetups, newSetup],
      isSaved: false,
    });
    // Focus on the new setup name input after render
    setTimeout(() => newSetupNameRef.current?.focus(), 100);
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
      labelSetups: [...projectData.labelSetups.slice(0, index + 1), copiedSetup, ...projectData.labelSetups.slice(index + 1)],
      isSaved: false,
    });
    toast.success("Setup duplicated");
  };

  const deleteLabelSetup = () => {
    if (!projectData || deleteSetupIndex === null) return;
    setProjectData({
      ...projectData,
      labelSetups: projectData.labelSetups.filter((_, i) => i !== deleteSetupIndex),
      isSaved: false,
    });
    setDeleteSetupIndex(null);
    toast.success("Setup deleted");
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
        await Promise.all(existingSetups.map((setup: any) => fetch(`/api/label-setups/${setup.id}`, { method: "DELETE" })));
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
      toast.success("Saved to database");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save to database";
      setError(message);
      toast.error(message);
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
        toast.success("Exported to Excel");
      } else {
        toast.error("Failed to export");
      }
    } catch (err) {
      setError("Failed to export to Excel");
      toast.error("Failed to export to Excel");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-48 w-full" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/dashboard">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{projectData.project.name}</h1>
            {!projectData.isSaved && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Unsaved</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
            <Button size="sm" onClick={saveToDatabase} disabled={saveLoading || projectData.isSaved}>
              {saveLoading ? "Saving..." : projectData.isSaved ? "Saved" : "Save"}
            </Button>
            <Button size="sm" onClick={addLabelSetup}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Setup
            </Button>
          </div>
        </div>
      </div>

      {/* Label Setups */}
      {projectData.labelSetups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No label setups yet</p>
            <Button onClick={addLabelSetup}>Add Your First Setup</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectData.labelSetups.map((setup, setupIndex) => (
            <Card key={setupIndex}>
              {/* Setup Header */}
              <CardHeader className="py-3 px-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCollapse(setupIndex)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${collapsedSetups.has(setupIndex) ? '' : 'rotate-90'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <Input
                      ref={setupIndex === projectData.labelSetups.length - 1 ? newSetupNameRef : undefined}
                      value={setup.name || ""}
                      onChange={(e) => updateSetup(setupIndex, { name: e.target.value })}
                      placeholder={`Setup ${setupIndex + 1}`}
                      className="h-7 w-40 text-sm font-medium border-0 bg-transparent hover:bg-muted/50 focus-visible:bg-background focus-visible:ring-1 px-2"
                    />
                    <Badge variant="secondary" className="text-xs">{setup.lines.length} lines</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyLabelSetup(setupIndex)}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setDeleteSetupIndex(setupIndex)}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!collapsedSetups.has(setupIndex) && (
                <CardContent className="p-4 space-y-4">
                  {/* Properties Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Length (mm)</Label>
                      <Input
                        type="number"
                        value={setup.labelLengthMm}
                        onChange={(e) => updateSetup(setupIndex, { labelLengthMm: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Height (mm)</Label>
                      <Input
                        type="number"
                        value={setup.labelHeightMm}
                        onChange={(e) => updateSetup(setupIndex, { labelHeightMm: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input
                        type="number"
                        value={setup.labelQuantity}
                        onChange={(e) => updateSetup(setupIndex, { labelQuantity: parseInt(e.target.value) || 1 })}
                        className="h-8 text-sm"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Thickness</Label>
                      <Select value={String(setup.labelThicknessMm)} onValueChange={(v) => updateSetup(setupIndex, { labelThicknessMm: parseFloat(v) })}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.8">0.8 mm</SelectItem>
                          <SelectItem value="1.6">1.6 mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Background</Label>
                      <Select value={setup.labelColourBackground} onValueChange={(v) => updateSetup(setupIndex, { labelColourBackground: v })}>
                        <SelectTrigger className="h-8 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: setup.labelColourBackground.toLowerCase() }} />
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Text Color</Label>
                      <Select value={setup.textColour} onValueChange={(v) => updateSetup(setupIndex, { textColour: v })}>
                        <SelectTrigger className="h-8 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: setup.textColour.toLowerCase() }} />
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Style</Label>
                      <Select value={setup.style} onValueChange={(v) => updateSetup(setupIndex, { style: v })}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Adhesive">Adhesive</SelectItem>
                          <SelectItem value="Non Adhesive">Non Adhesive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Lines Table */}
                  <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                      <TableHeader className="bg-indigo-50/60 dark:bg-indigo-950/20">
                        <TableRow className="hover:bg-transparent border-indigo-100 dark:border-indigo-900/50">
                          <TableHead className="w-12 text-indigo-600/70 dark:text-indigo-300/70 font-semibold text-xs uppercase tracking-wider">#</TableHead>
                          <TableHead className="text-indigo-600/70 dark:text-indigo-300/70 font-semibold text-xs uppercase tracking-wider">Text</TableHead>
                          <TableHead className="w-32 text-indigo-600/70 dark:text-indigo-300/70 font-semibold text-xs uppercase tracking-wider">Size (mm)</TableHead>
                          <TableHead className="w-24 text-right text-indigo-600/70 dark:text-indigo-300/70 font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {setup.lines.map((line, lineIndex) => (
                          <TableRow key={lineIndex} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 border-indigo-50 dark:border-indigo-900/20 transition-colors">
                            <TableCell className="py-2 text-muted-foreground font-mono text-xs font-medium">{lineIndex + 1}</TableCell>
                            <TableCell className="py-2">
                              <Input
                                value={line.text}
                                onChange={(e) => updateLine(setupIndex, lineIndex, 'text', e.target.value)}
                                placeholder="Enter text..."
                                className="h-9 border-transparent bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Input
                                type="number"
                                value={line.textSizeMm}
                                onChange={(e) => updateLine(setupIndex, lineIndex, 'textSizeMm', parseFloat(e.target.value) || 0)}
                                className="h-9 w-24 border-transparent bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all"
                                step="0.1"
                              />
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => copyLine(setupIndex, lineIndex)}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </Button>
                                {setup.lines.length > 1 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteLine(setupIndex, lineIndex)}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Add new line row */}
                        <TableRow className="hover:bg-transparent border-t border-dashed border-indigo-100 dark:border-indigo-900/30">
                          <TableCell className="py-2 pl-4">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </TableCell>
                          <TableCell colSpan={3} className="py-2">
                            <button
                              onClick={() => addLine(setupIndex)}
                              className="flex w-full items-center text-indigo-600/80 dark:text-indigo-400/80 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                            >
                              Add new line
                            </button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteSetupIndex !== null} onOpenChange={() => setDeleteSetupIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Label Setup</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
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
