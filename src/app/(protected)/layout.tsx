import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-utils";
import SignOutButton from "@/components/SignOutButton";
import Providers from "@/components/providers";
import Link from "next/link";

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
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-foreground">MLA Setup</span>
                </Link>
                
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    Dashboard
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {session.user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {session.user?.email}
                  </span>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </Providers>
  );
}
