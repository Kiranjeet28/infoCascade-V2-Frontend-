import { createServerFn } from "@tanstack/react-start";

export type VisitorStats = {
  today: number;
  yesterday: number;
  all: number;
  online: number;
};

// Both counters are read live and summed, so the historic views stay dynamic
// instead of being frozen at a hardcoded number.
const COUNTER_IDS = ["1383063", "1607868"] as const;

function extractNumber(html: string, label: string): number {
  const re = new RegExp(
    `<td[^>]*>\\s*${label}\\s*</td>\\s*<td[^>]*>\\s*([\\d,\\.]+)\\s*</td>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return 0;
  return Number.parseInt(m[1].replace(/[,\.]/g, ""), 10) || 0;
}

async function fetchCounter(id: string): Promise<VisitorStats> {
  try {
    const res = await fetch(
      `https://www.freevisitorcounters.com/en/home/stats/id/${id}?t=${Date.now()}`,
      {
        headers: { "user-agent": "Mozilla/5.0 InfoCascade", "cache-control": "no-cache" },
        cache: "no-store",
      },
    );
    const html = await res.text();
    return {
      today: extractNumber(html, "Today"),
      yesterday: extractNumber(html, "Yesterday"),
      all: extractNumber(html, "All"),
      online: extractNumber(html, "Online"),
    };
  } catch {
    return { today: 0, yesterday: 0, all: 0, online: 0 };
  }
}

export const getVisitorStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisitorStats> => {
    const results = await Promise.all(COUNTER_IDS.map(fetchCounter));
    return results.reduce<VisitorStats>(
      (acc, s) => ({
        today: acc.today + s.today,
        yesterday: acc.yesterday + s.yesterday,
        all: acc.all + s.all,
        online: acc.online + s.online,
      }),
      { today: 0, yesterday: 0, all: 0, online: 0 },
    );
  },
);
