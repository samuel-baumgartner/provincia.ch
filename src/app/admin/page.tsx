import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { MARKETING_SECTIONS } from "@/lib/marketing-hub";
import { getRedditReport } from "@/lib/reddit-report";
import { getLatestSocialDraft } from "@/lib/social-drafts";
import { getDevTalkAdminItems } from "@/lib/devtalk-admin";
import { getMarketingHealth } from "@/lib/marketing-health";
import { getPublishLedger, summarizePublishLedger } from "@/lib/publish-ledger";
import { StatusBadge } from "./AdminShell";
import MarketingControlsPanel from "./MarketingControlsPanel";
import JobRunnerPanel from "./JobRunnerPanel";
import GithubRunsPanel from "./GithubRunsPanel";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminDashboard({ searchParams }: AdminPageProps) {
  const [{ error }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <section className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              Provincia
            </p>
            <h1 className="mt-2 text-3xl font-bold">Marketing Command Center</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Reddit, DevTalk, social, itch copy, downloads, and kill switches — one place.
            </p>

            <form action="/admin/login" method="post" className="mt-8 space-y-4">
              <label className="block text-sm font-semibold text-neutral-200">
                Password
                <input
                  type="password"
                  name="password"
                  required
                  className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none ring-cyan-300/50 focus:ring"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
              >
                Unlock
              </button>
            </form>

            {error === "invalid-password" ? (
              <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                Invalid password.
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl shadow-cyan-950/30">
            <Image
              src="/game/stone-cutter.png"
              alt="Water-powered stone cutter — Provincia production building"
              width={597}
              height={395}
              className="h-auto w-full"
              priority
            />
            <p className="border-t border-neutral-800 bg-neutral-900/80 px-4 py-2 text-xs text-neutral-500">
              Stone cutter · water-driven sawmill from the Godot build
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [redditReport, socialDraft, health, ledger] = await Promise.all([
    getRedditReport(),
    getLatestSocialDraft(),
    getMarketingHealth(),
    getPublishLedger(),
  ]);
  const ledgerSummary = summarizePublishLedger(ledger);
  const publishedCount = getDevTalkAdminItems().filter((d) => d.isPublished).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Live health, kill switches, jobs, and channel readiness. Setup details:{" "}
          <Link href="/admin/setup" className="text-cyan-300 hover:underline">
            /admin/setup
          </Link>
          .
        </p>
      </header>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Health</p>
            <p className="mt-1 text-3xl font-bold text-cyan-100">
              {health.score}
              <span className="text-lg text-neutral-500">/100</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-200">{health.grade}</p>
            <p className="mt-1 max-w-xl text-sm text-neutral-400">{health.summary}</p>
          </div>
          <Link
            href="/admin/setup"
            className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10"
          >
            Open checklists
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {health.breakdown.map((b) => (
            <Link
              key={b.id}
              href={b.href ?? "/admin"}
              className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm hover:border-cyan-400/30"
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{b.label}</span>
                <span className="text-cyan-200">
                  {b.score}/{b.max}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{b.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Reddit queue</p>
          <p className="mt-1 text-2xl font-bold">{redditReport.opportunities.length}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {ledgerSummary.halted ? "soft-halt active" : "helpful OK"}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Published DevTalks</p>
          <p className="mt-1 text-2xl font-bold">{publishedCount}</p>
          <p className="mt-1 text-xs text-neutral-400">copy to itch from /admin/itch</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Social drafts</p>
          <p className="mt-1 text-2xl font-bold">{socialDraft ? "Ready" : "None"}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {socialDraft ? socialDraft.devtalkTitle : "Run distribute after a DevTalk"}
          </p>
        </div>
      </div>

      <MarketingControlsPanel
        initial={health.controls}
        softHalted={ledgerSummary.halted}
        haltReason={ledgerSummary.haltReason}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <JobRunnerPanel
          canRunLocal={health.canRunLocalJobs}
          canTriggerGithub={health.canTriggerGithub}
        />
        <GithubRunsPanel />
      </div>

      <section>
        <h2 className="text-lg font-semibold">Channels</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {health.channels.map((channel) => {
            const href =
              channel.id === "reddit"
                ? "/admin/reddit"
                : channel.id === "itch"
                  ? "/admin/itch"
                  : channel.id === "x" || channel.id === "discord" || channel.id === "ci"
                    ? "/admin/setup"
                    : "/admin";
            return (
              <Link
                key={channel.id}
                href={href}
                className={`rounded-xl border p-4 transition hover:border-cyan-300/40 ${
                  channel.status === "blocked"
                    ? "border-red-500/30 bg-red-950/20"
                    : "border-neutral-800 bg-neutral-900/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{channel.title}</h3>
                  <StatusBadge status={channel.status} label={`${channel.score}%`} />
                </div>
                <p className="mt-2 text-sm text-neutral-400">{channel.statusLabel}</p>
                {channel.tweak ? (
                  <p className="mt-2 text-xs text-amber-200/90">{channel.tweak}</p>
                ) : null}
              </Link>
            );
          })}
          {MARKETING_SECTIONS.filter((s) =>
            ["devtalk", "social", "downloads", "steam", "creators"].includes(s.id),
          ).map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={`rounded-xl border p-4 transition hover:border-cyan-300/40 ${
                section.status === "blocked"
                  ? "border-red-500/30 bg-red-950/20"
                  : "border-neutral-800 bg-neutral-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{section.title}</h3>
                <StatusBadge status={section.status} label={section.statusLabel.split("—")[0].trim()} />
              </div>
              <p className="mt-2 text-sm text-neutral-400">{section.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
