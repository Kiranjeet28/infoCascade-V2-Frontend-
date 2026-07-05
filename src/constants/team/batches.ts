/**
 * Team batch configuration.
 *
 * Add new batches here as they join. The list is rendered in the team page
 * dropdown in the order defined below (newest / currently-working batch first).
 *
 * Example — when the 2028 batch joins:
 *   { value: "2028", label: "Batch 2028" },
 *   ...existing entries
 */

export interface TeamBatchOption {
  /** Batch year as stored on the team member record (e.g. "2027"). */
  value: string;
  /** Human-readable label shown in the dropdown. */
  label: string;
}

export const TEAM_BATCHES: TeamBatchOption[] = [
  { value: "2027", label: "Batch 2027" },
  { value: "2026", label: "Batch 2026" },
];

/** Default batch shown when the team page first loads. */
export const DEFAULT_TEAM_BATCH = TEAM_BATCHES[0]?.value ?? "";
