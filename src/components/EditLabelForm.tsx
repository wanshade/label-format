"use client";

import LabelForm from "@/components/LabelForm";
import { CreateLabelSetupRequest } from "@/types/label";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface EditLabelFormProps {
  initialData: any;
  labelId: string;
  projects: Project[];
}

export default function EditLabelForm({ initialData, labelId, projects }: EditLabelFormProps) {
  const router = useRouter();

  const handleSubmit = async (data: CreateLabelSetupRequest) => {
    const response = await fetch(`/api/label-setups/${labelId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update label setup");
    }

    // Redirect to data page on success
    router.push("/data");
  };

  return (
    <LabelForm
      initialData={initialData}
      onSubmit={handleSubmit}
      submitButtonText="Update Label Setup"
      projects={projects}
    />
  );
}