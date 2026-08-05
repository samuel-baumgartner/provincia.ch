"use client";

import { useState, useTransition } from "react";
import type { MarketingControls } from "@/lib/marketing-controls";

type Itch = MarketingControls["itch"];

export default function ItchChecklistForm({ initial }: { initial: Itch }) {
  const [itch, setItch] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: Itch) {
    startTransition(async () => {
      setMsg(null);
      const res = await fetch("/admin/api/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controls: { itch: next } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || "Save failed");
        return;
      }
      setItch(json.controls.itch);
      setMsg("Saved");
    });
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="text-lg font-semibold">Page checklist</h2>
      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          save({
            pageReady: fd.get("pageReady") === "on",
            coverReady: fd.get("coverReady") === "on",
            demoLinked: fd.get("demoLinked") === "on",
            tagsSet: fd.get("tagsSet") === "on",
            pageUrl: String(fd.get("pageUrl") || ""),
          });
        }}
      >
        <label className="block text-sm text-neutral-300">
          itch page URL
          <input
            name="pageUrl"
            defaultValue={itch.pageUrl}
            placeholder="https://….itch.io/provincia"
            className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </label>
        {(
          [
            ["pageReady", "Page published / visible"],
            ["coverReady", "Cover art uploaded"],
            ["demoLinked", "Demo or download linked"],
            ["tagsSet", "Tags set"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name={name} defaultChecked={itch[name]} />
            {label}
          </label>
        ))}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
        >
          Save itch checklist
        </button>
        {msg ? <p className="text-xs text-emerald-300">{msg}</p> : null}
      </form>
    </section>
  );
}
