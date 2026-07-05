import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { bootstrapAuthSession, clearStoredSession, getStoredUser, setStoredUser, type AuthRole } from "@/api/auth";
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
        const session = await bootstrapAuthSession();
        if (!cancelled) {
          setUserState(session?.user ?? null);
        }
      } catch {
        if (!cancelled) {
          clearStoredSession({ notify: false });
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
    const syncFromStorage = () => {
      const storedUser = getStoredUser();
      setUserState(storedUser);
      setIsHydrating(false);
    };

    window.addEventListener("infocascade:auth", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("infocascade:auth", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const setUser = useCallback((u: AuthUser | null) => {
    setStoredUser(u);
    setUserState(u);
    setIsHydrating(false);
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession({ notify: true, clearQueryCache: true });
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
