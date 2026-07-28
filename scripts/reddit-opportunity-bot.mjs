#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Load `.env.local` / `.env` into `process.env` so `pnpm reddit:scan` sees keys without `--env-file`. */
function mergeEnvFile(relPath) {
  const full = path.join(process.cwd(), relPath);
  if (!existsSync(full)) return;
  const raw = readFileSync(full, "utf8");
  for (let line of raw.split("\n")) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim().replace(/^['"]/, "").replace(/['"]$/, "");
    const cur = process.env[key];
    if (cur !== undefined && String(cur).trim() !== "") continue;
    process.env[key] = val;
  }
}

function loadProjectEnv() {
  mergeEnvFile(".env.local");
  mergeEnvFile(".env");
}

loadProjectEnv();

const BASE_URL = "https://www.reddit.com";
const USER_AGENT = "provinica-opportunity-bot/0.1 (by u/provinica)";
const NOW = Date.now();
const MAX_AGE_HOURS = Number(process.env.REDDIT_MAX_AGE_HOURS ?? 96);
const QUICK_MODE = process.env.REDDIT_QUICK === "1";
const DEVTALK_URL = process.env.DEVTALK_URL ?? "https://provinica.ch/devtalk";
const GAME_URL = process.env.GAME_URL ?? "https://provinica.ch";
const GAME_NAME = process.env.GAME_NAME ?? "Provinica";
const OUTPUT_FILE = path.resolve(process.cwd(), "reports/reddit-opportunities.md");
const DEV_TALKS_DIR = path.resolve(process.cwd(), "content/devtalks");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
/** Set `REDDIT_SCAN_AI_FALLBACK=1` to allow template replies when offline (default: strict OpenAI). */
const ALLOW_AI_FALLBACK = process.env.REDDIT_SCAN_AI_FALLBACK === "1";

const SUBREDDITS = [
  "gamedev",
  "indiegames",
  "IndieDev",
  "citybuilder",
  "tycoon",
  "timberborn",
];

const SEARCH_QUERIES = [
  "rome based indie game",
  "roman city builder",
  "timberborn like game",
  "looking for city builder recommendation",
  "how to promote indie game devlog",
  "feedback on indie game mechanics",
];

const OPPORTUNITY_TERMS = [
  "recommend",
  "recommendation",
  "looking for",
  "feedback",
  "question",
  "advice",
  "help",
  "what game",
  "similar to",
  "like timberborn",
  "rome",
  "roman",
  "city builder",
  "base building",
  "devlog",
  "dev talk",
];

const QUESTION_HINTS = ["?", "how", "what", "which", "does", "any", "advice"];
const SELF_PROMO_SIGNS = ["my game", "our game", "steam page", "kickstarter", "wishlist"];

function normalize(text) {
  return (text ?? "").toLowerCase();
}

function scorePost(post) {
  const title = normalize(post.title);
  const body = normalize(post.selftext);
  const combined = `${title} ${body}`;

  const ageHours = (NOW - post.created_utc * 1000) / (1000 * 60 * 60);
  if (ageHours > MAX_AGE_HOURS) return null;

  let score = 0;

  for (const term of OPPORTUNITY_TERMS) {
    if (combined.includes(term)) score += 8;
  }

  for (const hint of QUESTION_HINTS) {
    if (title.includes(hint) || body.includes(hint)) score += 4;
  }

  if (post.num_comments >= 2 && post.num_comments <= 60) score += 20;
  if (post.num_comments > 60) score -= 8;
  if (post.score >= 3 && post.score <= 250) score += 10;
  if (post.score > 250) score -= 6;
  if (ageHours <= 24) score += 16;
  if (ageHours <= 8) score += 8;

  if (["gamedev", "indiegames", "indiedev"].includes(normalize(post.subreddit))) {
    score += 12;
  }
  if (["citybuilder", "timberborn", "tycoon"].includes(normalize(post.subreddit))) {
    score += 16;
  }

  for (const phrase of SELF_PROMO_SIGNS) {
    if (combined.includes(phrase)) score -= 10;
  }

  const reason = [];
  if (combined.includes("rome") || combined.includes("roman")) reason.push("Rome/roman topic");
  if (combined.includes("timberborn")) reason.push("Timberborn-like interest");
  if (title.includes("?") || body.includes("?")) reason.push("Question format");
  if (combined.includes("feedback") || combined.includes("advice")) reason.push("Explicit feedback/advice ask");
  if (combined.includes("recommend")) reason.push("Recommendation request");
  if (reason.length === 0) reason.push("General indie/gamedev discussion fit");

  return {
    id: post.id,
    subreddit: post.subreddit,
    title: post.title,
    permalink: `https://www.reddit.com${post.permalink}`,
    score,
    ups: post.ups,
    comments: post.num_comments,
    createdUtc: post.created_utc,
    ageHours,
    reasons: reason,
    selftext: post.selftext ?? "",
  };
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((part) => part.length >= 3);
}

async function readDevTalkIndex() {
  let files = [];
  try {
    files = await readdir(DEV_TALKS_DIR);
  } catch {
    return [];
  }

  const talks = [];
  for (const file of files) {
    if (!file.endsWith(".md") || file.toLowerCase() === "readme.md") continue;
    const slug = file.replace(/\.md$/, "");
    const raw = await readFile(path.join(DEV_TALKS_DIR, file), "utf8");
    const title = raw.match(/^title:\s*"?(.*?)"?$/m)?.[1] ?? slug;
    const excerpt = raw.match(/^excerpt:\s*"?(.*?)"?$/m)?.[1] ?? "";
    const tags = [...raw.matchAll(/^\s*-\s+([a-zA-Z0-9-]+)/gm)].map((item) => item[1]);
    talks.push({
      slug,
      title,
      excerpt,
      tags,
      link: `${DEVTALK_URL}/${slug}`,
      tokens: new Set(tokenize(`${title} ${excerpt} ${tags.join(" ")}`)),
    });
  }
  return talks;
}

function pickRelevantDevTalk(post, talks) {
  const postTokens = new Set(tokenize(`${post.title} ${post.selftext}`));
  let best = null;
  let bestScore = 0;

  for (const talk of talks) {
    let overlap = 0;
    for (const token of talk.tokens) {
      if (postTokens.has(token)) overlap += 1;
    }
    if (overlap > bestScore) {
      best = talk;
      bestScore = overlap;
    }
  }

  return bestScore >= 4 ? best : null;
}

async function fetchJson(url) {
  const maxAttempts = QUICK_MODE ? 1 : 3;
  const timeoutMs = QUICK_MODE ? 5000 : 12_000;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Fetch failed (${response.status})`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Fetch failed after ${maxAttempts} attempts: ${url} (${lastError?.message ?? "unknown"})`);
}

function extractPosts(json) {
  const children = json?.data?.children ?? [];
  return children.map((item) => item.data).filter(Boolean);
}

async function fetchSubredditNew(subreddit) {
  console.log(`Scanning r/${subreddit}...`);
  const url = `${BASE_URL}/r/${encodeURIComponent(subreddit)}/new.json?limit=60`;
  const json = await fetchJson(url);
  return extractPosts(json);
}

async function fetchSearch(query) {
  console.log(`Searching "${query}"...`);
  const subredditFilter = SUBREDDITS.map((name) => `subreddit:${name}`).join(" OR ");
  const params = new URLSearchParams({
    q: `(${query}) (${subredditFilter})`,
    sort: "new",
    t: "week",
    type: "link",
    limit: "50",
  });
  const url = `${BASE_URL}/search.json?${params.toString()}`;
  const json = await fetchJson(url);
  return extractPosts(json);
}

function dedupe(posts) {
  const map = new Map();
  for (const post of posts) {
    if (!map.has(post.id)) map.set(post.id, post);
  }
  return [...map.values()];
}

function stableVariantIndex(seed, modulo) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
  }
  return Math.abs(h) % modulo;
}

/** One natural outbound link: devtalk when it fits, otherwise game (never canned "Related devtalk"). */
function naturalGameAndLinkSentence(postId, matchedTalk) {
  const i = stableVariantIndex(postId, matchedTalk ? 5 : 4);

  if (matchedTalk) {
    const talkTitle = matchedTalk.title.length > 80 ? `${matchedTalk.title.slice(0, 77)}...` : matchedTalk.title;
    const withDevtalk = [
      `I'm building ${GAME_NAME} along similar lines; I went deeper on "${talkTitle}" here: ${matchedTalk.link}`,
      `In ${GAME_NAME} I'm solving a slice of this; wrote it up briefly (${talkTitle}): ${matchedTalk.link}`,
      `${GAME_NAME} is where I'm applying this; I summarized the angle in "${talkTitle}": ${matchedTalk.link}`,
    ];
    const withGameOnly = [
      `I'm currently building ${GAME_NAME} (${GAME_URL}) and ran into overlapping constraints; happy if anything there matches how you're thinking.`,
      `Same problem space on ${GAME_NAME}, worth a skim if you want another take: ${GAME_URL}`,
    ];
    const useTalkLink = stableVariantIndex(`${postId}-link`, 3) !== 0;
    if (useTalkLink) return withDevtalk[stableVariantIndex(postId + "dt", withDevtalk.length)];
    return withGameOnly[stableVariantIndex(postId + "g", withGameOnly.length)];
  }

  const gameOnly = [
    `I'm actively building ${GAME_NAME} around this kind of constraint; ideas on the site if useful: ${GAME_URL}`,
    `I'm working on ${GAME_NAME}; we shaped our loop similarly. You can see where we're headed here: ${GAME_URL}`,
    `Personally I'm shipping toward this on ${GAME_NAME} (${GAME_URL}) if another data point helps.`,
    `On ${GAME_NAME} we tackled a related slice; might give you comparison material: ${GAME_URL}`,
  ];
  return gameOnly[i % gameOnly.length];
}

function fallbackCommentTemplate(post, matchedTalk) {
  const title = normalize(post.title);

  let opener = "Good question.";
  if (title.includes("feedback")) opener = "Great post for feedback.";
  if (title.includes("advice")) opener = "Solid question.";
  if (title.includes("recommend")) opener = "If you want recommendations, this might help.";

  let topicLine = "I'd start narrow: prototype one readable loop until it sticks, then add systems.";
  if (title.includes("rome") || title.includes("roman")) {
    topicLine = "I'd nail the macro loop (supply → housing → growth) before Roman flavor so balance stays sane.";
  } else if (title.includes("timberborn")) {
    topicLine = "I'd keep production graphs legible early; readable bottlenecks beat raw depth at first.";
  } else if (
    title.includes("visibility") ||
    title.includes("marketing") ||
    title.includes("tiktok") ||
    title.includes("youtube")
  ) {
    topicLine = "One mechanic + visible payoff per clip beats broad trailers early on.";
  } else if (title.includes("idea") || title.includes("design")) {
    topicLine = "Freeze one pillar for a sprint, prototype, then kill or sharpen based on how it feels.";
  }

  const bridge = naturalGameAndLinkSentence(post.id, matchedTalk);

  return `${opener} ${topicLine} ${bridge}`;
}

function extractChatCompletionText(json) {
  const message = json?.choices?.[0]?.message;
  const content = message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
}

async function generateAiComment(post, matchedTalk) {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!key) {
    if (ALLOW_AI_FALLBACK) return fallbackCommentTemplate(post, matchedTalk);
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to .env.local (or `.env`), or pass it in your shell.",
    );
  }

  const system = [
    "You ghost-write Reddit replies for one indie developer. Voice is the important part.",
    "",
    `When you name the game, spell it exactly: ${GAME_NAME}.`,
    "",
    "Sound human (not ChatGPT):",
    "- Write like you're half-watching youtube and typing thumbs / keyboard: short clauses, contractions, lowercase i is OK.",
    "- No motivational-coach preamble. Do NOT open with empathic filler like \"It sounds like\", \"You've got solid…\", \"You've poured…\", \"it's a shame\", \"sorry to hear\", \"I hear you\", \"That's valid\".",
    "- No symmetrical essay structure. Prefer 1 chunky paragraph OR 2 uneven ones; skip neat topic sentences and conclusions.",
    "- Be specific to THEIR title/body: quote or paraphrase one concrete detail so it clearly isn't copy-paste.",
    "- One clear opinion or move (\"I'd do X because Y\"), not a laundry list.",
    `- If you mention your game, tuck it into the same breath as advice ("yeah on ${GAME_NAME} we basically…") instead of a second "pitch" paragraph.`,
    "",
    "Banned GPT tells (never use): delve, tapestry, landscape, resonates, nuanced, impactful, synergies, actionable, furthermore, cohesive, moreover, streamline, elevate, fostering, empowers, leverages, leveraging, testament, underscores, aligns with, pivotal, granular, paradigm, plethora, delve into.",
    "",
    "Links:",
    "- At most ONE URL in the reply total.",
    `  • If candidate devtalk is clearly on-topic, use THAT url alone.`,
    `  • Else use game url only.`,
    "- No \"Related devtalk\" framing; drop the link inline like you'd paste mid-sentence.",
    "",
    `Game URL: ${GAME_URL}`,
    matchedTalk
      ? `Candidate devtalk (only if it actually matches thread): "${matchedTalk.title}" -> ${matchedTalk.link}`
      : "Candidate devtalk: none (game URL only if you include one).",
    "",
    "Format: plain Reddit text only. No bullets / numbering / hashtags / emojis.",
    "Never use em dashes (Unicode U+2014). Use a comma, period, parentheses, or a normal hyphen '-' instead.",
  ].join("\n");

  const userPrompt = [
    `Subreddit: r/${post.subreddit}`,
    "",
    "[Thread title]",
    post.title,
    "",
    "[Thread body]",
    (post.selftext || "").slice(0, 12_000) || "(empty)",
    "",
    "Write ONLY the Reddit comment. Keep it punchy (about 80 to 220 words max). Avoid assistant tone.",
  ].join("\n");

  let lastErr;
  const attempts = ALLOW_AI_FALLBACK ? 3 : 4;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.88,
          frequency_penalty: 0.35,
          presence_penalty: 0.1,
          max_tokens: 320,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = json?.error?.message ?? JSON.stringify(json).slice(0, 400);
        lastErr = new Error(`OpenAI ${response.status}: ${errMsg}`);
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }

      const text = extractChatCompletionText(json);
      if (text) return text;

      lastErr = new Error("OpenAI returned empty message content");
      await new Promise((r) => setTimeout(r, 600 * attempt));
    } catch (error) {
      lastErr = error;
      await new Promise((r) => setTimeout(r, 600 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (ALLOW_AI_FALLBACK) {
    console.error(`[warn] OpenAI failed after retries: ${lastErr?.message ?? "unknown"}`);
    return fallbackCommentTemplate(post, matchedTalk);
  }

  throw new Error(`OpenAI failed after ${attempts} attempts: ${lastErr?.message ?? "unknown"}`);
}

function formatAge(hours) {
  if (hours < 1) return "<1h";
  return `${Math.round(hours)}h`;
}

function makeReport(opportunities, scannedStats) {
  const lines = [];
  lines.push("# Reddit Opportunity Scan");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Max age: ${MAX_AGE_HOURS}h`);
  lines.push("");
  lines.push("## Scan Summary");
  lines.push("");
  lines.push(`- Subreddits scanned: ${SUBREDDITS.join(", ")}`);
  lines.push(`- Search queries scanned: ${SEARCH_QUERIES.length}`);
  lines.push(`- Raw posts fetched: ${scannedStats.raw}`);
  lines.push(`- Unique posts: ${scannedStats.unique}`);
  lines.push(`- Scored opportunities: ${opportunities.length}`);
  lines.push("");
  lines.push("## Best Threads To Engage");
  lines.push("");

  if (opportunities.length === 0) {
    lines.push("No promising posts found in current window. Increase `REDDIT_MAX_AGE_HOURS` and rerun.");
    return lines.join("\n");
  }

  opportunities.forEach((post, index) => {
    lines.push(`### ${index + 1}. [r/${post.subreddit}] ${post.title}`);
    lines.push("");
    lines.push(`- Link: ${post.permalink}`);
    lines.push(`- Opportunity score: ${post.score}`);
    lines.push(`- Post activity: ${post.ups} upvotes, ${post.comments} comments, age ${formatAge(post.ageHours)}`);
    lines.push(`- Why this is promising: ${post.reasons.join("; ")}`);
    lines.push(`- Matching devtalk: ${post.devtalkLink ?? "none"}`);
    lines.push("- Suggested comment:");
    lines.push("");
    lines.push(`> ${post.suggestedComment}`);
    lines.push("");
  });

  return lines.join("\n");
}

async function run() {
  const allPosts = [];
  const subredditsToScan = QUICK_MODE ? SUBREDDITS.slice(0, 2) : SUBREDDITS;
  const queriesToScan = QUICK_MODE ? SEARCH_QUERIES.slice(0, 2) : SEARCH_QUERIES;

  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!apiKey && !ALLOW_AI_FALLBACK) {
    console.error(
      "OPENAI_API_KEY is required for `pnpm reddit:scan`. Add OPENAI_API_KEY to `.env.local` (loaded automatically), or export it in your shell. For offline template replies instead, set REDDIT_SCAN_AI_FALLBACK=1.",
    );
    process.exitCode = 1;
    return;
  }

  for (const subreddit of subredditsToScan) {
    try {
      const posts = await fetchSubredditNew(subreddit);
      allPosts.push(...posts);
    } catch (error) {
      console.error(`[warn] Could not fetch r/${subreddit}: ${error.message}`);
    }
  }

  for (const query of queriesToScan) {
    try {
      const posts = await fetchSearch(query);
      allPosts.push(...posts);
    } catch (error) {
      console.error(`[warn] Could not fetch search query "${query}": ${error.message}`);
    }
  }

  const uniquePosts = dedupe(allPosts);
  const talks = await readDevTalkIndex();
  const scoredBase = uniquePosts
    .map(scorePost)
    .filter(Boolean)
    .filter((item) => item.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  const scored = [];
  for (const post of scoredBase) {
    const matchedTalk = pickRelevantDevTalk(post, talks);
    const suggestedComment = await generateAiComment(post, matchedTalk);
    scored.push({
      ...post,
      suggestedComment,
      devtalkLink: matchedTalk?.link ?? null,
    });
  }

  const report = makeReport(scored, { raw: allPosts.length, unique: uniquePosts.length });
  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, report, "utf8");

  if (QUICK_MODE) {
    console.log("Quick mode enabled: scanned reduced source set.");
  }
  console.log(`Saved report: ${OUTPUT_FILE}`);
  console.log(`Opportunities found: ${scored.length}`);
  if (scored[0]) {
    console.log(`Top thread: [r/${scored[0].subreddit}] ${scored[0].title}`);
    console.log(scored[0].permalink);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
