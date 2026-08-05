"use client";

import { useState, useTransition } from "react";
import type { MarketingControls } from "@/lib/marketing-controls";

type Props = {
  initial: MarketingControls;
  softHalted?: boolean;
  haltReason?: string | null;
};

type ToggleKey = keyof Pick<
  MarketingControls,
  | "masterPublish"
  | "redditAutoPost"
  | "xAutoPost"
  | "discordAutoPost"
  | "redditDryRun"
  | "socialDryRun"
>;

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "masterPublish", label: "Master publish", hint: "Must be on for engage + social publish" },
  { key: "redditAutoPost", label: "Reddit auto-post", hint: "Comments via browser session" },
  { key: "xAutoPost", label: "X auto-post", hint: "Needs X API keys" },
  { key: "discordAutoPost", label: "Discord auto-post", hint: "Needs webhook URL" },
  { key: "redditDryRun", label: "Reddit dry-run", hint: "Log only — no comments" },
  { key: "socialDryRun", label: "Social dry-run", hint: "Log only — no Discord/X posts" },
];

export default function MarketingControlsPanel({ initial, softHalted, haltReason }: Props) {
  const [controls, setControls] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: MarketingControls, extra?: { clearHalt?: boolean }) {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const res = await fetch("/admin/api/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controls: next, clearHalt: extra?.clearHalt }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Save failed");
        return;
      }
      setControls(json.controls);
      setMessage(extra?.clearHalt ? "Soft halt cleared. Controls saved." : "Controls saved.");
    });
  }

  function toggle(key: ToggleKey) {
    const next = { ...controls, [key]: !controls[key] };
    setControls(next);
    save(next);
  }

  function saveRedditTweaks(form: FormData) {
    const reddit = {
      ...controls.reddit,
      maxHelpfulPerDay: Number(form.get("maxHelpfulPerDay") || controls.reddit.maxHelpfulPerDay),
      maxPromoPerDay: Number(form.get("maxPromoPerDay") || controls.reddit.maxPromoPerDay),
      minHelpfulPerPromo: Number(
        form.get("minHelpfulPerPromo") || controls.reddit.minHelpfulPerPromo,
      ),
      minAccountAgeDays: Number(form.get("minAccountAgeDays") || controls.reddit.minAccountAgeDays),
      minKarma: Number(form.get("minKarma") || controls.reddit.minKarma),
      maxActionsPerRun: Number(form.get("maxActionsPerRun") || controls.reddit.maxActionsPerRun),
      subCooldownHours: Number(form.get("subCooldownHours") || controls.reddit.subCooldownHours),
    };
    const next = { ...controls, reddit };
    setControls(next);
    save(next);
  }

  return (
    <section className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Kill switches</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Writes <code className="text-cyan-200">reports/marketing-controls.json</code>. Scripts
            read this when env is unset.
          </p>
        </div>
        {pending ? <span className="text-xs text-neutral-500">Saving…</span> : null}
      </div>

      {softHalted ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          <p className="font-semibold">Soft halt — promo blocked, helpful OK</p>
          <p className="mt-1 text-amber-100/80">{haltReason}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => save(controls, { clearHalt: true })}
            className="mt-2 rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-200"
          >
            Clear soft halt
          </button>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {TOGGLES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => toggle(t.key)}
            disabled={pending}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              controls[t.key]
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                : "border-neutral-700 bg-neutral-950 text-neutral-400"
            }`}
          >
            <span className="font-semibold">
              {controls[t.key] ? "ON" : "OFF"} · {t.label}
            </span>
            <span className="mt-0.5 block text-xs opacity-80">{t.hint}</span>
          </button>
        ))}
      </div>

      <form
        className="space-y-3 border-t border-neutral-800 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveRedditTweaks(new FormData(e.currentTarget));
        }}
      >
        <h3 className="text-sm font-semibold text-neutral-200">Reddit gates</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["maxHelpfulPerDay", "Helpful / day"],
              ["maxPromoPerDay", "Promo / day"],
              ["minHelpfulPerPromo", "Helpful per promo"],
              ["minAccountAgeDays", "Min age (days)"],
              ["minKarma", "Min karma"],
              ["maxActionsPerRun", "Max / run"],
              ["subCooldownHours", "Sub cooldown (h)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-neutral-400">
              {label}
              <input
                name={key}
                type="number"
                defaultValue={controls.reddit[key]}
                className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100"
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
        >
          Save Reddit gates
        </button>
      </form>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {controls.updatedAt ? (
        <p className="text-xs text-neutral-500">
          Last update {new Date(controls.updatedAt).toLocaleString()}
          {controls.updatedBy ? ` · ${controls.updatedBy}` : ""}
        </p>
      ) : null}
    </section>
  );
}
