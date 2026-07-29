import { createServerFn } from "@tanstack/react-start";

export type VisitorStats = {
  today: number;
  yesterday: number;
  all: number;
  online: number;
};

const COUNTER_ID = "1607868";
// Views carried over from the previous counter before the switch.
const LEGACY_ALL_TIME = 43243;

function extractNumber(html: string, label: string): number {
  const re = new RegExp(
    `<td[^>]*>\\s*${label}\\s*</td>\\s*<td[^>]*>\\s*([\\d,\\.]+)\\s*</td>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return 0;
  return Number.parseInt(m[1].replace(/[,\.]/g, ""), 10) || 0;
}

export const getVisitorStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisitorStats> => {
    const res = await fetch(
      `https://www.freevisitorcounters.com/en/home/stats/id/${COUNTER_ID}?t=${Date.now()}`,
      {
        headers: { "user-agent": "Mozilla/5.0 InfoCascade", "cache-control": "no-cache" },
        cache: "no-store",
      },
    );
    const html = await res.text();
    return {
      today: extractNumber(html, "Today"),
      yesterday: extractNumber(html, "Yesterday"),
      all: extractNumber(html, "All") + LEGACY_ALL_TIME,
      online: extractNumber(html, "Online"),
    };
  },
);
