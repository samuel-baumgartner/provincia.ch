"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MarketingSection } from "@/lib/marketing-hub";

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  ready: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  setup: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  blocked: "border-red-400/40 bg-red-500/15 text-red-200",
};

type Props = {
  sections: MarketingSection[];
  children: React.ReactNode;
};

export default function AdminShell({ sections, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-56">
          <div className="sticky top-6 space-y-4">
            <div>
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80">
                <Image
                  src="/game/stone-cutter.png"
                  alt="Water-powered stone cutter in Provincia"
                  width={597}
                  height={395}
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                Marketing
              </p>
              <h1 className="mt-1 text-lg font-bold">Command Center</h1>
            </div>

            <nav className="space-y-1">
              <Link
                href="/admin"
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/admin"
                    ? "bg-cyan-500/20 text-cyan-100"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                }`}
              >
                Overview
              </Link>
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pathname === section.href
                      ? "bg-cyan-500/20 text-cyan-100"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                  }`}
                >
                  <span>{section.title}</span>
                  {section.status === "blocked" ? (
                    <span className="text-[10px] font-bold uppercase text-red-300">Hold</span>
                  ) : null}
                </Link>
              ))}
            </nav>

            <form action="/admin/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-lg border border-neutral-800 px-3 py-2 text-left text-sm text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
              >
                Logout
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.setup}`}
    >
      {label}
    </span>
  );
}

export function BlockedBanner({
  title,
  reason,
  prerequisites,
}: {
  title: string;
  reason: string;
  prerequisites?: string[];
}) {
  return (
    <div className="rounded-xl border-2 border-red-400/50 bg-red-950/40 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Do not do this yet</p>
      <h2 className="mt-2 text-xl font-bold text-red-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-red-100/90">{reason}</p>
      {prerequisites && prerequisites.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-200/80">
            Unlock when
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-red-100/85">
            {prerequisites.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-red-300">○</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function RunJobButton({
  endpoint,
  label,
  busyLabel,
  onSuccess,
}: {
  endpoint: string;
  label: string;
  busyLabel: string;
  onSuccess?: (message: string) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Job failed");
        return;
      }
      onSuccess?.(json.message ?? "Done");
    } catch {
      setError("Could not reach server. Run the command locally instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? busyLabel : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
