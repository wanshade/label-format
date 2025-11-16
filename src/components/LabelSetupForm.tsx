"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const labelSetupSchema = z.object({
  name: z.string().optional(),
  labelLengthMm: z.number().optional(),
  labelHeightMm: z.number().optional(),
  labelThicknessMm: z.number().optional(),
  labelColourBackground: z.string().optional(),
  textColour: z.string().optional(),
  labelQuantity: z.number().optional(),
  style: z.string().optional(),
  noOfHoles: z.number().optional(),
  holeSizeMm: z.number().optional(),
  holeDistanceMm: z.number().optional(),
  lines: z.array(z.object({
    text: z.string().optional(),
    textSizeMm: z.number().optional(),
    spacingTopMm: z.union([z.string(), z.number()]).optional(),
    spacingLeftMm: z.union([z.string(), z.number()]).optional(),
  })).min(1),
});

type LabelSetupFormData = z.infer<typeof labelSetupSchema>;

interface LabelSetupFormProps {
  initialData?: LabelSetup;
  onSave: (data: LabelSetup) => void;
  onCancel: () => void;
}

const defaultLines: LabelLine[] = [{
  text: "",
  textSizeMm: 0,
  spacingTopMm: "AUTO",
  spacingLeftMm: "AUTO",
}];

export default function LabelSetupForm({ initialData, onSave, onCancel }: LabelSetupFormProps) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<LabelSetupFormData>({
    resolver: zodResolver(labelSetupSchema),
    defaultValues: {
      name: initialData?.name || "",
      labelLengthMm: initialData?.labelLengthMm ?? 100,
      labelHeightMm: initialData?.labelHeightMm ?? 50,
      labelThicknessMm: initialData?.labelThicknessMm ?? 0.8,
      labelColourBackground: initialData?.labelColourBackground ?? "WHITE",
      textColour: initialData?.textColour ?? "BLACK",
      labelQuantity: initialData?.labelQuantity ?? 1,
      style: initialData?.style ?? "Adhesive",
      noOfHoles: initialData?.noOfHoles ?? 0,
      holeSizeMm: initialData?.holeSizeMm ?? 0,
      holeDistanceMm: initialData?.holeDistanceMm ?? 0,
      lines: initialData?.lines ?? defaultLines,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const onFormSubmit = (data: LabelSetupFormData) => {
    const processedData: LabelSetup = {
      name: data.name,
      labelLengthMm: data.labelLengthMm ?? 0,
      labelHeightMm: data.labelHeightMm ?? 0,
      labelThicknessMm: data.labelThicknessMm ?? 0.8,
      labelColourBackground: data.labelColourBackground ?? "WHITE",
      textColour: data.textColour ?? "BLACK",
      labelQuantity: data.labelQuantity ?? 1,
      style: data.style ?? "Adhesive",
      noOfHoles: data.noOfHoles ?? 0,
      holeSizeMm: data.holeSizeMm ?? 0,
      holeDistanceMm: data.holeDistanceMm ?? 0,
      lines: data.lines?.map(line => ({
        text: line.text ?? "",
        textSizeMm: line.textSizeMm ?? 0,
        spacingTopMm: line.spacingTopMm ?? "AUTO",
        spacingLeftMm: line.spacingLeftMm ?? "AUTO",
      })) ?? [],
    };

    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {initialData ? "Edit Label Setup" : "Add New Label Setup"}
          </h2>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Front Product Label"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    {...register("labelQuantity", { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Label Properties */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Label Properties
              </h3>
              <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-5 sm:gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Length (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("labelLengthMm", { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("labelHeightMm", { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Thickness (mm)
                  </label>
                  <select
                    {...register("labelThicknessMm")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="0.8">0.8</option>
                    <option value="1.6">1.6</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Label Colour (Bg)
                  </label>
                  <select
                    {...register("labelColourBackground")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="WHITE">WHITE</option>
                    <option value="BLACK">BLACK</option>
                    <option value="SILVER">SILVER</option>
                    <option value="YELLOW">YELLOW</option>
                    <option value="GOLD">GOLD</option>
                    <option value="GREEN">GREEN</option>
                    <option value="PINE GREEN">PINE GREEN</option>
                    <option value="BLUE">BLUE</option>
                    <option value="RED">RED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Text Colour
                  </label>
                  <select
                    {...register("textColour")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="BLACK">BLACK</option>
                    <option value="WHITE">WHITE</option>
                    <option value="BLUE">BLUE</option>
                    <option value="GREEN">GREEN</option>
                    <option value="RED">RED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Advanced Settings
              </h3>
              <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-4 sm:gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Style
                  </label>
                  <select
                    {...register("style")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="Adhesive">Adhesive</option>
                    <option value="Non Adhesive">Non Adhesive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    No. of Holes
                  </label>
                  <input
                    type="number"
                    {...register("noOfHoles", { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hole Size (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("holeSizeMm", { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hole Distance (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("holeDistanceMm", { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Lines */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Text Lines
                </h3>
                <button
                  type="button"
                  onClick={() => append({
                    text: "",
                    textSizeMm: 0,
                    spacingTopMm: "AUTO",
                    spacingLeftMm: "AUTO",
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Line
                </button>
              </div>
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-medium text-gray-900">
                        Line {index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-4 sm:gap-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Text
                        </label>
                        <input
                          type="text"
                          {...register(`lines.${index}.text`)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Text Size (mm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register(`lines.${index}.textSizeMm`, { valueAsNumber: true })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Spacing Top (mm)
                        </label>
                        <input
                          type="text"
                          {...register(`lines.${index}.spacingTopMm`)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="AUTO"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Spacing Left (mm)
                        </label>
                        <input
                          type="text"
                          {...register(`lines.${index}.spacingLeftMm`)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="AUTO"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Label Setup
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}