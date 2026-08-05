"use client";

import { useState, useTransition } from "react";

export default function ClearHaltButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setMsg(null);
            const res = await fetch("/admin/api/controls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clearHalt: true }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              setMsg(json.error || "Failed");
              return;
            }
            setMsg("Cleared — reload page");
            window.location.reload();
          });
        }}
        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-200"
      >
        Clear soft halt
      </button>
      {msg ? <span className="text-xs text-amber-100">{msg}</span> : null}
    </div>
  );
}
