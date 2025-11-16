"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  labelSetupCount?: number;
}

interface DashboardPageProps {
  session: any;
}

export default function DashboardPage({ session }: DashboardPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project? All label setups in this project will be deleted.")) {
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setProjects(projects.filter(project => project.id !== id));
        }
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">Create and manage your label setup projects</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + New Project
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to start organizing your label setups</p>
          <Link
            href="/projects/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {project.labelSetupCount || 0} label setup{(project.labelSetupCount || 0) !== 1 ? 's' : ''}
                    </p>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete project"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Open Project
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}