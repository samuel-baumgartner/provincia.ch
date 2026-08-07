/**
 * Shared marketing control switches (admin UI + CI scripts).
 * File: reports/marketing-controls.json
 * Env still wins when MARKETING_CONTROLS_IGNORE=1.
 */

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const CONTROLS_PATH = path.resolve(process.cwd(), "reports/marketing-controls.json");

export function defaultControls() {
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

export function loadControlsSync() {
  if (process.env.MARKETING_CONTROLS_IGNORE === "1") {
    return defaultControls();
  }
  if (!existsSync(CONTROLS_PATH)) return defaultControls();
  try {
    const raw = JSON.parse(readFileSync(CONTROLS_PATH, "utf8"));
    const base = defaultControls();
    return {
      ...base,
      ...raw,
      itch: { ...base.itch, ...(raw.itch ?? {}) },
      reddit: { ...base.reddit, ...(raw.reddit ?? {}) },
    };
  } catch {
    return defaultControls();
  }
}

export async function saveControls(partial, updatedBy = "admin") {
  const current = loadControlsSync();
  const next = {
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

/** Apply controls into process.env for scripts that still use envFlag. Does not overwrite if already set. */
export function applyControlsToEnv(controls = loadControlsSync()) {
  if (process.env.MARKETING_CONTROLS_IGNORE === "1") return;

  const setIfEmpty = (key, value) => {
    const cur = process.env[key];
    if (cur !== undefined && String(cur).trim() !== "") return;
    process.env[key] = value ? "1" : "0";
  };

  setIfEmpty("MARKETING_AUTO_PUBLISH", Boolean(controls.masterPublish));
  setIfEmpty("REDDIT_AUTO_POST", Boolean(controls.redditAutoPost));
  setIfEmpty("X_AUTO_POST", Boolean(controls.xAutoPost));
  setIfEmpty("DISCORD_AUTO_POST", Boolean(controls.discordAutoPost));
  setIfEmpty("REDDIT_DRY_RUN", Boolean(controls.redditDryRun));
  setIfEmpty("SOCIAL_DRY_RUN", Boolean(controls.socialDryRun));

  const r = controls.reddit ?? {};
  const setNumIfEmpty = (key, value) => {
    const cur = process.env[key];
    if (cur !== undefined && String(cur).trim() !== "") return;
    if (value == null) return;
    process.env[key] = String(value);
  };
  setNumIfEmpty("REDDIT_MAX_HELPFUL_PER_DAY", r.maxHelpfulPerDay);
  setNumIfEmpty("REDDIT_MAX_PROMO_PER_DAY", r.maxPromoPerDay);
  setNumIfEmpty("REDDIT_MAX_COMMENTS_PER_DAY", r.maxCommentsPerDay);
  setNumIfEmpty("REDDIT_MIN_HELPFUL_PER_PROMO", r.minHelpfulPerPromo);
  setNumIfEmpty("REDDIT_MIN_ACCOUNT_AGE_DAYS", r.minAccountAgeDays);
  setNumIfEmpty("REDDIT_MIN_KARMA", r.minKarma);
  setNumIfEmpty("REDDIT_MAX_ACTIONS_PER_RUN", r.maxActionsPerRun);
  setNumIfEmpty("REDDIT_SUB_COOLDOWN_HOURS", r.subCooldownHours);
  setNumIfEmpty("REDDIT_DAY_RUN_PROBABILITY", r.dayRunProbability);
  setNumIfEmpty("REDDIT_SESSION_SPAN_MINUTES", r.sessionSpanMinutes);
  setNumIfEmpty("REDDIT_LURK_FETCHES_PER_RUN", r.lurkFetchesPerRun);
}
