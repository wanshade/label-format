import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-utils";
import Providers from "@/components/providers";
import Sidebar from "@/components/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <Providers session={session}>
      <div className="min-h-screen bg-background flex">
        <Sidebar userEmail={session.user?.email || ""} />
        <main className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  );
}
