"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
    return [{ text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }];
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
    setLines([...lines, { text: "", textSizeMm: 2, spacingTopMm: "AUTO", spacingLeftMm: "AUTO" }]);
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
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Label Setup" : "New Label Setup"} - Step 1 of 2</DialogTitle>
            <DialogDescription>Basic Information & Label Properties</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Setup Name</Label>
                  <Input {...register("name")} placeholder="Optional name for this setup" />
                </div>
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
                  {errors.projectId && <p className="text-sm text-destructive">Project is required</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Label Properties</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Length (mm) *</Label>
                  <Input type="number" step="0.1" {...register("labelLengthMm", { valueAsNumber: true })} />
                  {errors.labelLengthMm && <p className="text-sm text-destructive">{errors.labelLengthMm.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Height (mm) *</Label>
                  <Input type="number" step="0.1" {...register("labelHeightMm", { valueAsNumber: true })} />
                  {errors.labelHeightMm && <p className="text-sm text-destructive">{errors.labelHeightMm.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Thickness (mm)</Label>
                  <Input type="number" step="0.1" {...register("labelThicknessMm", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input type="number" min="1" {...register("labelQuantity", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Select value={watch("labelColourBackground")} onValueChange={(value) => setValue("labelColourBackground", value)}>
                    <SelectTrigger>
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Select value={watch("textColour")} onValueChange={(value) => setValue("textColour", value)}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Number of Holes</Label>
                  <Input type="number" min="0" {...register("noOfHoles", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Hole Size (mm)</Label>
                  <Input type="number" step="0.1" min="0" {...register("holeSizeMm", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Hole Distance (mm)</Label>
                  <Input type="number" step="0.1" min="0" {...register("holeDistanceMm", { valueAsNumber: true })} />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button type="submit">
                Continue to Step 2
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 2) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Label Setup" : "New Label Setup"} - Step 2 of 2</DialogTitle>
            <DialogDescription>Add and configure text lines</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-foreground">Text Lines ({lines.length})</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Line
              </Button>
            </div>

            <div className="space-y-4">
              {lines.map((line, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <Badge>Line {index + 1}</Badge>
                      {lines.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeLine(index)}>
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Input
                          value={line.text}
                          onChange={(e) => updateLine(index, "text", e.target.value)}
                          placeholder="Enter text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Text Size (mm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={line.textSizeMm}
                          onChange={(e) => updateLine(index, "textSizeMm", parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Spacing Top</Label>
                        <Input
                          value={line.spacingTopMm}
                          onChange={(e) => updateLine(index, "spacingTopMm", e.target.value)}
                          placeholder="AUTO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Spacing Left</Label>
                        <Input
                          value={line.spacingLeftMm}
                          onChange={(e) => updateLine(index, "spacingLeftMm", e.target.value)}
                          placeholder="AUTO"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Step 1
              </Button>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={handleStep2Submit}>
                  {editingIndex !== null ? "Update Setup" : "Create Setup"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
