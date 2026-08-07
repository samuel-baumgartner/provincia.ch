import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTROLS_PATH = path.resolve(process.cwd(), "reports/marketing-controls.json");

export type MarketingControls = {
  masterPublish: boolean;
  redditAutoPost: boolean;
  xAutoPost: boolean;
  discordAutoPost: boolean;
  redditDryRun: boolean;
  socialDryRun: boolean;
  itch: {
    pageReady: boolean;
    pageUrl: string;
    coverReady: boolean;
    demoLinked: boolean;
    tagsSet: boolean;
  };
  reddit: {
    maxHelpfulPerDay: number;
    maxPromoPerDay: number;
    maxCommentsPerDay: number;
    minHelpfulPerPromo: number;
    minAccountAgeDays: number;
    minKarma: number;
    maxActionsPerRun: number;
    subCooldownHours: number;
    dayRunProbability: number;
    sessionSpanMinutes: number;
    lurkFetchesPerRun: number;
  };
  updatedAt: string | null;
  updatedBy: string | null;
};

export function defaultMarketingControls(): MarketingControls {
  return {
    masterPublish: false,
    redditAutoPost: false,
    xAutoPost: false,
    discordAutoPost: true,
    redditDryRun: false,
    socialDryRun: false,
    itch: {
      pageReady: false,
      pageUrl: "",
      coverReady: false,
      demoLinked: false,
      tagsSet: false,
    },
    reddit: {
      maxHelpfulPerDay: 3,
      maxPromoPerDay: 1,
      maxCommentsPerDay: 4,
      minHelpfulPerPromo: 3,
      minAccountAgeDays: 30,
      minKarma: 100,
      maxActionsPerRun: 4,
      subCooldownHours: 12,
      dayRunProbability: 0.8,
      sessionSpanMinutes: 30,
      lurkFetchesPerRun: 8,
    },
    updatedAt: null,
    updatedBy: null,
  };
}

export function getMarketingControlsSync(): MarketingControls {
  const base = defaultMarketingControls();
  if (!existsSync(CONTROLS_PATH)) return base;
  try {
    const raw = JSON.parse(readFileSync(CONTROLS_PATH, "utf8")) as Partial<MarketingControls>;
    return {
      ...base,
      ...raw,
      itch: { ...base.itch, ...(raw.itch ?? {}) },
      reddit: { ...base.reddit, ...(raw.reddit ?? {}) },
    };
  } catch {
    return base;
  }
}

export async function getMarketingControls(): Promise<MarketingControls> {
  return getMarketingControlsSync();
}

export async function saveMarketingControls(
  partial: Partial<MarketingControls>,
  updatedBy = "admin",
): Promise<MarketingControls> {
  const current = getMarketingControlsSync();
  const next: MarketingControls = {
    ...current,
    ...partial,
    itch: { ...current.itch, ...(partial.itch ?? {}) },
    reddit: { ...current.reddit, ...(partial.reddit ?? {}) },
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await mkdir(path.dirname(CONTROLS_PATH), { recursive: true });
  await writeFile(CONTROLS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export { CONTROLS_PATH };
