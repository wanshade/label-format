"use client";

import { useState, useEffect } from "react";
import LabelForm from "@/components/LabelForm";
import { CreateLabelSetupRequest } from "@/types/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

    // Redirect to data page on success
    router.push("/data");
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href="/data"
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
        >
          ← Back to list
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Label Setup</h1>
      </div>

      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <LabelForm onSubmit={handleSubmit} submitButtonText="Create Label Setup" projects={projects} />
      </div>
    </div>
  );
}