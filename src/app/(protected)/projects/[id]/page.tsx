"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LabelSetupWizard, { LabelSetup, LabelLine } from "@/components/LabelSetupWizard";
import AddLineModal from "@/components/AddLineModal";

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
  const router = useRouter();
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
  const [addingLineSetup, setAddingLineSetup] = useState<number | null>(null);
  const [quickLineText, setQuickLineText] = useState("");
  const [quickLineTextSize, setQuickLineTextSize] = useState(2);
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [modalSetupIndex, setModalSetupIndex] = useState<number | null>(null);

  // Load project from database or local storage
  useEffect(() => {
    const loadProject = async () => {
      try {
        // First try to load from local storage
        const localData = localStorage.getItem(`project-${projectId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          setProjectData(parsed);
          setLoading(false);
          return;
        }

        // If not in local storage, load from database
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const project = await response.json();

          // Load label setups for this project
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

  // Auto-save to local storage
  useEffect(() => {
    if (projectData) {
      localStorage.setItem(`project-${projectId}`, JSON.stringify(projectData));
    }
  }, [projectData, projectId]);

  // Load projects
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

  // Handle clicks outside to close editors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Don't close if clicking on an input, select, or their containers
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

  const deleteLabelSetup = (index: number) => {
    if (!projectData) return;

    setProjectData({
      ...projectData,
      labelSetups: projectData.labelSetups.filter((_, i) => i !== index),
      isSaved: false,
    });
  };

  const copyLabelSetup = (index: number) => {
    if (!projectData) return;

    const setupToCopy = projectData.labelSetups[index];
    const copiedSetup = {
      ...setupToCopy,
      name: setupToCopy.name ? `${setupToCopy.name} (Copy)` : undefined,
      // Create deep copy of lines array to avoid reference issues
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

    // Ensure projectId is included
    const completeSetup = {
      ...labelSetup,
      projectId: projectId,
    };

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
      // Cancel editing
      setEditingLine(null);
      setEditingText("");
    } else {
      // Start editing
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
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        labelColourBackground: color,
      };
    } else {
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        textColour: color,
      };
    }

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
  };

  const updateStyleSetup = (setupIndex: number, style: string) => {
    if (!projectData) return;

    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      style: style,
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
  };

  const updateThicknessSetup = (setupIndex: number, thickness: number) => {
    if (!projectData) return;

    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      labelThicknessMm: parseFloat(thickness.toString()) || 0,
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
  };

  const updateSizeSetup = (setupIndex: number, dimension: 'length' | 'height', value: number) => {
    if (!projectData) return;

    const updatedSetups = [...projectData.labelSetups];
    if (dimension === 'length') {
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        labelLengthMm: parseFloat(value.toString()) || 0,
      };
    } else {
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        labelHeightMm: parseFloat(value.toString()) || 0,
      };
    }

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
  };

  const updateQuantitySetup = (setupIndex: number, quantity: number) => {
    if (!projectData) return;

    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      labelQuantity: parseInt(quantity.toString()) || 1,
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
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

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
  };

  const deleteLine = (setupIndex: number, lineIndex: number) => {
    if (!projectData) return;

    const updatedSetups = [...projectData.labelSetups];
    // Only allow deletion if there's more than 1 line
    if (updatedSetups[setupIndex].lines.length > 1) {
      updatedSetups[setupIndex] = {
        ...updatedSetups[setupIndex],
        lines: updatedSetups[setupIndex].lines.filter((_, index) => index !== lineIndex)
      };

      setProjectData({
        ...projectData,
        labelSetups: updatedSetups,
        isSaved: false,
      });
    }
  };

  const copyLine = (setupIndex: number, lineIndex: number) => {
    if (!projectData) return;

    const updatedSetups = [...projectData.labelSetups];
    const lineToCopy = updatedSetups[setupIndex].lines[lineIndex];

    // Create a copy of the line with "(Copy)" appended to text
    const copiedLine = {
      ...lineToCopy,
      text: lineToCopy.text ? `${lineToCopy.text} (Copy)` : "",
    };

    // Insert the copied line right after the original line
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: [
        ...updatedSetups[setupIndex].lines.slice(0, lineIndex + 1),
        copiedLine,
        ...updatedSetups[setupIndex].lines.slice(lineIndex + 1)
      ],
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });
  };

  const addQuickLine = (setupIndex: number) => {
    setModalSetupIndex(setupIndex);
    setShowAddLineModal(true);
  };

  const saveQuickLine = (setupIndex: number) => {
    if (!projectData || !quickLineText.trim()) return;

    const updatedSetups = [...projectData.labelSetups];
    updatedSetups[setupIndex] = {
      ...updatedSetups[setupIndex],
      lines: [
        ...updatedSetups[setupIndex].lines,
        {
          text: quickLineText.trim(),
          textSizeMm: quickLineTextSize,
          spacingTopMm: "AUTO",
          spacingLeftMm: "AUTO",
        },
      ],
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });

    setAddingLineSetup(null);
    setQuickLineText("");
    setQuickLineTextSize(2);
  };

  const cancelQuickLine = () => {
    setAddingLineSetup(null);
    setQuickLineText("");
    setQuickLineTextSize(2);
  };

  const handleModalAddLine = (text: string, textSize: number) => {
    if (!projectData || modalSetupIndex === null) {
      return;
    }

    const updatedSetups = [...projectData.labelSetups];
    const newLine = {
      text: text.trim(),
      textSizeMm: textSize,
      spacingTopMm: "AUTO",
      spacingLeftMm: "AUTO",
    };

    updatedSetups[modalSetupIndex] = {
      ...updatedSetups[modalSetupIndex],
      lines: [
        ...updatedSetups[modalSetupIndex].lines,
        newLine,
      ],
    };

    setProjectData({
      ...projectData,
      labelSetups: updatedSetups,
      isSaved: false,
    });

    setShowAddLineModal(false);
    setModalSetupIndex(null);
  };

  const saveToDatabase = async () => {
    if (!projectData) return;

    setSaveLoading(true);
    setError("");

    try {
      // Save project details
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectData.project.name,
          description: projectData.project.description,
        }),
      });

      if (!projectResponse.ok) {
        throw new Error("Failed to save project");
      }

      // Delete existing label setups for this project
      const existingSetupsResponse = await fetch(`/api/label-setups?projectId=${projectId}`);
      if (existingSetupsResponse.ok) {
        const existingSetups = await existingSetupsResponse.json();
        await Promise.all(
          existingSetups.map((setup: any) =>
            fetch(`/api/label-setups/${setup.id}`, { method: "DELETE" })
          )
        );
      }

      // Create new label setups
      await Promise.all(
        projectData.labelSetups.map((setup) => {
          // Convert string values to numbers for database compatibility
          const sanitizedSetup = {
            ...setup,
            projectId,
            name: setup.name || "", // Ensure name is always a string, not null
            labelLengthMm: parseFloat(setup.labelLengthMm as any) || 0,
            labelHeightMm: parseFloat(setup.labelHeightMm as any) || 0,
            labelThicknessMm: parseFloat(setup.labelThicknessMm as any) || 0,
            labelQuantity: parseInt(setup.labelQuantity as any) || 1,
            noOfHoles: parseInt(setup.noOfHoles as any) || 0,
            holeSizeMm: parseFloat(setup.holeSizeMm as any) || 0,
            holeDistanceMm: parseFloat(setup.holeDistanceMm as any) || 0,
            // Ensure lines have numeric textSizeMm and proper text field
            lines: setup.lines.map(line => ({
              ...line,
              text: line.text || "", // Ensure text is always a string, not null/undefined
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

      setProjectData({
        ...projectData,
        isSaved: true,
      });

      alert("Project saved successfully to database!");
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
        body: JSON.stringify({
          labelSetups: projectData?.labelSetups || [],
          projectName: projectData?.project.name,
        }),
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
      } else {
        throw new Error("Export failed");
      }
    } catch (err) {
      setError("Failed to export to Excel");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || "Project not found"}</p>
        <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-900">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
        >
          ← Back to projects
        </Link>
        <div className="flex justify-between items-start mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{projectData.project.name}</h1>
            {projectData.project.description && (
              <p className="text-gray-600 mt-1">{projectData.project.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Export Excel
            </button>
            <button
              onClick={saveToDatabase}
              disabled={saveLoading || projectData.isSaved}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                projectData.isSaved
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {saveLoading ? "Saving..." : projectData.isSaved ? "Saved" : "Save to Database"}
            </button>
          </div>
        </div>
        {!projectData.isSaved && (
          <p className="text-yellow-600 text-sm mt-2">⚠️ You have unsaved changes</p>
        )}
      </div>

      {/* Label Setups */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Label Setups ({projectData.labelSetups.length})
          </h2>
          <button
            onClick={addLabelSetup}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            + Add Label Setup
          </button>
        </div>

        {projectData.labelSetups.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No label setups yet</p>
            <button
              onClick={addLabelSetup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Your First Label Setup
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projectData.labelSetups.map((labelSetup, setupIndex) => (
              <div key={setupIndex} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Setup Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {labelSetup.name || `Label Setup ${setupIndex + 1}`}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateLabelSetup(setupIndex)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Edit Full Setup
                      </button>
                      <button
                        onClick={() => copyLabelSetup(setupIndex)}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        Copy Setup
                      </button>
                      <button
                        onClick={() => deleteLabelSetup(setupIndex)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete Setup
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <div className="flex flex-wrap gap-4">
                      <span className="text-gray-600">
                        Size: {editingColor?.setupIndex === setupIndex && editingColor?.type === 'size' ? (
                          <div className="inline-flex items-center space-x-1 inline-editor" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              value={labelSetup.labelLengthMm}
                              onChange={(e) => updateSizeSetup(setupIndex, 'length', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingColor(null);
                                }
                              }}
                              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              step="0.1"
                              min="1"
                              autoFocus
                            />
                            <span className="text-gray-500">×</span>
                            <input
                              type="number"
                              value={labelSetup.labelHeightMm}
                              onChange={(e) => updateSizeSetup(setupIndex, 'height', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingColor(null);
                                }
                              }}
                              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              step="0.1"
                              min="1"
                            />
                            <span className="text-gray-500">mm</span>
                          </div>
                        ) : (
                          <strong
                            className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                            onClick={() => setEditingColor({ setupIndex, type: 'size' })}
                          >
                            {labelSetup.labelLengthMm}×{labelSetup.labelHeightMm}mm
                          </strong>
                        )}
                      </span>
                      <span className="text-gray-600">
                        Quantity: {editingColor?.setupIndex === setupIndex && editingColor?.type === 'quantity' ? (
                          <div className="inline-editor">
                            <input
                              type="number"
                              value={labelSetup.labelQuantity}
                              onChange={(e) => updateQuantitySetup(setupIndex, parseInt(e.target.value) || 1)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingColor(null);
                                }
                              }}
                              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="1"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <strong
                            className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                            onClick={() => setEditingColor({ setupIndex, type: 'quantity' })}
                          >
                            {labelSetup.labelQuantity}
                          </strong>
                        )}
                      </span>
                      <span className="text-gray-600">
                        Total Lines: <strong>{labelSetup.lines.length}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => addQuickLine(setupIndex)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0 0h6m-6 0h6" />
                      </svg>
                      Add Line
                    </button>
                  </div>
                </div>

                {/* Lines as Cards */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {labelSetup.lines.map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Line {lineIndex + 1}
                            </span>
                            <span className="text-xs text-gray-500">
                              Size: {editingColor?.setupIndex === setupIndex && editingColor?.type === 'lineSize' && editingColor?.lineIndex === lineIndex ? (
                                <div className="inline-editor inline-flex items-center">
                                  <input
                                    type="number"
                                    value={line.textSizeMm}
                                    onChange={(e) => updateLineTextSize(setupIndex, lineIndex, parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === 'Escape') {
                                        setEditingColor(null);
                                      }
                                    }}
                                    className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    step="0.1"
                                    min="0.1"
                                    autoFocus
                                  />
                                  <span className="text-gray-500">mm</span>
                                </div>
                              ) : (
                                <strong
                                  className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                  onClick={() => setEditingColor({ setupIndex, type: 'lineSize', lineIndex })}
                                >
                                  {line.textSizeMm}mm
                                </strong>
                              )}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => copyLine(setupIndex, lineIndex)}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                              title="Copy line"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            {labelSetup.lines.length > 1 && (
                              <button
                                onClick={() => deleteLine(setupIndex, lineIndex)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete line"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline editable text */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-medium text-gray-700">Text Content</label>
                            <button
                              onClick={() => toggleLineEdit(setupIndex, lineIndex)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              {editingLine?.setupIndex === setupIndex && editingLine?.lineIndex === lineIndex
                                ? 'Cancel'
                                : 'Edit'}
                            </button>
                          </div>

                          {editingLine?.setupIndex === setupIndex && editingLine?.lineIndex === lineIndex ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                placeholder="Enter text for this line"
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => saveLineText(setupIndex, lineIndex)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => toggleLineEdit(setupIndex, lineIndex)}
                                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="min-h-[40px] p-3 bg-gray-50 border border-gray-200 rounded text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => toggleLineEdit(setupIndex, lineIndex)}
                            >
                              {line.text || <span className="text-gray-400 italic">Click to add text...</span>}
                            </div>
                          )}
                        </div>

                        {/* Line Properties */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Spacing Top:</span>
                            <span className="font-medium">{line.spacingTopMm}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Spacing Left:</span>
                            <span className="font-medium">{line.spacingLeftMm}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Line Management Section */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Background:</span>
                      {editingColor?.setupIndex === setupIndex && editingColor?.type === 'background' ? (
                        <div className="inline-editor">
                          <select
                            value={labelSetup.labelColourBackground}
                            onChange={(e) => updateColorSetup(setupIndex, 'background', e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          >
                          <option value="WHITE">White</option>
                          <option value="BLACK">Black</option>
                          <option value="RED">Red</option>
                          <option value="BLUE">Blue</option>
                          <option value="GREEN">Green</option>
                          <option value="YELLOW">Yellow</option>
                          </select>
                        </div>
                      ) : (
                        <div
                          className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={() => setEditingColor({ setupIndex, type: 'background' })}
                        >
                          <div
                            className="w-4 h-4 border border-gray-300 rounded"
                            style={{ backgroundColor: labelSetup.labelColourBackground.toLowerCase() }}
                          />
                          <span className="text-xs">{labelSetup.labelColourBackground}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Text:</span>
                      {editingColor?.setupIndex === setupIndex && editingColor?.type === 'text' ? (
                        <select
                          value={labelSetup.textColour}
                          onChange={(e) => updateColorSetup(setupIndex, 'text', e.target.value)}
                          onBlur={() => setEditingColor(null)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        >
                          <option value="BLACK">Black</option>
                          <option value="WHITE">White</option>
                          <option value="RED">Red</option>
                          <option value="BLUE">Blue</option>
                          <option value="GREEN">Green</option>
                          <option value="YELLOW">Yellow</option>
                        </select>
                      ) : (
                        <div
                          className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={() => setEditingColor({ setupIndex, type: 'text' })}
                        >
                          <div
                            className="w-4 h-4 border border-gray-300 rounded"
                            style={{ backgroundColor: labelSetup.textColour.toLowerCase() }}
                          />
                          <span className="text-xs">{labelSetup.textColour}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Style:</span>
                      {editingColor?.setupIndex === setupIndex && editingColor?.type === 'style' ? (
                        <select
                          value={labelSetup.style}
                          onChange={(e) => updateStyleSetup(setupIndex, e.target.value)}
                          onBlur={() => setEditingColor(null)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        >
                          <option value="Adhesive">Adhesive</option>
                          <option value="Non Adhesive">Non Adhesive</option>
                        </select>
                      ) : (
                        <div
                          className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={() => setEditingColor({ setupIndex, type: 'style' })}
                        >
                          <span className="text-xs font-medium">{labelSetup.style}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Thickness:</span>
                      {editingColor?.setupIndex === setupIndex && editingColor?.type === 'thickness' ? (
                        <select
                          value={labelSetup.labelThicknessMm}
                          onChange={(e) => updateThicknessSetup(setupIndex, parseFloat(e.target.value))}
                          onBlur={() => setEditingColor(null)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        >
                          <option value="0.8">0.8</option>
                          <option value="1.6">1.6</option>
                        </select>
                      ) : (
                        <div
                          className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={() => setEditingColor({ setupIndex, type: 'thickness' })}
                        >
                          <span className="text-xs font-medium">{labelSetup.labelThicknessMm}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Line Modal */}
        <AddLineModal
          isOpen={showAddLineModal}
          onClose={() => setShowAddLineModal(false)}
          onAdd={handleModalAddLine}
        />

        {/* Label Setup Wizard Modal */}
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
    </div>
  );
}