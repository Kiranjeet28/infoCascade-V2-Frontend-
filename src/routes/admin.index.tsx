import { createFileRoute, redirect } from "@tanstack/react-router";

// Dashboard removed — /admin now lands on the Notices section.
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/notices" });
  },
  component: () => null,
});
