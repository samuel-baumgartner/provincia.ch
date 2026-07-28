"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DevTalkActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function distribute() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/admin/api/devtalk-distribute", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Failed");
        return;
      }
      setMessage(json.message ?? "Social drafts created");
      router.refresh();
    } catch {
      setError("Run locally: pnpm devtalk:distribute");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-sm font-semibold text-neutral-100">Distribute latest devtalk</p>
      <p className="mt-1 text-xs text-neutral-500">
        Creates Reddit, X, and Steam community drafts in <code>reports/social-drafts/</code>
      </p>
      <button
        type="button"
        onClick={distribute}
        disabled={busy}
        className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-60"
      >
        {busy ? "Generating…" : "Generate social drafts"}
      </button>
      {message ? <p className="mt-2 text-sm text-cyan-200">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-amber-200">{error}</p> : null}
    </div>
  );
}
