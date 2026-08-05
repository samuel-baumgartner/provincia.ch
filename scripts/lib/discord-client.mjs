import { sleep } from "./env.mjs";

export function discordConfigured() {
  return Boolean(process.env.DISCORD_WEBHOOK_URL?.trim());
}

/**
 * Post to a Discord incoming webhook. Respects 429 retry_after.
 */
export async function postDiscordWebhook(payload, { webhookUrl } = {}) {
  const url = webhookUrl ?? process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) throw new Error("DISCORD_WEBHOOK_URL is not set");

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 429) {
      const json = await res.json().catch(() => ({}));
      const retryAfter = Number(json.retry_after ?? res.headers.get("Retry-After") ?? 1);
      await sleep(Math.ceil(retryAfter * 1000) + 100);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Discord webhook ${res.status}: ${text.slice(0, 300)}`);
    }

    return true;
  }

  throw new Error("Discord webhook rate-limited after retries");
}

export function discordEmbed({ title, description, url, color = 0xb08d57 }) {
  return {
    title: title?.slice(0, 256),
    description: description?.slice(0, 4000),
    url,
    color,
  };
}
