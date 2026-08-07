#!/usr/bin/env node

/**
 * Safety-gated Reddit auto-engage (browser session — local/VPS only).
 * Reads reports/reddit-opportunities.md, spreads a few comments across a
 * ~30m session with lurk/API fetches that never comment.
 */

import { loadProjectEnv, envFlag, sleep, randomInt } from "./lib/env.mjs";
import { loadControlsSync, applyControlsToEnv } from "./lib/marketing-controls.mjs";
import {
  loadLedgerSync,
  saveLedger,
  recordRedditAction,
  haltReddit,
  clearRedditHalt,
  ensureRedditDayPlan,
} from "./lib/publish-ledger.mjs";
import { thingIdFromPermalink } from "./lib/reddit-client.mjs";
import {
  launchRedditContext,
  ensureSession,
  getMeFromBrowser,
  submitCommentBrowser,
  isCommentVisibleBrowser,
  getProfileDir,
  profileExists,
  lurkSubredditJson,
  lurkThreadPage,
} from "./lib/reddit-browser.mjs";
import {
  evaluateRedditAction,
  accountReady,
  classifyComment,
  summarizeLedger,
  getSafetyConfig,
  ALLOWED_SUBREDDITS,
} from "./lib/reddit-safety.mjs";
import { parseRedditReport } from "./lib/parse-reddit-report.mjs";
import { postDiscordWebhook } from "./lib/discord-client.mjs";

loadProjectEnv();
applyControlsToEnv(loadControlsSync());

const DRY_RUN = envFlag("REDDIT_DRY_RUN", false);
const AUTO = envFlag("REDDIT_AUTO_POST", false) && envFlag("MARKETING_AUTO_PUBLISH", false);

async function alertWarn(reason) {
  if (!process.env.DISCORD_WEBHOOK_URL?.trim()) return;
  try {
    await postDiscordWebhook({
      content: `ℹ️ Provincia Reddit note: ${reason}`,
    });
  } catch (err) {
    console.error(`[warn] Discord alert failed: ${err.message}`);
  }
}

function pickRandom(list) {
  if (!list.length) return null;
  return list[randomInt(0, list.length - 1)];
}

/** Even-ish gaps that sum to ~spanMs (with jitter). */
function gapsForSession(commentCount, spanMs) {
  const gaps = Math.max(0, commentCount - 1);
  if (gaps === 0) return [];
  const base = spanMs / gaps;
  const raw = Array.from({ length: gaps }, () => {
    const jitter = 0.55 + Math.random() * 0.9;
    return Math.max(45_000, Math.floor(base * jitter));
  });
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  const scale = spanMs / sum;
  return raw.map((ms) => Math.max(45_000, Math.floor(ms * scale)));
}

async function runLurkBurst(context, opportunities, remaining) {
  if (!context || remaining <= 0) return 0;
  let used = 0;
  while (used < remaining) {
    const mode = Math.random();
    try {
      if (mode < 0.55) {
        const sub = pickRandom(ALLOWED_SUBREDDITS);
        console.log(`Lurk fetch: r/${sub} listing (no comment)`);
        if (!DRY_RUN) await lurkSubredditJson(context, sub, Math.random() < 0.5 ? "hot" : "new");
        used += 1;
      } else {
        const opp = pickRandom(opportunities);
        if (!opp?.link) {
          const sub = pickRandom(ALLOWED_SUBREDDITS);
          console.log(`Lurk fetch: r/${sub} listing (no comment)`);
          if (!DRY_RUN) await lurkSubredditJson(context, sub, "rising");
          used += 1;
          continue;
        }
        console.log(`Lurk open (no comment): r/${opp.subreddit} — ${opp.title}`);
        if (!DRY_RUN) {
          await lurkThreadPage(context, opp.link, {
            minMs: 2_000,
            maxMs: 12_000,
          });
        }
        used += 1;
      }
    } catch (err) {
      console.warn(`[lurk] ${err.message}`);
      used += 1;
    }
    await sleep(randomInt(1_500, 6_000));
  }
  return used;
}

async function main() {
  // Long paced sessions need a local/VPS browser profile — skip CI by default.
  if (process.env.GITHUB_ACTIONS === "true" && !envFlag("REDDIT_ALLOW_CI", false)) {
    console.log(
      "Reddit engage skipped on GitHub Actions (local/VPS only). Set REDDIT_ALLOW_CI=1 to override.",
    );
    return;
  }

  if (!AUTO && !DRY_RUN) {
    console.log(
      "Reddit auto-engage skipped. Set MARKETING_AUTO_PUBLISH=1 and REDDIT_AUTO_POST=1 (or REDDIT_DRY_RUN=1).",
    );
    return;
  }

  const config = getSafetyConfig();
  let ledger = loadLedgerSync();

  const day = ensureRedditDayPlan(ledger, config.dayRunProbability);
  ledger = day.ledger;
  await saveLedger(ledger);

  if (!day.plan.active) {
    console.log(
      `Rest day (${(config.dayRunProbability * 100).toFixed(0)}% active days) — ${day.plan.date}. Lurk-only possible later; no comments today.`,
    );
    // Still do a short lurk-only pass so rest days look like browsing.
    if (!DRY_RUN && profileExists()) {
      let context = null;
      try {
        context = await launchRedditContext({ headless: !envFlag("REDDIT_BROWSER_HEADED", false) });
        await ensureSession(context);
        const { opportunities } = parseRedditReport();
        const lurkN = Math.max(2, Math.min(4, Math.floor(config.lurkFetchesPerRun / 2)));
        await runLurkBurst(context, opportunities, lurkN);
      } catch (err) {
        console.warn(`[rest-day lurk] ${err.message}`);
      } finally {
        if (context) await context.close().catch(() => {});
      }
    }
    return;
  }

  console.log(
    `Active day ${day.plan.date}: ~${config.maxCommentsPerDay} comments over ~${config.sessionSpanMinutes}m + lurk fetches.`,
  );

  // Old hard stops → soft mode (helpful continues; promo stays blocked until cleared)
  if (ledger.reddit?.halted && (envFlag("REDDIT_CLEAR_HALT", false) || envFlag("REDDIT_SOFT_HALT", true))) {
    if (envFlag("REDDIT_CLEAR_HALT", false)) {
      console.log(`Clearing Reddit halt (was: ${ledger.reddit.haltReason})`);
      ledger = clearRedditHalt(ledger);
      await saveLedger(ledger);
    } else {
      console.log(
        `Soft halt active — helpful OK, promo blocked. Reason: ${ledger.reddit.haltReason}`,
      );
      console.log(`Clear with REDDIT_CLEAR_HALT=1 when comments are publicly visible again.`);
    }
  }

  const summary = summarizeLedger(ledger);
  console.log("Ledger:", JSON.stringify(summary));

  if (!profileExists() && !DRY_RUN) {
    console.error(
      `Reddit browser profile missing at ${getProfileDir()}. Run: pnpm reddit:login`,
    );
    process.exitCode = 1;
    return;
  }

  let context = null;
  let me = null;
  /** Warming accounts: helpful only, no promo. */
  let allowPromo = true;

  if (!DRY_RUN || profileExists()) {
    try {
      context = await launchRedditContext({ headless: !envFlag("REDDIT_BROWSER_HEADED", false) });
      const session = await ensureSession(context);
      console.log(`Browser session OK: /u/${session.username}`);
      await session.page.close().catch(() => {});
      me = await getMeFromBrowser(context, session.username);
    } catch (err) {
      console.error(`Could not open Reddit browser session: ${err.message}`);
      if (context) await context.close().catch(() => {});
      if (!DRY_RUN) {
        process.exitCode = 1;
        return;
      }
      context = null;
    }
  } else {
    console.log("[dry-run] Browser profile missing — evaluating gates only.");
  }

  if (me) {
    const ready = accountReady(me);
    if (!ready.ok) {
      allowPromo = false;
      console.log(`Promo off until warmed: ${ready.reason}`);
    } else {
      console.log(`Account ok for promo: /u/${me.name} karma≈${ready.karma} age≈${ready.ageDays.toFixed(0)}d`);
      console.log("Promo cadence: ~every 4th answer (3 helpful : 1 promo).");
    }
  }
  if (ledger.reddit?.halted) allowPromo = false;

  const { opportunities } = parseRedditReport();
  if (opportunities.length === 0) {
    console.log("No opportunities in report — lurk-only session.");
    if (context) {
      await runLurkBurst(context, [], config.lurkFetchesPerRun);
      await context.close().catch(() => {});
    }
    return;
  }

  const ranked = [...opportunities].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const commentsToday =
    (summary.today?.helpful ?? 0) + (summary.today?.promo ?? 0);
  const remainingDay = Math.max(0, config.maxCommentsPerDay - commentsToday);
  const envMax = Number(process.env.REDDIT_MAX_ACTIONS_PER_RUN ?? config.maxCommentsPerDay);
  const targetComments = Math.min(
    remainingDay,
    envMax,
    randomInt(Math.min(3, remainingDay || 1), Math.min(4, remainingDay || 1)) || 0,
  );

  if (targetComments <= 0) {
    console.log("Daily comment budget already used — lurk-only.");
    if (context) {
      await runLurkBurst(context, ranked, Math.min(config.lurkFetchesPerRun, 6));
      await context.close().catch(() => {});
    }
    return;
  }

  const spanMs = Math.max(5, config.sessionSpanMinutes) * 60_000;
  const gaps = gapsForSession(targetComments, spanMs);
  let lurkBudget = config.lurkFetchesPerRun;
  let posted = 0;

  console.log(
    `Session plan: ${targetComments} comment(s), ${config.sessionSpanMinutes}m span, ${lurkBudget} lurk fetches.`,
  );

  try {
    // Warm: browse more than you write — most opens never get a reply.
    const warmLurk = Math.min(lurkBudget, randomInt(2, Math.max(2, Math.ceil(lurkBudget * 0.4))));
    lurkBudget -= await runLurkBurst(context, ranked, warmLurk);

    for (const opp of ranked) {
      if (posted >= targetComments) break;

      const thingId = thingIdFromPermalink(opp.link);
      if (!thingId) {
        console.log(`Skip (no thing id): ${opp.title}`);
        continue;
      }

      const text = (opp.suggestedComment || "").trim();
      if (!text || text.length < 40) {
        console.log(`Skip (empty/short comment): ${opp.title}`);
        continue;
      }

      const type = classifyComment(text);
      const gate = evaluateRedditAction(ledger, {
        type,
        thingId,
        subreddit: opp.subreddit,
        title: opp.title,
        score: opp.score,
        text,
        allowPromo,
      });

      if (!gate.ok) {
        console.log(`Skip r/${opp.subreddit}: ${gate.reason}`);
        // Still “look at” some skipped threads without posting.
        if (lurkBudget > 0 && Math.random() < 0.45 && context) {
          lurkBudget -= await runLurkBurst(context, [opp], 1);
        }
        continue;
      }

      // Open the thread first, then maybe leave without commenting (read-only).
      if (context && Math.random() < 0.25 && lurkBudget > 0) {
        console.log(`Read-only pass on otherwise-eligible: r/${opp.subreddit}`);
        lurkBudget -= await runLurkBurst(context, [opp], 1);
        continue;
      }

      if (posted > 0 && gaps[posted - 1]) {
        const gap = gaps[posted - 1];
        console.log(`Pace wait ${(gap / 1000 / 60).toFixed(1)}m before next comment…`);
        const midLurk = Math.min(lurkBudget, randomInt(1, 2));
        if (midLurk > 0) {
          lurkBudget -= await runLurkBurst(context, ranked, midLurk);
        }
        await sleep(gap);
      } else {
        const delayMin = Number(process.env.REDDIT_ACTION_DELAY_MIN_MS ?? 20_000);
        const delayMax = Number(process.env.REDDIT_ACTION_DELAY_MAX_MS ?? 90_000);
        const delayMs = randomInt(Math.max(0, delayMin), Math.max(delayMin, delayMax));
        console.log(`Warm-up wait ${(delayMs / 1000).toFixed(0)}s…`);
        await sleep(delayMs);
      }

      console.log(
        `${DRY_RUN ? "[dry-run] Would post" : "Posting"} ${gate.type} on r/${opp.subreddit}: ${opp.title}`,
      );

      if (DRY_RUN) {
        posted += 1;
        ledger = recordRedditAction(ledger, {
          id: `dry-${thingId}`,
          type: gate.type,
          thingId,
          subreddit: opp.subreddit,
          permalink: opp.link,
          at: new Date().toISOString(),
          title: opp.title,
        });
        continue;
      }

      try {
        const result = await submitCommentBrowser(context, opp.link, text);
        console.log(`Posted: ${result.permalink ?? result.name ?? opp.link}`);

        ledger = recordRedditAction(ledger, {
          id: result.name ?? `${thingId}-${Date.now()}`,
          type: gate.type,
          thingId,
          subreddit: opp.subreddit,
          permalink: result.permalink ?? opp.link,
          commentId: result.name,
          at: new Date().toISOString(),
          title: opp.title,
        });
        await saveLedger(ledger);
        posted += 1;

        if (result.name) {
          await sleep(8000);
          const visible = await isCommentVisibleBrowser(result.name, {
            permalink: result.permalink ?? opp.link,
          });
          if (!visible) {
            const reason =
              `Comment not visible logged-out after posting on ${thingId} ` +
              `(${result.permalink ?? result.name}). Continuing helpful-only until public again.`;
            ledger = haltReddit(ledger, reason);
            allowPromo = false;
            await saveLedger(ledger);
            console.warn(reason);
            await alertWarn(reason);
          } else if (ledger.reddit?.halted) {
            console.log("Comment is publicly visible — clearing soft halt (promos allowed again when warmed).");
            ledger = clearRedditHalt(ledger);
            await saveLedger(ledger);
            if (me) {
              const ready = accountReady(me);
              allowPromo = ready.ok;
            }
          }
        } else {
          console.log("[warn] Could not resolve comment id — skipped visibility check");
        }
      } catch (err) {
        if (err.code === "RATELIMIT") {
          console.error(`RATELIMIT: ${err.message}`);
          break;
        }
        console.error(`Post failed: ${err.message}`);
      }
    }

    if (lurkBudget > 0) {
      await runLurkBurst(context, ranked, lurkBudget);
    }
  } finally {
    if (context) await context.close().catch(() => {});
  }

  console.log(`Done. Comments this run: ${posted}`);
  if (!DRY_RUN) await saveLedger(ledger);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
