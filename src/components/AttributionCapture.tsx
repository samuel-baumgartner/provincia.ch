"use client";

import { useEffect } from "react";

const STORAGE_KEY = "pv_src";

function hostBucket(hostname: string): string | null {
  const h = hostname.toLowerCase();
  if (!h || h.includes("provincia.ch") || h === "localhost") return null;
  if (h.includes("reddit")) return "reddit";
  if (h.includes("discord")) return "discord";
  if (h.includes("twitter") || h === "t.co" || h.includes("x.com")) return "x";
  if (h.includes("steam")) return "steam";
  if (h.includes("github")) return "github";
  return null;
}

/**
 * Capture coarse acquisition source into sessionStorage (UTM or referrer host).
 * No cookies, no third-party scripts — does not block rendering.
 */
export default function AttributionCapture() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;

      const params = new URLSearchParams(window.location.search);
      const utm = params.get("utm_source") || params.get("src");
      if (utm) {
        sessionStorage.setItem(STORAGE_KEY, utm.toLowerCase().slice(0, 32));
        return;
      }

      if (document.referrer) {
        const host = new URL(document.referrer).hostname;
        const bucket = hostBucket(host);
        if (bucket) sessionStorage.setItem(STORAGE_KEY, bucket);
      }
    } catch {
      // ignore
    }
  }, []);

  return null;
}

export function readAttributionSource(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "direct";
  } catch {
    return "direct";
  }
}
