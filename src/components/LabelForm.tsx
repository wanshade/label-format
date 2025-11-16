"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { LabelLine, CreateLabelSetupRequest } from "@/types/label";

const labelSetupSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
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

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface LabelFormProps {
  initialData?: Partial<LabelSetupFormData>;
  onSubmit: (data: CreateLabelSetupRequest) => Promise<void>;
  submitButtonText: string;
  projects: Project[];
}

const defaultLines: LabelLine[] = [{
  text: "",
  textSizeMm: 0,
  spacingTopMm: "AUTO",
  spacingLeftMm: "AUTO",
}];

export default function LabelForm({ initialData, onSubmit, submitButtonText }: LabelFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LabelSetupFormData>({
    resolver: zodResolver(labelSetupSchema),
    defaultValues: {
      labelLengthMm: initialData?.labelLengthMm ?? 0,
      labelHeightMm: initialData?.labelHeightMm ?? 0,
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

  // Helper for number input registration
  const registerNumberInput = (name: keyof LabelSetupFormData) => ({
    ...register(name, {
      valueAsNumber: true,
      setValueAs: (value: string | number) => {
        if (value === "" || value === null || value === undefined) return 0;
        return Number(value);
      }
    })
  });

  const onFormSubmit = async (data: LabelSetupFormData) => {
    setLoading(true);
    setError("");

    try {
      // Convert any undefined/empty values to null or 0 for Excel export
      const processedData = {
        projectId: data.projectId,
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
        lines: data.lines.map(line => ({
          text: line.text ?? "",
          textSizeMm: line.textSizeMm ?? 0,
          spacingTopMm: line.spacingTopMm ?? "AUTO",
          spacingLeftMm: line.spacingLeftMm ?? "AUTO",
        })),
      };

      await onSubmit(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Global Properties */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Label Properties
          </h3>
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-5 sm:gap-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Label Length (mm)
              </label>
              <input
                type="number"
                step="0.1"
                {...registerNumberInput("labelLengthMm")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Label Height (mm)
              </label>
              <input
                type="number"
                step="0.1"
                {...registerNumberInput("labelHeightMm")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Label Thickness (mm)
              </label>
              <select
                {...register("labelThicknessMm", {
                  valueAsNumber: true,
                  setValueAs: (value) => Number(value)
                })}
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
              {errors.labelColourBackground && (
                <p className="mt-1 text-sm text-red-600">{errors.labelColourBackground.message}</p>
              )}
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
              {errors.textColour && (
                <p className="mt-1 text-sm text-red-600">{errors.textColour.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Label Quantity
              </label>
              <input
                type="number"
                {...register("labelQuantity", { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.labelQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.labelQuantity.message}</p>
              )}
            </div>

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
              {errors.style && (
                <p className="mt-1 text-sm text-red-600">{errors.style.message}</p>
              )}
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
              {errors.noOfHoles && (
                <p className="mt-1 text-sm text-red-600">{errors.noOfHoles.message}</p>
              )}
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
              {errors.holeSizeMm && (
                <p className="mt-1 text-sm text-red-600">{errors.holeSizeMm.message}</p>
              )}
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
              {errors.holeDistanceMm && (
                <p className="mt-1 text-sm text-red-600">{errors.holeDistanceMm.message}</p>
              )}
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
}