import crypto from "node:crypto";

/**
 * Minimal OAuth 1.0a user-context client for X (Twitter) API v2 tweet create.
 * Pay-per-use: posts with URLs cost ~$0.20 each — keep volume low.
 */

export function xConfigured() {
  return Boolean(
    process.env.X_API_KEY?.trim() &&
      process.env.X_API_SECRET?.trim() &&
      process.env.X_ACCESS_TOKEN?.trim() &&
      process.env.X_ACCESS_SECRET?.trim(),
  );
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function oauthHeader(method, url, extraParams = {}) {
  const consumerKey = process.env.X_API_KEY.trim();
  const consumerSecret = process.env.X_API_SECRET.trim();
  const token = process.env.X_ACCESS_TOKEN.trim();
  const tokenSecret = process.env.X_ACCESS_SECRET.trim();

  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };

  const all = { ...oauth, ...extraParams };
  const paramString = Object.keys(all)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(String(all[k]))}`)
    .join("&");

  const base = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  oauth.oauth_signature = signature;

  const header =
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauth[k])}"`)
      .join(", ");

  return header;
}

export async function postTweet(text) {
  if (!xConfigured()) throw new Error("X credentials missing");

  const url = "https://api.twitter.com/2/tweets";
  const body = { text: String(text).slice(0, 280) };
  const auth = oauthHeader("POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`X API ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  }

  return {
    id: json?.data?.id ?? null,
    text: json?.data?.text ?? body.text,
  };
}
