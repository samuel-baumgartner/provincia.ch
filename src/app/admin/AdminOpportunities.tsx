"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { RedditOpportunity } from "@/lib/reddit-report";

const STORAGE_KEY = "provinica.admin.redditQueue.v1";

type StoredQueue = {
  done: string[];
  denied: string[];
};

function loadQueue(): StoredQueue {
  if (typeof window === "undefined") return { done: [], denied: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { done: [], denied: [] };
    const parsed = JSON.parse(raw) as Partial<StoredQueue>;
    return {
      done: Array.isArray(parsed.done) ? parsed.done : [],
      denied: Array.isArray(parsed.denied) ? parsed.denied : [],
    };
  } catch {
    return { done: [], denied: [] };
  }
}

function saveQueue(done: Set<string>, denied: Set<string>) {
  if (typeof window === "undefined") return;
  const payload: StoredQueue = {
    done: [...done],
    denied: [...denied],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function formatGenerated(iso: string | null) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type Props = {
  opportunities: RedditOpportunity[];
  generatedAt: string | null;
};

export default function AdminOpportunities({ opportunities, generatedAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deniedIds, setDeniedIds] = useState<Set<string>>(new Set());
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [draftingIds, setDraftingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { done, denied } = loadQueue();
    setDoneIds(new Set(done));
    setDeniedIds(new Set(denied));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveQueue(doneIds, deniedIds);
  }, [hydrated, doneIds, deniedIds]);

  const visibleOpportunities = useMemo(
    () => opportunities.filter((item) => !deniedIds.has(item.id)),
    [opportunities, deniedIds],
  );

  function onReload() {
    setStatus("");
    startTransition(() => {
      router.refresh();
    });
  }

  async function onAccept(item: RedditOpportunity) {
    setDoneIds((prev) => new Set(prev).add(item.id));
    try {
      await navigator.clipboard.writeText(item.suggestedComment || item.link);
      window.open(item.link, "_blank", "noopener,noreferrer");
      setStatus("Copied reply to clipboard and opened the Reddit thread.");
    } catch {
      setStatus("Could not access clipboard. Thread can still be opened manually.");
      window.open(item.link, "_blank", "noopener,noreferrer");
    }
  }

  function onDeny(itemId: string) {
    setDeniedIds((prev) => new Set(prev).add(itemId));
    setStatus("Hidden from list (saved for next visit).");
  }

  async function onGenerateDevTalk(item: RedditOpportunity) {
    setDraftingIds((prev) => new Set(prev).add(item.id));
    setStatus("Generating devtalk draft...");
    try {
      const response = await fetch("/admin/api/devtalk-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          reason: item.reason,
          suggestedComment: item.suggestedComment,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setStatus(json?.error || "Could not generate draft.");
        return;
      }
      setStatus(`Draft created: ${json.path}`);
    } catch {
      setStatus("Could not generate draft.");
    } finally {
      setDraftingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 text-sm text-neutral-300">
        No scan data found yet. Run <code>pnpm reddit:scan</code> and use Reload.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
        <div>
          <p className="text-sm text-neutral-200">
            Report generated:{" "}
            <span className="font-medium text-neutral-100">{formatGenerated(generatedAt)}</span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Reload pulls the latest <code className="text-neutral-400">reports/reddit-opportunities.md</code>{" "}
            from disk.
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={isPending}
          className="rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Reloading…" : "Reload report"}
        </button>
      </div>

      {status ? (
        <p className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
          {status}
        </p>
      ) : null}

      {!hydrated ? (
        <p className="text-sm text-neutral-500">Loading saved progress…</p>
      ) : null}

      {hydrated && visibleOpportunities.length === 0 ? (
        <p className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-300">
          All visible items are hidden (Deny). Use Reload after a new scan to see fresh threads.
        </p>
      ) : null}

      {visibleOpportunities.map((item) => {
        const done = hydrated && doneIds.has(item.id);
        return (
          <article
            key={item.id}
            className={`rounded-xl border bg-neutral-900/60 p-5 text-neutral-100 ${
              done ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-neutral-800"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-neutral-400">r/{item.subreddit}</p>
              {done ? (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Done
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Score {item.score ?? "n/a"} - {item.activity}
            </p>
            <p className="mt-1 text-sm text-neutral-300">{item.reason}</p>
            <p className="mt-1 text-xs text-neutral-400">
              Devtalk: {item.devtalkLink ? item.devtalkLink : "none matched"}
            </p>

            <p className="mt-3 text-sm text-neutral-200">{item.suggestedComment}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onAccept(item)}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
              >
                {done ? "Copy again + open" : "Accept"}
              </button>

              <button
                type="button"
                onClick={() => onDeny(item.id)}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:border-neutral-500"
              >
                Deny
              </button>

              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Open Thread
              </a>

              {!item.devtalkLink ? (
                <button
                  type="button"
                  onClick={() => onGenerateDevTalk(item)}
                  disabled={draftingIds.has(item.id)}
                  className="rounded-lg border border-amber-300/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {draftingIds.has(item.id) ? "Generating..." : "Generate DevTalk Draft"}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
