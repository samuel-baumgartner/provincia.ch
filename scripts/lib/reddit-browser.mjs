/**
 * Playwright Reddit client using a persistent browser profile (manual login once).
 * Posts via old.reddit.com UI — no OAuth.
 */

import { createInterface } from "node:readline";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OLD_REDDIT = "https://old.reddit.com";
const PROFILE_DIR = path.resolve(
  process.cwd(),
  process.env.REDDIT_BROWSER_PROFILE?.trim() || "data/reddit-browser-profile",
);

export function getProfileDir() {
  return PROFILE_DIR;
}

export function profileExists() {
  return existsSync(PROFILE_DIR);
}

/** Convert any reddit permalink to old.reddit.com. */
export function toOldRedditUrl(urlOrPath) {
  const raw = String(urlOrPath || "").trim();
  if (!raw) throw new Error("Empty Reddit URL");
  if (raw.startsWith("/")) return `${OLD_REDDIT}${raw}`;
  const u = new URL(raw.includes("://") ? raw : `https://www.reddit.com${raw.startsWith("/") ? raw : `/${raw}`}`);
  u.hostname = "old.reddit.com";
  u.protocol = "https:";
  return u.toString();
}

/**
 * @param {{ headless?: boolean, slowMo?: number }} [opts]
 * @returns {Promise<import('playwright').BrowserContext>}
 */
export async function launchRedditContext(opts = {}) {
  mkdirSync(PROFILE_DIR, { recursive: true });
  const headless = opts.headless ?? envHeadlessDefault();
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    slowMo: opts.slowMo ?? 0,
    viewport: { width: 1280, height: 900 },
    userAgent:
      process.env.REDDIT_BROWSER_UA?.trim() ||
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
  });
}

function envHeadlessDefault() {
  const raw = process.env.REDDIT_BROWSER_HEADED?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return false;
  return true;
}

/**
 * Detect logged-in state on old.reddit. Throws with login instructions if not.
 * @param {import('playwright').BrowserContext} context
 */
export async function ensureSession(context) {
  const page = await context.newPage();
  try {
    await page.goto(`${OLD_REDDIT}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const username = await readLoggedInUsername(page);
    if (!username) {
      throw new Error(
        `Reddit browser session missing or expired. Run: pnpm reddit:login\n(profile: ${PROFILE_DIR})`,
      );
    }
    return { page, username };
  } catch (err) {
    await page.close().catch(() => {});
    throw err;
  }
}

/**
 * @param {import('playwright').Page} page
 * @returns {Promise<string|null>}
 */
async function readLoggedInUsername(page) {
  // old.reddit: #header-bottom-right .user a[href*="/user/"]
  const selectors = [
    '#header-bottom-right .user a[href*="/user/"]',
    '#header-bottom-right a[href*="/user/"]',
    'span.user a[href*="/user/"]',
  ];
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if ((await el.count()) === 0) continue;
    const href = (await el.getAttribute("href")) || "";
    const text = ((await el.textContent()) || "").trim();
    const fromHref = href.match(/\/user\/([^/?#]+)/i)?.[1];
    const name = fromHref || text;
    if (name && !/^login$/i.test(name) && !/^register$/i.test(name)) return name;
  }

  // Logout link present ⇒ logged in; username may appear elsewhere
  const logout = page.locator('#header-bottom-right a[href*="logout"], a.logout').first();
  if ((await logout.count()) > 0) {
    const mail = page.locator('#mail, #header-bottom-right .user').first();
    if ((await mail.count()) > 0) {
      const block = ((await page.locator("#header-bottom-right .user").textContent()) || "").trim();
      const m = block.match(/^([A-Za-z0-9_-]+)/);
      if (m) return m[1];
    }
  }
  return null;
}

/**
 * Scrape account info for safety gates (no OAuth).
 * Shape matches accountReady(): { name, created_utc, link_karma, comment_karma }
 * @param {import('playwright').BrowserContext} context
 * @param {string} [username]
 */
export async function getMeFromBrowser(context, username) {
  let name = username;
  if (!name) {
    const { page, username: u } = await ensureSession(context);
    name = u;
    await page.close().catch(() => {});
  }

  const aboutUrl = `${OLD_REDDIT}/user/${encodeURIComponent(name)}/about.json`;
  const page = await context.newPage();
  try {
    const res = await page.goto(aboutUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const body = await page.locator("body").innerText();
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      // Sometimes served as HTML error — try fetch via page
      json = await page.evaluate(async (url) => {
        const r = await fetch(url, { credentials: "include" });
        return r.json();
      }, aboutUrl);
    }
    const data = json?.data ?? json;
    if (!data?.name && !data?.id) {
      throw new Error(`Could not load /user/${name}/about.json (status ${res?.status()})`);
    }
    return {
      name: data.name ?? name,
      created_utc: Number(data.created_utc ?? 0),
      link_karma: Number(data.link_karma ?? 0),
      comment_karma: Number(data.comment_karma ?? 0),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Submit a comment on a thread via old.reddit UI.
 * @param {import('playwright').BrowserContext} context
 * @param {string} permalink - thread or comment permalink
 * @param {string} text
 */
export async function submitCommentBrowser(context, permalink, text) {
  const url = toOldRedditUrl(permalink);
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });

    const loggedIn = await readLoggedInUsername(page);
    if (!loggedIn) {
      throw new Error(`Not logged in while posting. Run: pnpm reddit:login`);
    }

    // Top-level reply box in the comment area
    const textarea = page.locator(".commentarea .usertext-edit textarea, form.usertext textarea").first();
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    await textarea.click();
    await textarea.fill(text);

    const saveBtn = page
      .locator(".commentarea .usertext-buttons button.save, .commentarea .usertext-buttons .save, form.usertext button.save")
      .first();
    await saveBtn.click();

    // Wait for the new comment to appear in the DOM
    await page.waitForTimeout(2000);

    // Prefer finding our fresh comment by matching text snippet
    const snippet = text.trim().slice(0, 80);
    const comment = page.locator(".commentarea .comment .usertext-body").filter({ hasText: snippet }).first();
    let commentPermalink = null;
    let commentId = null;

    if ((await comment.count()) > 0) {
      const commentRoot = comment.locator("xpath=ancestor::div[contains(@class,'comment')][1]");
      const idAttr = await commentRoot.getAttribute("id").catch(() => null);
      // id like "thing_t1_abc123"
      const m = String(idAttr || "").match(/t1_([a-z0-9]+)/i);
      if (m) {
        commentId = `t1_${m[1]}`;
        const perma = commentRoot.locator("a.bylink[href*='/comments/']").first();
        if ((await perma.count()) > 0) {
          const href = await perma.getAttribute("href");
          commentPermalink = href ? toOldRedditUrl(href).replace("old.reddit.com", "www.reddit.com") : null;
        }
      }
    }

    // Fallback: look for error message
    const errorBox = page.locator(".commentarea .error, .usertext .error").first();
    if (!commentId && (await errorBox.count()) > 0) {
      const errText = ((await errorBox.textContent()) || "").trim();
      if (errText) {
        const err = new Error(`Reddit comment failed: ${errText}`);
        if (/rate.?limit|you are doing that too much/i.test(errText)) err.code = "RATELIMIT";
        throw err;
      }
    }

    if (!commentId) {
      // Soft success — form cleared usually means accept
      const stillFilled = await textarea.inputValue().catch(() => text);
      if (stillFilled.trim() === text.trim()) {
        throw new Error("Comment form still filled after submit — post may have failed");
      }
    }

    return {
      name: commentId,
      permalink: commentPermalink ?? permalink,
      username: loggedIn,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Authenticated JSON GET using the persistent browser session cookies.
 * Prefer old.reddit.com URLs — www often 403s bare clients.
 * @param {import('playwright').BrowserContext} context
 * @param {string} url
 */
export async function fetchJsonViaSession(context, url) {
  if (!context) throw new Error("No browser context — run pnpm reddit:login first");
  // Keep cookies valid for both hosts
  let target = url;
  try {
    const u = new URL(url);
    if (u.hostname === "www.reddit.com" || u.hostname === "reddit.com") {
      u.hostname = "old.reddit.com";
      target = u.toString();
    }
  } catch {
    /* leave url as-is */
  }

  const res = await context.request.get(target, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 45_000,
  });

  if (!res.ok()) {
    const body = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`Fetch failed (${res.status()})${body ? `: ${body}` : ""}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${target}, got: ${text.slice(0, 120)}`);
  }
}

/**
 * Visibility check from a cookieless Chromium context (avoids Node 403 + own-cookie false positives).
 * @param {string} commentFullname e.g. t1_abc
 * @param {{ permalink?: string }} [opts]
 */
export async function isCommentVisibleBrowser(commentFullname, opts = {}) {
  if (!commentFullname && !opts.permalink) return false;
  const id = commentFullname ? commentFullname.replace(/^t1_/, "") : null;

  const browser = await chromium.launch({ headless: true });
  try {
    const anon = await browser.newContext({
      userAgent:
        process.env.REDDIT_BROWSER_UA?.trim() ||
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });
    try {
      if (opts.permalink) {
        const page = await anon.newPage();
        try {
          const url = toOldRedditUrl(opts.permalink);
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
          // Removed/spam or not found
          const body = ((await page.locator("body").innerText().catch(() => "")) || "").toLowerCase();
          if (body.includes("page not found") || body.includes("this comment is missing")) return false;
          if (id) {
            const thing = page.locator(`#thing_t1_${id}, .comment[id*='t1_${id}']`).first();
            if ((await thing.count()) > 0) return true;
          }
          // Permalink landed on a comment page with body text
          const commentBody = page.locator(".commentarea .usertext-body, .comment .md").first();
          return (await commentBody.count()) > 0;
        } finally {
          await page.close().catch(() => {});
        }
      }

      if (!id) return false;
      const infoUrl = `${OLD_REDDIT}/api/info.json?id=t1_${id}`;
      const res = await anon.request.get(infoUrl, {
        headers: { Accept: "application/json" },
        timeout: 45_000,
      });
      if (!res.ok()) return false;
      const json = await res.json().catch(() => ({}));
      const children = json?.data?.children ?? [];
      return children.some((c) => c?.data?.id === id && !c?.data?.removed && !c?.data?.spam);
    } finally {
      await anon.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Headed interactive login: user logs in, presses Enter in the terminal.
 * @param {{ timeoutMs?: number }} [opts]
 */
export async function interactiveLogin(opts = {}) {
  const context = await launchRedditContext({ headless: false, slowMo: 50 });
  const page = await context.newPage();
  try {
    await page.goto(`${OLD_REDDIT}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    console.log(`\nProfile: ${PROFILE_DIR}`);
    console.log("Log in to Reddit in the browser window.");
    console.log("When you see yourself logged in on old.reddit.com, return here and press Enter.\n");

    await waitForEnter();

    await page.goto(`${OLD_REDDIT}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const username = await readLoggedInUsername(page);
    if (!username) {
      throw new Error("Still not logged in after Enter. Complete login and run reddit:login again.");
    }
    console.log(`Session OK for /u/${username}`);
    return { username, profileDir: PROFILE_DIR };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

function waitForEnter() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("Press Enter when logged in… ", () => {
      rl.close();
      resolve();
    });
  });
}
