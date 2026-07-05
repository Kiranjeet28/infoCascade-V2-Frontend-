/**
 * Hiring batch configuration.
 *
 * Batches are computed dynamically from the current year so the hiring form
 * always advertises the upcoming intakes without a manual update every year.
 *
 * Rule: show the next 3 admission batches, starting 2 years ahead of the
 * current year. e.g. in 2026 the form offers 2028, 2029, 2030.
 *
 * Tweak `BATCH_OFFSET_START` / `BATCH_COUNT` below to change the window.
 */

export const BATCH_OFFSET_START = 2;
export const BATCH_COUNT = 3;

export function getHiringBatches(now: Date = new Date()): string[] {
  const year = now.getFullYear();
  return Array.from({ length: BATCH_COUNT }, (_, i) =>
    String(year + BATCH_OFFSET_START + i),
  );
}

export const HIRING_BATCHES = getHiringBatches();
export const LATEST_HIRING_BATCH = HIRING_BATCHES[HIRING_BATCHES.length - 1];
export const DEFAULT_HIRING_BATCH = HIRING_BATCHES[0];
