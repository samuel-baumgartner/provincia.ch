import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { STEAM_NEXT_FEST_CHECKLIST } from "@/lib/marketing-hub";
import { StatusBadge } from "../AdminShell";

export const dynamic = "force-dynamic";

const NEXT_FEST_DATES = [
  { label: "February 2027", note: "Typical slot — confirm in Steamworks" },
  { label: "June 2027", note: "Plan demo submission 2+ weeks before" },
  { label: "October 2027", note: "One Next Fest per game — choose timing carefully" },
];

export default async function AdminSteamPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Steam</h1>
          <StatusBadge status="setup" label="Not on Steam yet" />
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Steam Next Fest is a free week-long demo festival — your biggest wishlist spike before
          launch. You get one shot per game.
        </p>
      </header>

      <div className="rounded-xl border-2 border-amber-400/40 bg-amber-950/30 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Current status</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-100/95">
          Provinica does not have a public Steam page yet. Focus on devtalks and Reddit for now. Use
          this page as a checklist so you are ready when the store page goes live.
        </p>
        <Link
          href="/admin/steam/guide"
          className="mt-4 inline-block rounded-lg bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-amber-400/40 transition hover:bg-amber-400/30"
        >
          Full setup guide (step-by-step) →
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Next Fest checklist</h2>
        <ul className="mt-3 space-y-2">
          {STEAM_NEXT_FEST_CHECKLIST.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm"
            >
              <span className="text-neutral-500">{item.done ? "✓" : "○"}</span>
              <span className={item.done ? "text-neutral-300 line-through" : "text-neutral-200"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Typical windows</h2>
        <ul className="mt-3 space-y-2">
          {NEXT_FEST_DATES.map((d) => (
            <li
              key={d.label}
              className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm"
            >
              <span className="font-medium">{d.label}</span>
              <span className="mt-1 block text-neutral-500">{d.note}</span>
            </li>
          ))}
        </ul>
        <Link
          href="https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-cyan-300 hover:underline"
        >
          Official Steamworks Next Fest docs →
        </Link>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
        <p className="font-semibold text-neutral-100">Before you register</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>20–40 minute demo with your best content (not just level 1)</li>
          <li>Wishlist button on demo end screen</li>
          <li>At least 2 devtalks and some Reddit presence for baseline interest</li>
        </ul>
      </section>
    </div>
  );
}
