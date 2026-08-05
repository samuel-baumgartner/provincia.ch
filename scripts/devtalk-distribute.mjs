#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadProjectEnv } from "./lib/env.mjs";

loadProjectEnv();

const DEV_TALKS_DIR = path.resolve(process.cwd(), "content/devtalks");
const OUTPUT_DIR = path.resolve(process.cwd(), "reports/social-drafts");
const GAME_URL = process.env.GAME_URL ?? "https://provincia.ch";
const DEVTALK_URL = process.env.DEVTALK_URL ?? "https://provincia.ch/devtalk";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function withUtm(url, source, campaign) {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "social");
  if (campaign) u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { data: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 3).trim();
  const data = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?$/);
    if (m) data[m[1]] = m[2];
  }
  return { data, body };
}

function findLatestPublishedDevtalk() {
  const files = readdirSync(DEV_TALKS_DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map((filename) => {
      const raw = readFileSync(path.join(DEV_TALKS_DIR, filename), "utf8");
      const { data, body } = parseFrontmatter(raw);
      if (data.draft === "true" || data.draft === true) return null;
      return {
        slug: filename.replace(/\.md$/, ""),
        title: data.title ?? filename,
        excerpt: data.excerpt ?? "",
        date: data.date ?? "1970-01-01",
        body: body.slice(0, 4000),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return files[0] ?? null;
}

function templateDrafts(devtalk) {
  const baseUrl = `${DEVTALK_URL}/${devtalk.slug}`;
  const redditUrl = withUtm(baseUrl, "reddit", devtalk.slug);
  const xUrl = withUtm(baseUrl, "x", devtalk.slug);
  const discordUrl = withUtm(baseUrl, "discord", devtalk.slug);
  const gameDiscord = withUtm(GAME_URL, "discord", devtalk.slug);
  const gameX = withUtm(GAME_URL, "x", devtalk.slug);
  const excerpt = devtalk.excerpt || devtalk.title;

  return {
    slug: devtalk.slug,
    devtalkTitle: devtalk.title,
    generatedAt: new Date().toISOString(),
    platforms: {
      reddit: {
        title: `[Devlog] ${devtalk.title} — Roman colony builder`,
        body: `Hey — we shipped a new devlog on **Provincia** (Roman colony builder, logistics-heavy).

${excerpt}

Full post: ${redditUrl}

Happy to answer questions about our grid/sim approach. Not trying to spam — genuinely curious what city-builder folks think about ${devtalk.title.toLowerCase().includes("water") ? "water systems" : "this kind of scope"}.`,
      },
      x: {
        posts: [
          `New Provincia devlog: ${devtalk.title}\n\n${excerpt}\n\n${xUrl}\n\n#indiegame #gamedev #citybuilder`,
          `Provincia is a Roman colonia you actually plan — fixed grid, terrace steps, real logistics.\n\nThis week: ${devtalk.title}\n\n${xUrl}`,
          `Building in public. Feedback welcome.\n\n${gameX}`,
        ],
      },
      discord: {
        content: `New Provincia devlog: **${devtalk.title}**\n${excerpt}\n${discordUrl}`,
        embed: {
          title: devtalk.title,
          description: excerpt,
          url: discordUrl,
        },
      },
      steam: {
        title: `Dev Update: ${devtalk.title}`,
        body: `We published a new development update on our site.

${excerpt}

Read the full post: ${baseUrl}

Wishlist if you want to follow along — we're building a Roman colony builder with systemic city planning.`,
      },
    },
    links: {
      site: gameDiscord,
      devtalk: discordUrl,
    },
  };
}

async function aiEnhance(devtalk, base) {
  if (!OPENAI_API_KEY) return base;

  const redditUrl = withUtm(`${DEVTALK_URL}/${devtalk.slug}`, "reddit", devtalk.slug);
  const xUrl = withUtm(`${DEVTALK_URL}/${devtalk.slug}`, "x", devtalk.slug);
  const discordUrl = withUtm(`${DEVTALK_URL}/${devtalk.slug}`, "discord", devtalk.slug);

  const prompt = `You are marketing assistant for Provincia, a Roman colony city-builder indie game.
Given this devtalk, rewrite the social drafts to be concrete and non-spammy. Keep URLs exactly as given (including utm params).
Return ONLY valid JSON matching this shape:
{"reddit":{"title":"...","body":"..."},"x":{"posts":["...","..."]},"discord":{"content":"...","embed":{"title":"...","description":"...","url":"..."}},"steam":{"title":"...","body":"..."}}

Devtalk title: ${devtalk.title}
Excerpt: ${devtalk.excerpt}
Reddit URL: ${redditUrl}
X URL: ${xUrl}
Discord URL: ${discordUrl}
Body snippet: ${devtalk.body.slice(0, 1500)}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.5,
        max_tokens: 1400,
        messages: [
          { role: "system", content: "Output JSON only, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return base;
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(text.replace(/^```json?\s*|\s*```$/g, ""));
    return {
      ...base,
      platforms: {
        reddit: { ...base.platforms.reddit, ...parsed.reddit },
        x: { posts: parsed.x?.posts ?? base.platforms.x.posts },
        discord: {
          content: parsed.discord?.content ?? base.platforms.discord.content,
          embed: { ...base.platforms.discord.embed, ...(parsed.discord?.embed ?? {}) },
        },
        steam: { ...base.platforms.steam, ...parsed.steam },
      },
    };
  } catch {
    return base;
  }
}

async function main() {
  const devtalk = findLatestPublishedDevtalk();
  if (!devtalk) {
    console.error("No published devtalk found in content/devtalks/ (exclude draft: true).");
    process.exit(1);
  }

  let draft = templateDrafts(devtalk);
  draft = await aiEnhance(devtalk, draft);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(OUTPUT_DIR, `${stamp}-${devtalk.slug}.json`);
  await writeFile(outFile, JSON.stringify(draft, null, 2), "utf8");

  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
