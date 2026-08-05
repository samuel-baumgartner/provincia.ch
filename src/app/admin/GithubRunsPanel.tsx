"use client";

import { useEffect, useState } from "react";

type Run = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
};

export default function GithubRunsPanel() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/admin/api/github/runs");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || "Failed to load runs");
          return;
        }
        setRuns(json.runs ?? []);
        setNote(json.note ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="text-lg font-semibold">Recent GitHub Actions</h2>
      {note ? <p className="mt-1 text-sm text-neutral-400">{note}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {runs.length === 0 && !note && !error ? (
        <p className="mt-2 text-sm text-neutral-500">No marketing runs found.</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {runs.map((run) => (
          <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <a href={run.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">
                {run.name}
              </a>
              <p className="text-xs text-neutral-500">{new Date(run.createdAt).toLocaleString()}</p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                run.conclusion === "success"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : run.conclusion === "failure"
                    ? "bg-red-500/20 text-red-200"
                    : "bg-neutral-800 text-neutral-300"
              }`}
            >
              {run.conclusion ?? run.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
