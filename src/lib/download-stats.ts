import { downloadBuilds, downloadReleaseTag } from "@/lib/game-content";

const KNOWN_SOURCES = new Set([
  "discord",
  "reddit",
  "x",
  "twitter",
  "devtalk",
  "steam",
  "direct",
  "unknown",
]);

export type DownloadPlatform = (typeof downloadBuilds)[number]["id"];

export function getDownloadRedirectUrl(platform: string): string | null {
  const build = downloadBuilds.find((b) => b.id === platform);
  return build?.href ?? null;
}

export function normalizeSource(raw: string | null | undefined): string {
  if (!raw) return "unknown";
  const s = raw.trim().toLowerCase().slice(0, 64);
  if (!s) return "unknown";
  if (s === "twitter") return "x";
  if (KNOWN_SOURCES.has(s)) return s;
  // Hostnames from referrer → coarse bucket
  if (s.includes("reddit")) return "reddit";
  if (s.includes("discord")) return "discord";
  if (s.includes("twitter") || s === "t.co" || s.includes("x.com")) return "x";
  if (s.includes("steam")) return "steam";
  if (s.includes("github")) return "github";
  if (/^[a-z0-9_-]+$/.test(s)) return s.slice(0, 32);
  return "unknown";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function counterKey(day: string, platform: string, source: string) {
  return `dl:${day}:${platform}:${source}`;
}

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

async function upstashCommand(command: string[]): Promise<unknown> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!base || !token) return null;

  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`Upstash ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }

  const json = (await res.json()) as { result?: unknown };
  return json.result ?? null;
}

async function upstashPipeline(commands: string[][]): Promise<unknown[] | null> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!base || !token) return null;

  const res = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`Upstash pipeline ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }

  const json = (await res.json()) as { result?: unknown }[];
  return Array.isArray(json) ? json.map((r) => r.result) : null;
}

/** Increment download counter. Never throws — download redirect must not fail. */
export async function trackDownload(platform: string, source: string): Promise<void> {
  if (!upstashConfigured()) return;
  if (!downloadBuilds.some((b) => b.id === platform)) return;

  const day = todayKey();
  const src = normalizeSource(source);
  const key = counterKey(day, platform, src);

  try {
    await upstashPipeline([
      ["INCR", key],
      ["SADD", "dl:days", day],
      ["SADD", `dl:sources:${day}`, src],
      ["SADD", "dl:platforms", platform],
    ]);
  } catch (err) {
    console.error("trackDownload failed", err);
  }
}

export type DownloadStats = {
  configured: boolean;
  releaseTag: string;
  days: string[];
  byPlatform: Record<string, number>;
  bySource: Record<string, number>;
  byDayPlatform: Record<string, Record<string, number>>;
  byDaySource: Record<string, Record<string, number>>;
  total: number;
};

export async function getDownloadStats(dayCount = 30): Promise<DownloadStats> {
  const empty: DownloadStats = {
    configured: upstashConfigured(),
    releaseTag: downloadReleaseTag,
    days: [],
    byPlatform: Object.fromEntries(downloadBuilds.map((b) => [b.id, 0])),
    bySource: {},
    byDayPlatform: {},
    byDaySource: {},
    total: 0,
  };

  if (!upstashConfigured()) return empty;

  try {
    const daysRaw = (await upstashCommand(["SMEMBERS", "dl:days"])) as string[] | null;
    const days = (daysRaw ?? []).filter(Boolean).sort().reverse().slice(0, dayCount);

    if (days.length === 0) return empty;

    const platforms = downloadBuilds.map((b) => b.id);
    const commands: string[][] = [];
    const meta: { day: string; platform: string; source: string | null }[] = [];

    for (const day of days) {
      const sources =
        ((await upstashCommand(["SMEMBERS", `dl:sources:${day}`])) as string[] | null) ?? [];
      const srcList = sources.length > 0 ? sources : ["unknown"];
      for (const platform of platforms) {
        for (const source of srcList) {
          commands.push(["GET", counterKey(day, platform, source)]);
          meta.push({ day, platform, source });
        }
      }
    }

    const results = (await upstashPipeline(commands)) ?? [];
    const stats = { ...empty, days, byPlatform: { ...empty.byPlatform } };

    results.forEach((val, i) => {
      const n = Number(val ?? 0) || 0;
      if (n <= 0) return;
      const { day, platform, source } = meta[i];
      stats.total += n;
      stats.byPlatform[platform] = (stats.byPlatform[platform] ?? 0) + n;
      if (source) {
        stats.bySource[source] = (stats.bySource[source] ?? 0) + n;
        stats.byDaySource[day] = stats.byDaySource[day] ?? {};
        stats.byDaySource[day][source] = (stats.byDaySource[day][source] ?? 0) + n;
      }
      stats.byDayPlatform[day] = stats.byDayPlatform[day] ?? {};
      stats.byDayPlatform[day][platform] = (stats.byDayPlatform[day][platform] ?? 0) + n;
    });

    return stats;
  } catch (err) {
    console.error("getDownloadStats failed", err);
    return empty;
  }
}
