import EditLabelForm from "@/components/EditLabelForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Label Setup</h1>
        <p className="text-muted-foreground mt-2">Update your label configuration</p>
      </div>

      <EditLabelForm initialData={setup} labelId={params.id} projects={projects} />
    </div>
  );
}
