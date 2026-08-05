"use client";

import { useState } from "react";

/** Copy rich HTML so itch’s visual editor pastes formatted content + remote images. */
async function writeHtmlClipboard(html: string, plainFallback: string) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainFallback], { type: "text/plain" }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(plainFallback);
}

export default function CopyItchButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function loadPayload() {
    const res = await fetch(`/admin/api/itch/bbcode?slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed");
    if (!json.html && !json.markdown) throw new Error("Empty export");
    return json as {
      html: string;
      markdown: string;
      title: string;
    };
  }

  async function copy() {
    setState("loading");
    setError(null);
    try {
      const json = await loadPayload();
      await writeHtmlClipboard(json.html, json.markdown);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed");
      setState("error");
    }
  }

  async function download() {
    setState("loading");
    setError(null);
    try {
      const json = await loadPayload();
      const blob = new Blob([json.html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-itch.html`;
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
        title="Copies rich HTML for itch’s visual Devlog editor (images load from provincia.ch)"
        className="rounded bg-cyan-400 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-50"
      >
        {state === "copied" ? "Copied HTML for itch" : "Copy itch HTML"}
      </button>
      <button
        type="button"
        onClick={download}
        disabled={state === "loading"}
        className="rounded border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
      >
        Download .html
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
