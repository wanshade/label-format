"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Step 1: Basic Information and Label Properties
const basicInfoSchema = z.object({
  name: z.string().optional(),
  projectId: z.string(),
  labelLengthMm: z.number().min(1, "Length is required"),
  labelHeightMm: z.number().min(1, "Height is required"),
  labelThicknessMm: z.number().min(0, "Thickness must be positive"),
  labelColourBackground: z.string().optional(),
  textColour: z.string().optional(),
  labelQuantity: z.number().min(1, "Quantity must be at least 1"),
  style: z.string().optional(),
  noOfHoles: z.number().min(0, "Number of holes must be positive"),
  holeSizeMm: z.number().min(0, "Hole size must be positive"),
  holeDistanceMm: z.number().min(0, "Hole distance must be positive"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export interface LabelLine {
  text: string;
  textSizeMm: number;
  spacingTopMm: string | number;
  spacingLeftMm: string | number;
}

export interface LabelSetup {
  name?: string;
  projectId: string;
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

interface LabelSetupWizardProps {
  initialData?: LabelSetup;
  projects: Array<{ id: string; name: string; description?: string }>;
  onSave: (setup: LabelSetup) => void;
  onCancel: () => void;
  editingIndex?: number | null;
}

export default function LabelSetupWizard({
  initialData,
  projects,
  onSave,
  onCancel,
  editingIndex,
}: LabelSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfoFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        projectId: initialData.projectId || "",
        labelLengthMm: initialData.labelLengthMm,
        labelHeightMm: initialData.labelHeightMm,
        labelThicknessMm: initialData.labelThicknessMm,
        labelColourBackground: initialData.labelColourBackground,
        textColour: initialData.textColour,
        labelQuantity: initialData.labelQuantity,
        style: initialData.style,
        noOfHoles: initialData.noOfHoles,
        holeSizeMm: initialData.holeSizeMm,
        holeDistanceMm: initialData.holeDistanceMm,
      };
    }
    return {
      projectId: projects[0]?.id || "",
      labelLengthMm: 50,
      labelHeightMm: 25,
      labelThicknessMm: 0.8,
      labelColourBackground: "WHITE",
      textColour: "BLACK",
      labelQuantity: 1,
      style: "Adhesive",
      noOfHoles: 0,
      holeSizeMm: 0,
      holeDistanceMm: 0,
    };
  });

  const [lines, setLines] = useState<LabelLine[]>(() => {
    if (initialData && initialData.lines.length > 0) {
      return initialData.lines;
    }
    // Start with 1 empty line
    return [
      {
        text: "",
        textSizeMm: 2,
        spacingTopMm: "AUTO",
        spacingLeftMm: "AUTO",
      },
    ];
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: basicInfo,
  });

  const handleStep1Submit = (data: BasicInfoFormData) => {
    setBasicInfo(data);
    setStep(2);
  };

  const handleStep2Submit = () => {
    const completeSetup: LabelSetup = {
      projectId: basicInfo.projectId,
      name: basicInfo.name,
      labelLengthMm: basicInfo.labelLengthMm,
      labelHeightMm: basicInfo.labelHeightMm,
      labelThicknessMm: basicInfo.labelThicknessMm,
      labelColourBackground: basicInfo.labelColourBackground || "WHITE",
      textColour: basicInfo.textColour || "BLACK",
      labelQuantity: basicInfo.labelQuantity,
      style: basicInfo.style || "Adhesive",
      noOfHoles: basicInfo.noOfHoles,
      holeSizeMm: basicInfo.holeSizeMm,
      holeDistanceMm: basicInfo.holeDistanceMm,
      lines,
    };
    onSave(completeSetup);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        text: "",
        textSizeMm: 2,
        spacingTopMm: "AUTO",
        spacingLeftMm: "AUTO",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof LabelLine, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingIndex !== null ? "Edit Label Setup" : "New Label Setup"} -
              Step 1 of 2
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Basic Information & Label Properties
            </p>
          </div>

          <form onSubmit={handleSubmit(handleStep1Submit)} className="p-6">
            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Setup Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="Optional name for this setup"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    {...register("projectId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.projectId && (
                    <p className="text-red-600 text-xs mt-1">
                      Project is required
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Label Properties */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Label Properties
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Length (mm) *
                  </label>
                  <input
                    {...register("labelLengthMm", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.labelLengthMm && (
                    <p className="text-red-600 text-xs mt-1">
                      {errors.labelLengthMm.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (mm) *
                  </label>
                  <input
                    {...register("labelHeightMm", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.labelHeightMm && (
                    <p className="text-red-600 text-xs mt-1">
                      {errors.labelHeightMm.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thickness (mm)
                  </label>
                  <input
                    {...register("labelThicknessMm", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    {...register("labelQuantity", { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <select
                    {...register("labelColourBackground")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WHITE">White</option>
                    <option value="BLACK">Black</option>
                    <option value="RED">Red</option>
                    <option value="BLUE">Blue</option>
                    <option value="GREEN">Green</option>
                    <option value="YELLOW">Yellow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <select
                    {...register("textColour")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BLACK">Black</option>
                    <option value="WHITE">White</option>
                    <option value="RED">Red</option>
                    <option value="BLUE">Blue</option>
                    <option value="GREEN">Green</option>
                    <option value="YELLOW">Yellow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Style
                  </label>
                  <select
                    {...register("style")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Adhesive">Adhesive</option>
                    <option value="Non Adhesive">Non Adhesive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Holes
                  </label>
                  <input
                    {...register("noOfHoles", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hole Size (mm)
                  </label>
                  <input
                    {...register("holeSizeMm", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hole Distance (mm)
                  </label>
                  <input
                    {...register("holeDistanceMm", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Continue to Step 2 →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingIndex !== null ? "Edit Label Setup" : "New Label Setup"} -
              Step 2 of 2
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add and configure text lines
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Text Lines ({lines.length})
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  + Add Line
                </button>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        Line {index + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text Content
                        </label>
                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) =>
                            updateLine(index, "text", e.target.value)
                          }
                          placeholder="Enter text for this line"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text Size (mm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={line.textSizeMm}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "textSizeMm",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Spacing Top
                        </label>
                        <input
                          type="text"
                          value={line.spacingTopMm}
                          onChange={(e) =>
                            updateLine(index, "spacingTopMm", e.target.value)
                          }
                          placeholder="AUTO or number in mm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Spacing Left
                        </label>
                        <input
                          type="text"
                          value={line.spacingLeftMm}
                          onChange={(e) =>
                            updateLine(index, "spacingLeftMm", e.target.value)
                          }
                          placeholder="AUTO or number in mm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to Step 1
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStep2Submit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  {editingIndex !== null ? "Update Setup" : "Create Setup"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
