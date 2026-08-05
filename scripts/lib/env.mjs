import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Load `.env.local` / `.env` into `process.env` without overwriting existing values. */
export function loadProjectEnv() {
  for (const rel of [".env.local", ".env"]) {
    const full = path.join(process.cwd(), rel);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      const cur = process.env[key];
      if (cur !== undefined && String(cur).trim() !== "") continue;
      process.env[key] = val;
    }
  }
}

export function envFlag(name, defaultOn = false) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultOn;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "enabled";
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
