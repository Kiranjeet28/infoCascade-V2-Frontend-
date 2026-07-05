import { redirect } from "@tanstack/react-router";
import { bootstrapAuthSession, clearStoredSession } from "@/api/auth";

export async function requireAdminAccess(redirectTo: string) {
  try {
    const session = await bootstrapAuthSession();
    if (!session || session.user.role !== "admin") {
      clearStoredSession({ notify: false });
      throw new Error("Not an admin");
    }
    return session.user;
  } catch {
    clearStoredSession({ notify: false, clearQueryCache: true });
    throw redirect({
      to: "/login",
      search: { redirect: redirectTo } as never,
    });
  }
}
