import { createFileRoute } from "@tanstack/react-router";
import { SectionError } from "@/components/section-error";
import { AgentRuns } from "@/components/agent-runs";

export const Route = createFileRoute("/admin/sync-timetable")({
    component: AdminSyncTimetable,
    errorComponent: SectionError,
});

function AdminSyncTimetable() {
    return (
        <AgentRuns
            repo="Kiranjeet28/infocascade-data"
            eyebrow="Automation"
            title="Sync Timetable"
            queryKey="sync-timetable-runs"
        />
    );
}
