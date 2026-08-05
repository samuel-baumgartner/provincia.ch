"use client";

import { useState } from "react";

export default function CopyItchButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/admin/api/itch/bbcode?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      await navigator.clipboard.writeText(json.bbcode);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed");
      setState("error");
    }
  }

  async function download() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/admin/api/itch/bbcode?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const blob = new Blob([json.bbcode], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-itch.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        disabled={state === "loading"}
        className="rounded bg-cyan-400 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-50"
      >
        {state === "copied" ? "Copied BBCode" : "Copy itch BBCode"}
      </button>
      <button
        type="button"
        onClick={download}
        disabled={state === "loading"}
        className="rounded border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
      >
        Download .txt
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
