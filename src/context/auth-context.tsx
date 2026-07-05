import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getStoredUser, setStoredUser, type AuthRole } from "@/api/auth";
import { setAuthToken } from "@/api/client";
import type { UserRecord } from "@/api/users";

export type AuthUser = UserRecord & { role: AuthRole };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Persist a user (called from login flows). */
  setUser: (u: AuthUser | null) => void;
  /** Clear cached user + token. */
  signOut: () => void;
  /** Re-read from localStorage. */
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getStoredUser());

  const refresh = useCallback(() => setUserState(getStoredUser()), []);

  useEffect(() => {
    window.addEventListener("infocascade:auth", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("infocascade:auth", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const setUser = useCallback((u: AuthUser | null) => {
    setStoredUser(u);
    setUserState(u);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setStoredUser(null);
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, setUser, signOut, refresh }),
    [user, setUser, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
