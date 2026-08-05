#!/usr/bin/env node

/**
 * Safety-gated Reddit auto-engage (browser session).
 * Reads reports/reddit-opportunities.md, posts at most a few comments/day via old.reddit.com.
 */

import { loadProjectEnv, envFlag, sleep, randomInt } from "./lib/env.mjs";
import { loadControlsSync, applyControlsToEnv } from "./lib/marketing-controls.mjs";
import {
  loadLedgerSync,
  saveLedger,
  recordRedditAction,
  haltReddit,
  clearRedditHalt,
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
} from "./lib/reddit-browser.mjs";
import { evaluateRedditAction, accountReady, classifyComment, summarizeLedger } from "./lib/reddit-safety.mjs";
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

async function main() {
  if (!AUTO && !DRY_RUN) {
    console.log(
      "Reddit auto-engage skipped. Set MARKETING_AUTO_PUBLISH=1 and REDDIT_AUTO_POST=1 (or REDDIT_DRY_RUN=1).",
    );
    return;
  }

  let ledger = loadLedgerSync();

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
      console.log(`Warming mode (helpful only): ${ready.reason}`);
    } else {
      console.log(`Account ok: /u/${me.name} karma≈${ready.karma} age≈${ready.ageDays.toFixed(0)}d`);
      console.log("Promo cadence: ~every 4th answer (3 helpful : 1 promo) after warming.");
    }
  }
  if (ledger.reddit?.halted) allowPromo = false;

  const { opportunities } = parseRedditReport();
  if (opportunities.length === 0) {
    console.log("No opportunities in report.");
    if (context) await context.close().catch(() => {});
    return;
  }

  const ranked = [...opportunities].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  let posted = 0;
  const maxThisRun = Number(process.env.REDDIT_MAX_ACTIONS_PER_RUN ?? 2);

  try {
    for (const opp of ranked) {
      if (posted >= maxThisRun) break;

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
        continue;
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
        const delayMin = Number(process.env.REDDIT_ACTION_DELAY_MIN_MS ?? 30_000);
        const delayMax = Number(process.env.REDDIT_ACTION_DELAY_MAX_MS ?? 120_000);
        const delayMs = randomInt(Math.max(0, delayMin), Math.max(delayMin, delayMax));
        console.log(`Waiting ${(delayMs / 1000).toFixed(0)}s…`);
        await sleep(delayMs);

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
            // Soft halt: block promo, keep helpful (genuine low-trust account behavior)
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
  } finally {
    if (context) await context.close().catch(() => {});
  }

  console.log(`Done. Actions this run: ${posted}`);
  if (!DRY_RUN) await saveLedger(ledger);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
