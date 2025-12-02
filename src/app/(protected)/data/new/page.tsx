"use client";

import { useState, useEffect } from "react";
import LabelForm from "@/components/LabelForm";
import { CreateLabelSetupRequest } from "@/types/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function NewLabelPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();
  }, []);

  const handleSubmit = async (data: CreateLabelSetupRequest) => {
    const response = await fetch("/api/label-setups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create label setup");
    }

    router.push("/data");
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/data">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Label Setup</h1>
        <p className="text-muted-foreground mt-2">Configure your new label with all required properties</p>
      </div>

      <LabelForm onSubmit={handleSubmit} submitButtonText="Create Label Setup" projects={projects} />
    </div>
  );
}
