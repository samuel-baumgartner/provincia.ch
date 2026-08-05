/**
 * Reddit OAuth script-app client.
 * Always hits oauth.reddit.com for authenticated calls.
 * Parses json.errors even when HTTP status is 200.
 */

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const OAUTH_BASE = "https://oauth.reddit.com";

let cachedToken = null;
let cachedExpiresAt = 0;

function userAgent() {
  const user = process.env.REDDIT_USERNAME?.trim() || "unknown";
  return process.env.REDDIT_USER_AGENT?.trim() || `linux:provincia.ch:0.1 (by /u/${user})`;
}

export function redditConfigured() {
  return Boolean(
    process.env.REDDIT_CLIENT_ID?.trim() &&
      process.env.REDDIT_CLIENT_SECRET?.trim() &&
      process.env.REDDIT_USERNAME?.trim() &&
      process.env.REDDIT_PASSWORD?.trim(),
  );
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedExpiresAt - 60_000) return cachedToken;

  const clientId = process.env.REDDIT_CLIENT_ID?.trim();
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();
  const username = process.env.REDDIT_USERNAME?.trim();
  const password = process.env.REDDIT_PASSWORD?.trim();

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Reddit credentials missing (CLIENT_ID/SECRET/USERNAME/PASSWORD)");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(),
    },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`Reddit token failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  }

  cachedToken = json.access_token;
  cachedExpiresAt = Date.now() + (Number(json.expires_in) || 3600) * 1000;
  return cachedToken;
}

export async function redditRequest(method, apiPath, { form, query } = {}) {
  const token = await getAccessToken();
  const url = new URL(apiPath.startsWith("http") ? apiPath : `${OAUTH_BASE}${apiPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": userAgent(),
  };

  let body;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 500) };
  }

  const errors = json?.json?.errors ?? json?.errors ?? [];
  if (Array.isArray(errors) && errors.length > 0) {
    const [[code, message] = ["UNKNOWN", "Reddit API error"]] = errors;
    const err = new Error(`Reddit ${code}: ${message}`);
    err.code = code;
    err.redditErrors = errors;
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`Reddit HTTP ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  return { status: res.status, headers: res.headers, json };
}

export async function getMe() {
  const { json } = await redditRequest("GET", "/api/v1/me");
  return json;
}

export async function submitComment(thingId, text) {
  const { json } = await redditRequest("POST", "/api/comment", {
    form: {
      api_type: "json",
      thing_id: thingId,
      text,
    },
  });
  const comment = json?.json?.data?.things?.[0]?.data;
  return {
    id: comment?.id ? `t1_${comment.id}` : null,
    name: comment?.name ?? null,
    permalink: comment?.permalink ? `https://www.reddit.com${comment.permalink}` : null,
    raw: json,
  };
}

export async function submitSelfPost({ subreddit, title, text }) {
  const { json } = await redditRequest("POST", "/api/submit", {
    form: {
      api_type: "json",
      kind: "self",
      sr: subreddit,
      title,
      text,
    },
  });
  const data = json?.json?.data ?? {};
  return {
    id: data.id ?? null,
    name: data.name ?? null,
    url: data.url ?? null,
    raw: json,
  };
}

/** Unauthenticated visibility check (shadowban / removed). */
export async function isCommentPubliclyVisible(commentFullname) {
  if (!commentFullname) return false;
  const id = commentFullname.replace(/^t1_/, "");
  const url = `https://www.reddit.com/api/info.json?id=t1_${id}`;
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent() },
  });
  if (!res.ok) return false;
  const json = await res.json().catch(() => ({}));
  const children = json?.data?.children ?? [];
  return children.some((c) => c?.data?.id === id && !c?.data?.removed && !c?.data?.spam);
}

export function thingIdFromPermalink(permalink) {
  const m = String(permalink).match(/\/comments\/([a-z0-9]+)/i);
  return m ? `t3_${m[1]}` : null;
}
