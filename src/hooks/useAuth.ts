import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
  } | null;
  error: string | null;
}

export function useAuth() {
  const { data: session, status, update } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  });

  useEffect(() => {
    setAuthState({
      isLoading: status === "loading",
      isAuthenticated: !!session?.user,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      } : null,
      error: null,
    });
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setAuthState(prev => ({ ...prev, error: "Invalid email or password" }));
        return { success: false, error: "Invalid email or password" };
      }

      setAuthState(prev => ({ ...prev, error: null }));
      return { success: true };
    } catch (error) {
      const errorMessage = "An error occurred during login";
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      setAuthState(prev => ({ ...prev, user: null, isAuthenticated: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = "An error occurred during logout";
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userData: Partial<AuthState['user']>) => {
    try {
      await update({
        ...session,
        user: {
          ...session?.user,
          ...userData,
        },
      });
      return { success: true };
    } catch (error) {
      const errorMessage = "Failed to update user data";
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
    clearError,
    session,
  };
}

export default useAuth;