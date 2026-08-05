import { actionsSince, hasPostedThing } from "./publish-ledger.mjs";
import { loadControlsSync } from "./marketing-controls.mjs";

const PROMO_PATTERNS = [
  /provincia\.ch/i,
  /wishlist/i,
  /steam/i,
  /our game/i,
  /my game/i,
  /check out.*provincia/i,
];

/** Subs allowed for auto-engage / rare self-posts. */
export const ALLOWED_SUBREDDITS = [
  "gamedev",
  "indiegames",
  "IndieDev",
  "citybuilder",
  "tycoon",
  "timberborn",
];

/** Self-posts only go here (rare). */
export const SELF_POST_SUBREDDITS = ["IndieDev", "indiegames"];

const HARD_SKIP_TITLE = [
  /mod\s*application/i,
  /hiring/i,
  /job\s*posting/i,
  /giveaway/i,
  /\bi\s*made\s*(this|a game)\b/i,
];

export function classifyComment(text) {
  return PROMO_PATTERNS.some((re) => re.test(text)) ? "promo" : "helpful";
}

export function getSafetyConfig() {
  const controls = loadControlsSync();
  const r = controls.reddit ?? {};
  return {
    minAccountAgeDays: Number(process.env.REDDIT_MIN_ACCOUNT_AGE_DAYS ?? r.minAccountAgeDays ?? 30),
    minKarma: Number(process.env.REDDIT_MIN_KARMA ?? r.minKarma ?? 100),
    maxPromoPerDay: Number(process.env.REDDIT_MAX_PROMO_PER_DAY ?? r.maxPromoPerDay ?? 1),
    maxHelpfulPerDay: Number(process.env.REDDIT_MAX_HELPFUL_PER_DAY ?? r.maxHelpfulPerDay ?? 3),
    maxSelfPostPerWeek: Number(process.env.REDDIT_MAX_SELF_POST_PER_WEEK ?? 1),
    minScore: Number(process.env.REDDIT_AUTO_MIN_SCORE ?? 55),
    promoRatioWindowDays: 30,
    /** Helpful comments required per promo (~every 4th answer = 3:1). */
    minHelpfulPerPromo: Number(process.env.REDDIT_MIN_HELPFUL_PER_PROMO ?? r.minHelpfulPerPromo ?? 3),
    subredditCooldownHours: Number(process.env.REDDIT_SUB_COOLDOWN_HOURS ?? r.subCooldownHours ?? 12),
  };
}

export function accountReady(me, config = getSafetyConfig()) {
  if (!me) return { ok: false, reason: "Could not load Reddit account (/api/v1/me)" };
  const created = Number(me.created_utc ?? 0) * 1000;
  const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  const karma = Number(me.link_karma ?? 0) + Number(me.comment_karma ?? 0);

  if (ageDays < config.minAccountAgeDays) {
    return {
      ok: false,
      reason: `Account age ${ageDays.toFixed(1)}d < required ${config.minAccountAgeDays}d — warm the account manually first`,
    };
  }
  if (karma < config.minKarma) {
    return {
      ok: false,
      reason: `Karma ${karma} < required ${config.minKarma} — participate manually before auto-posting`,
    };
  }
  return { ok: true, ageDays, karma };
}

function countByType(actions, type) {
  return actions.filter((a) => a.type === type).length;
}

/**
 * Evaluate whether a planned Reddit action is allowed.
 * Returns { ok, reason, type }.
 *
 * plan.allowPromo === false → helpful-only mode (warming / new account).
 */
export function evaluateRedditAction(ledger, plan, config = getSafetyConfig()) {
  const type = plan.type ?? classifyComment(plan.text ?? "");
  const subreddit = plan.subreddit;
  const thingId = plan.thingId;

  // Soft halt: still allow helpful, block promo only (genuine warm-up behavior)
  if (ledger.reddit?.halted && type === "promo") {
    return {
      ok: false,
      reason: `Promo blocked while halted: ${ledger.reddit.haltReason ?? "unknown"}`,
      type,
    };
  }

  if (!ALLOWED_SUBREDDITS.map((s) => s.toLowerCase()).includes(String(subreddit).toLowerCase())) {
    return { ok: false, reason: `Subreddit r/${subreddit} not in allowlist`, type };
  }

  if (plan.title && HARD_SKIP_TITLE.some((re) => re.test(plan.title))) {
    return { ok: false, reason: "Title matches hard-skip pattern", type };
  }

  if (thingId && hasPostedThing(ledger, thingId)) {
    return { ok: false, reason: `Already posted on ${thingId}`, type };
  }

  if (typeof plan.score === "number" && plan.score < config.minScore) {
    return { ok: false, reason: `Score ${plan.score} below min ${config.minScore}`, type };
  }

  if (type === "promo" && plan.allowPromo === false) {
    return { ok: false, reason: "Promo blocked — account still warming (helpful only)", type };
  }

  const dayActions = actionsSince(ledger, 1);
  const weekActions = actionsSince(ledger, 7);
  const windowActions = actionsSince(ledger, config.promoRatioWindowDays);

  const promoToday = countByType(dayActions, "promo");
  const helpfulToday = countByType(dayActions, "helpful");
  const selfThisWeek = countByType(weekActions, "self_post");

  if (type === "promo" && promoToday >= config.maxPromoPerDay) {
    return { ok: false, reason: `Promo daily cap reached (${config.maxPromoPerDay})`, type };
  }
  if (type === "helpful" && helpfulToday >= config.maxHelpfulPerDay) {
    return { ok: false, reason: `Helpful daily cap reached (${config.maxHelpfulPerDay})`, type };
  }
  if (type === "self_post" && selfThisWeek >= config.maxSelfPostPerWeek) {
    return { ok: false, reason: `Self-post weekly cap reached (${config.maxSelfPostPerWeek})`, type };
  }

  const lastInSub = [...(ledger.reddit?.actions ?? [])]
    .reverse()
    .find((a) => a.subreddit?.toLowerCase() === String(subreddit).toLowerCase());
  if (lastInSub) {
    const hours = (Date.now() - new Date(lastInSub.at).getTime()) / (1000 * 60 * 60);
    if (hours < config.subredditCooldownHours) {
      return {
        ok: false,
        reason: `Subreddit cooldown: last action in r/${subreddit} ${hours.toFixed(1)}h ago`,
        type,
      };
    }
  }

  // ~every 4th answer: need minHelpfulPerPromo helpful per promo (default 3:1)
  if (type === "promo") {
    const helpful = countByType(windowActions, "helpful");
    const promoAfter = countByType(windowActions, "promo") + 1;
    const need = config.minHelpfulPerPromo * promoAfter;
    if (helpful < need) {
      return {
        ok: false,
        reason: `Promo cadence: need ${need} helpful before promo #${promoAfter} (have ${helpful}; ~every 4th)`,
        type,
      };
    }
  }

  if (type === "self_post") {
    const allowed = SELF_POST_SUBREDDITS.map((s) => s.toLowerCase());
    if (!allowed.includes(String(subreddit).toLowerCase())) {
      return { ok: false, reason: `Self-posts not allowed in r/${subreddit}`, type };
    }
  }

  // Reject promo that is mostly a pitch (very short answer + link)
  if (type === "promo" && plan.text) {
    const text = plan.text.trim();
    const withoutUrls = text.replace(/https?:\/\/\S+/gi, "").trim();
    if (withoutUrls.length < 80) {
      return { ok: false, reason: "Promo comment too thin after removing URLs", type };
    }
  }

  return { ok: true, type };
}

export function summarizeLedger(ledger, config = getSafetyConfig()) {
  const day = actionsSince(ledger, 1);
  const window = actionsSince(ledger, config.promoRatioWindowDays);
  return {
    halted: Boolean(ledger.reddit?.halted),
    haltReason: ledger.reddit?.haltReason ?? null,
    today: {
      promo: countByType(day, "promo"),
      helpful: countByType(day, "helpful"),
      self_post: countByType(day, "self_post"),
    },
    last30d: {
      promo: countByType(window, "promo"),
      helpful: countByType(window, "helpful"),
      self_post: countByType(window, "self_post"),
    },
    postedThingCount: (ledger.reddit?.postedThingIds ?? []).length,
    publishedSlugs: Object.keys(ledger.social?.publishedSlugs ?? {}),
    updatedAt: ledger.updatedAt ?? null,
  };
}
