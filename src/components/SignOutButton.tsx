"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      // Redirect to login page after successful logout
      router.push("/login");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
    >
      Sign out
    </button>
  );
}