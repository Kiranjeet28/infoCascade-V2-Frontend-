import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, setStoredUser, type AuthRole } from "@/api/auth";
import { setAuthToken } from "@/api/client";
import type { UserRecord } from "@/api/users";

export type AuthUser = UserRecord & { role: AuthRole };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  /** Persist a user (called from login flows). */
  setUser: (u: AuthUser | null) => void;
  /** Clear cached user + token. */
  signOut: () => void;
  /** Revalidate the current session against the server. */
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const refresh = useCallback(() => {
    let cancelled = false;

    async function revalidateSession() {
      setIsHydrating(true);

      try {
        const currentUser = await authApi.me();
        if (!cancelled) setUserState(currentUser);
      } catch {
        if (!cancelled) {
          setAuthToken(null);
          setStoredUser(null);
          setUserState(null);
        }
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    }

    void revalidateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

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
    setIsHydrating(false);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setStoredUser(null);
    setUserState(null);
    setIsHydrating(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isHydrating, setUser, signOut, refresh }),
    [user, isHydrating, setUser, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
