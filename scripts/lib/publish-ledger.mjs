import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const LEDGER_PATH = path.resolve(process.cwd(), "reports/publish-ledger.json");

function emptyLedger() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    reddit: {
      halted: false,
      haltReason: null,
      actions: [],
      postedThingIds: [],
    },
    social: {
      publishedSlugs: {},
    },
  };
}

export function loadLedgerSync() {
  if (!existsSync(LEDGER_PATH)) return emptyLedger();
  try {
    const raw = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
    return {
      ...emptyLedger(),
      ...raw,
      reddit: { ...emptyLedger().reddit, ...(raw.reddit ?? {}) },
      social: { ...emptyLedger().social, ...(raw.social ?? {}) },
    };
  } catch {
    return emptyLedger();
  }
}

export async function saveLedger(ledger) {
  const next = {
    ...ledger,
    updatedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(LEDGER_PATH), { recursive: true });
  await writeFile(LEDGER_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function actionsSince(ledger, days) {
  const cutoff = daysAgoIso(days);
  return (ledger.reddit?.actions ?? []).filter((a) => a.at >= cutoff);
}

export function hasPostedThing(ledger, thingId) {
  return (ledger.reddit?.postedThingIds ?? []).includes(thingId);
}

export function recordRedditAction(ledger, action) {
  const reddit = ledger.reddit ?? emptyLedger().reddit;
  const actions = [...(reddit.actions ?? []), action];
  const postedThingIds = [...new Set([...(reddit.postedThingIds ?? []), action.thingId].filter(Boolean))];
  return {
    ...ledger,
    reddit: {
      ...reddit,
      actions,
      postedThingIds,
    },
  };
}

export function haltReddit(ledger, reason) {
  return {
    ...ledger,
    reddit: {
      ...(ledger.reddit ?? emptyLedger().reddit),
      halted: true,
      haltReason: reason,
    },
  };
}

export function clearRedditHalt(ledger) {
  return {
    ...ledger,
    reddit: {
      ...(ledger.reddit ?? emptyLedger().reddit),
      halted: false,
      haltReason: null,
    },
  };
}

export function markSocialPublished(ledger, slug, channels) {
  const social = ledger.social ?? emptyLedger().social;
  const prev = social.publishedSlugs?.[slug] ?? {};
  return {
    ...ledger,
    social: {
      ...social,
      publishedSlugs: {
        ...(social.publishedSlugs ?? {}),
        [slug]: {
          ...prev,
          ...channels,
          at: new Date().toISOString(),
        },
      },
    },
  };
}

export function isSlugPublished(ledger, slug) {
  return Boolean(ledger.social?.publishedSlugs?.[slug]);
}
