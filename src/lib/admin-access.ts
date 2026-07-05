import { redirect } from "@tanstack/react-router";
import { authApi } from "@/api/auth";

export async function requireAdminAccess(redirectTo: string) {
  try {
    const me = await authApi.me();
    if (me.role !== "admin") {
      throw new Error("Not an admin");
    }
    return me;
  } catch {
    await authApi.logout().catch(() => {});
    throw redirect({
      to: "/login",
      search: { redirect: redirectTo } as never,
    });
  }
}
