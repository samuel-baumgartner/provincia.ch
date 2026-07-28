"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function formatGenerated(iso: string | null) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type Props = {
  generatedAt: string | null;
};

export default function RedditScanPanel({ generatedAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scanBusy, setScanBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onReload() {
    setMessage("");
    startTransition(() => router.refresh());
  }

  async function onRunScan() {
    setScanBusy(true);
    setError("");
    setMessage("Running scan…");
    try {
      const res = await fetch("/admin/api/reddit-scan", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Scan failed");
        setMessage("");
        return;
      }
      setMessage(json.message ?? "Scan complete");
      router.refresh();
    } catch {
      setError("Server cannot run scans (e.g. on Vercel). Use: pnpm reddit:scan");
      setMessage("");
    } finally {
      setScanBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-200">
            Latest scan:{" "}
            <span className="font-medium text-neutral-100">{formatGenerated(generatedAt)}</span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Production: GitHub Actions runs daily. Local dev: button below or{" "}
            <code className="text-neutral-400">pnpm reddit:scan</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={isPending}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold transition hover:border-neutral-500 disabled:opacity-60"
          >
            {isPending ? "Reloading…" : "Reload report"}
          </button>
          <button
            type="button"
            onClick={onRunScan}
            disabled={scanBusy}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
          >
            {scanBusy ? "Scanning…" : "Run scan now"}
          </button>
        </div>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-cyan-200">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-amber-200">{error}</p>
      ) : null}
    </div>
  );
}
