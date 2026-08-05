import { readFile } from "node:fs/promises";
import path from "node:path";

const LEDGER_PATH = path.resolve(process.cwd(), "reports/publish-ledger.json");

export type PublishLedger = {
  version: number;
  updatedAt: string | null;
  reddit: {
    halted: boolean;
    haltReason: string | null;
    actions: Array<{
      id: string;
      type: string;
      thingId?: string;
      subreddit?: string;
      permalink?: string;
      at: string;
      title?: string;
    }>;
    postedThingIds: string[];
  };
  social: {
    publishedSlugs: Record<string, Record<string, unknown>>;
  };
};

export async function getPublishLedger(): Promise<PublishLedger | null> {
  try {
    const raw = await readFile(LEDGER_PATH, "utf8");
    return JSON.parse(raw) as PublishLedger;
  } catch {
    return null;
  }
}

export function summarizePublishLedger(ledger: PublishLedger | null) {
  if (!ledger) {
    return {
      halted: false,
      haltReason: null as string | null,
      today: { promo: 0, helpful: 0, self_post: 0 },
      last30d: { promo: 0, helpful: 0, self_post: 0 },
      publishedSlugs: [] as string[],
      recentActions: [] as PublishLedger["reddit"]["actions"],
      updatedAt: null as string | null,
    };
  }

  const cutoff1 = Date.now() - 24 * 60 * 60 * 1000;
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const actions = ledger.reddit?.actions ?? [];

  const count = (since: number, type: string) =>
    actions.filter((a) => a.type === type && new Date(a.at).getTime() >= since).length;

  return {
    halted: Boolean(ledger.reddit?.halted),
    haltReason: ledger.reddit?.haltReason ?? null,
    today: {
      promo: count(cutoff1, "promo"),
      helpful: count(cutoff1, "helpful"),
      self_post: count(cutoff1, "self_post"),
    },
    last30d: {
      promo: count(cutoff30, "promo"),
      helpful: count(cutoff30, "helpful"),
      self_post: count(cutoff30, "self_post"),
    },
    publishedSlugs: Object.keys(ledger.social?.publishedSlugs ?? {}),
    recentActions: [...actions].reverse().slice(0, 8),
    updatedAt: ledger.updatedAt,
  };
}
