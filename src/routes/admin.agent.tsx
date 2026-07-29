import { createFileRoute } from "@tanstack/react-router";
import { SectionError } from "@/components/section-error";
import { AgentRuns } from "@/components/agent-runs";

export const Route = createFileRoute("/admin/agent")({
    component: AdminAgent,
    errorComponent: SectionError,
});

function AdminAgent() {
    return (
        <AgentRuns
            repo="Kiranjeet28/InfoCascade-Agent"
            eyebrow="Automation"
            title="Agent runs"
            queryKey="agent-runs"
        />
    );
}
