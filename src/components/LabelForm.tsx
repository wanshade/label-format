"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { LabelLine, CreateLabelSetupRequest } from "@/types/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function LabelForm({ initialData, onSubmit, submitButtonText, projects }: LabelFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LabelSetupFormData>({
    resolver: zodResolver(labelSetupSchema),
    defaultValues: {
      projectId: initialData?.projectId ?? "",
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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={watch("projectId")} onValueChange={(value) => setValue("projectId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectId && <p className="text-sm text-destructive">{errors.projectId.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Label Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Label Length (mm)</Label>
              <Input type="number" step="0.1" placeholder="0" {...registerNumberInput("labelLengthMm")} />
            </div>

            <div className="space-y-2">
              <Label>Label Height (mm)</Label>
              <Input type="number" step="0.1" placeholder="0" {...registerNumberInput("labelHeightMm")} />
            </div>

            <div className="space-y-2">
              <Label>Label Thickness (mm)</Label>
              <Select value={String(watch("labelThicknessMm"))} onValueChange={(value) => setValue("labelThicknessMm", parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8">0.8</SelectItem>
                  <SelectItem value="1.6">1.6</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <Select value={watch("labelColourBackground")} onValueChange={(value) => setValue("labelColourBackground", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHITE">WHITE</SelectItem>
                  <SelectItem value="BLACK">BLACK</SelectItem>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="YELLOW">YELLOW</SelectItem>
                  <SelectItem value="GOLD">GOLD</SelectItem>
                  <SelectItem value="GREEN">GREEN</SelectItem>
                  <SelectItem value="PINE GREEN">PINE GREEN</SelectItem>
                  <SelectItem value="BLUE">BLUE</SelectItem>
                  <SelectItem value="RED">RED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <Select value={watch("textColour")} onValueChange={(value) => setValue("textColour", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLACK">BLACK</SelectItem>
                  <SelectItem value="WHITE">WHITE</SelectItem>
                  <SelectItem value="BLUE">BLUE</SelectItem>
                  <SelectItem value="GREEN">GREEN</SelectItem>
                  <SelectItem value="RED">RED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label Quantity</Label>
              <Input type="number" {...register("labelQuantity", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={watch("style")} onValueChange={(value) => setValue("style", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adhesive">Adhesive</SelectItem>
                  <SelectItem value="Non Adhesive">Non Adhesive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>No. of Holes</Label>
              <Input type="number" {...register("noOfHoles", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Hole Size (mm)</Label>
              <Input type="number" step="0.1" {...register("holeSizeMm", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Hole Distance (mm)</Label>
              <Input type="number" step="0.1" {...register("holeDistanceMm", { valueAsNumber: true })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Text Lines</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({
              text: "",
              textSizeMm: 0,
              spacingTopMm: "AUTO",
              spacingLeftMm: "AUTO",
            })}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Line {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <Input {...register(`lines.${index}.text`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Size (mm)</Label>
                    <Input type="number" step="0.1" {...register(`lines.${index}.textSizeMm`, { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Spacing Top (mm)</Label>
                    <Input {...register(`lines.${index}.spacingTopMm`)} placeholder="AUTO" />
                  </div>
                  <div className="space-y-2">
                    <Label>Spacing Left (mm)</Label>
                    <Input {...register(`lines.${index}.spacingLeftMm`)} placeholder="AUTO" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
