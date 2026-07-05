import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAdminAccess } from "@/lib/admin-access";

// Dashboard removed — /admin now lands on the Notices section.
export const Route = createFileRoute("/admin/")({
  beforeLoad: async ({ location }) => {
    await requireAdminAccess(location.href);
    throw redirect({ to: "/admin/notices" });
  },
  component: () => null,
});
