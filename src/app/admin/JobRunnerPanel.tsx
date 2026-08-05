"use client";

import { useState, useTransition } from "react";

type Job = "scan" | "engage" | "distribute" | "publish" | "both";

type Props = {
  canRunLocal: boolean;
  canTriggerGithub: boolean;
};

const JOBS: { id: Job; label: string; local: boolean; github: boolean }[] = [
  { id: "scan", label: "Reddit scan", local: true, github: true },
  { id: "engage", label: "Reddit engage", local: true, github: true },
  { id: "distribute", label: "DevTalk distribute", local: true, github: false },
  { id: "publish", label: "Social publish", local: true, github: true },
  { id: "both", label: "Engage + publish (GH)", local: false, github: true },
];

export default function JobRunnerPanel({ canRunLocal, canTriggerGithub }: Props) {
  const [pending, startTransition] = useTransition();
  const [log, setLog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(job: Job, via: "local" | "github") {
    startTransition(async () => {
      setError(null);
      setLog(null);
      const res = await fetch("/admin/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, via }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Job failed");
        return;
      }
      setLog(
        via === "github"
          ? `Dispatched ${json.workflow} on ${json.repo} (${json.ref})`
          : json.output || "OK",
      );
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div>
        <h2 className="text-lg font-semibold">Jobs</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Local runner: {canRunLocal ? "available" : "disabled"}. GitHub dispatch:{" "}
          {canTriggerGithub ? "available" : "needs CONTROLS_GITHUB_TOKEN"}. Reddit engage needs a
          browser profile on this machine.
        </p>
      </div>
      <ul className="space-y-2">
        {JOBS.map((job) => (
          <li
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm"
          >
            <span className="font-medium">{job.label}</span>
            <div className="flex gap-2">
              {job.local ? (
                <button
                  type="button"
                  disabled={pending || !canRunLocal}
                  onClick={() => run(job.id, "local")}
                  className="rounded bg-neutral-800 px-2 py-1 text-xs font-semibold text-cyan-200 hover:bg-neutral-700 disabled:opacity-40"
                >
                  Run local
                </button>
              ) : null}
              {job.github ? (
                <button
                  type="button"
                  disabled={pending || !canTriggerGithub}
                  onClick={() => run(job.id, "github")}
                  className="rounded bg-neutral-800 px-2 py-1 text-xs font-semibold text-cyan-200 hover:bg-neutral-700 disabled:opacity-40"
                >
                  Run GitHub
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {pending ? <p className="text-xs text-neutral-500">Running…</p> : null}
      {log ? (
        <pre className="max-h-40 overflow-auto rounded bg-neutral-950 p-2 text-xs text-neutral-300">
          {log}
        </pre>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
