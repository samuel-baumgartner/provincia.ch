#!/usr/bin/env node

/**
 * Publish latest social draft to Discord / X / (rare) Reddit self-post,
 * and Discord-remind for Steam (no write API).
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadProjectEnv, envFlag } from "./lib/env.mjs";
import { loadControlsSync, applyControlsToEnv } from "./lib/marketing-controls.mjs";
import {
  loadLedgerSync,
  saveLedger,
  isSlugPublished,
  markSocialPublished,
  recordRedditAction,
} from "./lib/publish-ledger.mjs";
import { discordConfigured, postDiscordWebhook, discordEmbed } from "./lib/discord-client.mjs";
import { xConfigured, postTweet } from "./lib/x-client.mjs";
import {
  redditConfigured,
  submitSelfPost,
  getMe,
} from "./lib/reddit-client.mjs";
import { evaluateRedditAction, accountReady, SELF_POST_SUBREDDITS } from "./lib/reddit-safety.mjs";

loadProjectEnv();
applyControlsToEnv(loadControlsSync());

const DRAFTS_DIR = path.resolve(process.cwd(), "reports/social-drafts");
const GAME_URL = process.env.GAME_URL ?? "https://provincia.ch";
const DEVTALK_URL = process.env.DEVTALK_URL ?? "https://provincia.ch/devtalk";
const DRY_RUN = envFlag("SOCIAL_DRY_RUN", false) || envFlag("REDDIT_DRY_RUN", false);
const AUTO = envFlag("MARKETING_AUTO_PUBLISH", false);

function withUtm(url, source, campaign) {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "social");
  if (campaign) u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

function loadLatestDraft() {
  if (!existsSync(DRAFTS_DIR)) return null;
  const files = readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => b.localeCompare(a));
  if (files.length === 0) return null;
  const raw = JSON.parse(readFileSync(path.join(DRAFTS_DIR, files[0]), "utf8"));
  return { ...raw, _file: files[0] };
}

async function publishDiscord(draft, results) {
  if (!envFlag("DISCORD_AUTO_POST", true)) {
    results.discord = { skipped: true, reason: "DISCORD_AUTO_POST=0" };
    return;
  }
  if (!discordConfigured()) {
    results.discord = { skipped: true, reason: "DISCORD_WEBHOOK_URL missing" };
    return;
  }

  const url = withUtm(`${DEVTALK_URL}/${draft.slug}`, "discord", draft.slug);
  const platform = draft.platforms?.discord ?? {
    content: `New Provincia devlog: **${draft.devtalkTitle}**`,
    embed: {
      title: draft.devtalkTitle,
      description: draft.platforms?.steam?.body?.slice(0, 400) ?? "",
      url,
    },
  };

  const payload = {
    content: platform.content ?? undefined,
    embeds: [
      discordEmbed({
        title: platform.embed?.title ?? draft.devtalkTitle,
        description: platform.embed?.description ?? "",
        url: platform.embed?.url ?? url,
      }),
    ],
  };

  if (DRY_RUN) {
    results.discord = { dryRun: true, payload };
    return;
  }

  await postDiscordWebhook(payload);
  results.discord = { ok: true, url };

  // Steam reminder (no write API)
  const steam = draft.platforms?.steam;
  if (steam?.title && steam?.body) {
    await postDiscordWebhook({
      content: `📋 **Steam reminder** (paste into Steamworks Events — no API):\n**${steam.title}**\n\`\`\`\n${steam.body.slice(0, 1800)}\n\`\`\``,
    });
    results.steamReminder = { ok: true };
  }
}

async function publishX(draft, results) {
  if (!envFlag("X_AUTO_POST", false)) {
    results.x = { skipped: true, reason: "X_AUTO_POST=0" };
    return;
  }
  if (!xConfigured()) {
    results.x = { skipped: true, reason: "X credentials missing" };
    return;
  }

  const posts = draft.platforms?.x?.posts ?? [];
  let text = posts[0] ?? `New Provincia devlog: ${draft.devtalkTitle}\n${DEVTALK_URL}/${draft.slug}`;
  // Ensure UTM on site links
  text = text.replace(
    new RegExp(`${DEVTALK_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^\\s]+`, "g"),
    (m) => {
      try {
        return withUtm(m, "x", draft.slug);
      } catch {
        return m;
      }
    },
  );
  text = text.replace(
    new RegExp(`${GAME_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w/])`, "g"),
    withUtm(GAME_URL, "x", draft.slug),
  );

  const maxPosts = Math.min(2, Number(process.env.X_MAX_POSTS_PER_DEVTALK ?? 1));
  const toPost = [text, ...posts.slice(1)].slice(0, maxPosts);

  if (DRY_RUN) {
    results.x = { dryRun: true, posts: toPost };
    return;
  }

  const ids = [];
  for (const p of toPost) {
    const r = await postTweet(p);
    ids.push(r.id);
  }
  results.x = { ok: true, ids };
}

async function publishRedditSelf(draft, results, ledger) {
  if (!envFlag("REDDIT_AUTO_POST", false)) {
    results.redditSelf = { skipped: true, reason: "REDDIT_AUTO_POST=0" };
    return ledger;
  }
  if (!redditConfigured()) {
    results.redditSelf = { skipped: true, reason: "Reddit credentials missing" };
    return ledger;
  }

  const subreddit = process.env.REDDIT_SELF_POST_SUB ?? SELF_POST_SUBREDDITS[0];
  const title = draft.platforms?.reddit?.title ?? `[Devlog] ${draft.devtalkTitle}`;
  let body = draft.platforms?.reddit?.body ?? "";
  const url = withUtm(`${DEVTALK_URL}/${draft.slug}`, "reddit", draft.slug);
  if (!body.includes(draft.slug)) {
    body = `${body}\n\n${url}`;
  } else {
    body = body.replace(`${DEVTALK_URL}/${draft.slug}`, url);
  }

  const gate = evaluateRedditAction(ledger, {
    type: "self_post",
    subreddit,
    title,
    text: body,
    thingId: `self:${draft.slug}`,
  });

  if (!gate.ok) {
    results.redditSelf = { skipped: true, reason: gate.reason };
    return ledger;
  }

  try {
    const me = await getMe();
    const ready = accountReady(me);
    if (!ready.ok) {
      results.redditSelf = { skipped: true, reason: ready.reason };
      return ledger;
    }
  } catch (err) {
    results.redditSelf = { skipped: true, reason: err.message };
    return ledger;
  }

  if (DRY_RUN) {
    results.redditSelf = { dryRun: true, subreddit, title };
    return ledger;
  }

  const posted = await submitSelfPost({ subreddit, title, text: body });
  results.redditSelf = { ok: true, url: posted.url, id: posted.name };

  return recordRedditAction(ledger, {
    id: posted.name ?? `self-${draft.slug}`,
    type: "self_post",
    thingId: `self:${draft.slug}`,
    subreddit,
    permalink: posted.url,
    at: new Date().toISOString(),
    title,
  });
}

async function main() {
  if (!AUTO && !DRY_RUN) {
    console.log("Social auto-publish skipped. Set MARKETING_AUTO_PUBLISH=1 (or SOCIAL_DRY_RUN=1).");
    return;
  }

  const draft = loadLatestDraft();
  if (!draft?.slug) {
    console.error("No social draft found. Run pnpm devtalk:distribute first.");
    process.exitCode = 1;
    return;
  }

  let ledger = loadLedgerSync();
  const force = envFlag("SOCIAL_FORCE_REPUBLISH", false);

  if (isSlugPublished(ledger, draft.slug) && !force) {
    console.log(`Slug ${draft.slug} already published (set SOCIAL_FORCE_REPUBLISH=1 to override).`);
    console.log(JSON.stringify(ledger.social.publishedSlugs[draft.slug], null, 2));
    return;
  }

  console.log(`Publishing draft: ${draft._file} (${draft.devtalkTitle})`);

  const results = {};
  await publishDiscord(draft, results);

  try {
    await publishX(draft, results);
  } catch (err) {
    results.x = { error: err.message };
    console.error(`X failed: ${err.message}`);
  }

  try {
    ledger = await publishRedditSelf(draft, results, ledger);
  } catch (err) {
    results.redditSelf = { error: err.message };
    console.error(`Reddit self-post failed: ${err.message}`);
  }

  if (!DRY_RUN) {
    ledger = markSocialPublished(ledger, draft.slug, {
      discord: results.discord?.ok ? results.discord.url : results.discord,
      x: results.x,
      reddit: results.redditSelf,
      steamReminder: results.steamReminder,
    });
    await saveLedger(ledger);
  }

  const outDir = path.resolve(process.cwd(), "reports/publish-runs");
  await mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `${stamp}-${draft.slug}.json`);
  await writeFile(outFile, JSON.stringify({ slug: draft.slug, dryRun: DRY_RUN, results }, null, 2), "utf8");

  console.log(JSON.stringify(results, null, 2));
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
