"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  collapsed?: boolean;
}

export default function SignOutButton({ className, collapsed }: SignOutButtonProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground hover:text-destructive hover:bg-destructive/10", className)}
      title={collapsed ? "Sign out" : undefined}
    >
      <svg className={cn("w-4 h-4", !collapsed && "mr-2")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {!collapsed && "Sign out"}
    </Button>
  );
}
