import EditLabelForm from "@/components/EditLabelForm";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditLabelPageProps {
  params: {
    id: string;
  };
}

async function getLabelSetup(id: string) {
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/label-setups/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getProjects() {
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/projects`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export default async function EditLabelPage({ params }: EditLabelPageProps) {
  const setup = await getLabelSetup(params.id);
  const projects = await getProjects();

  if (!setup) {
    notFound();
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href="/data"
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
        >
          ← Back to list
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Label Setup</h1>
      </div>

      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <EditLabelForm initialData={setup} labelId={params.id} projects={projects} />
      </div>
    </div>
  );
}