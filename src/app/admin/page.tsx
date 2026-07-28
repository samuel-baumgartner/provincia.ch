import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { AUTOMATION_JOBS, MARKETING_SECTIONS } from "@/lib/marketing-hub";
import { getRedditReport } from "@/lib/reddit-report";
import { getLatestSocialDraft } from "@/lib/social-drafts";
import { getDevTalkAdminItems } from "@/lib/devtalk-admin";
import { StatusBadge } from "./AdminShell";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminDashboard({ searchParams }: AdminPageProps) {
  const [{ error }, cookieStore, redditReport, socialDraft, devtalks] = await Promise.all([
    searchParams,
    cookies(),
    getRedditReport(),
    getLatestSocialDraft(),
    Promise.resolve(getDevTalkAdminItems()),
  ]);

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
              Reddit, devtalks, social drafts, and Steam prep — one place.
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

  const publishedCount = devtalks.filter((d) => d.isPublished).length;
  const pendingReddit = redditReport.opportunities.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-neutral-400">
          One place for Reddit, devtalks, social drafts, and Steam prep. Automations run via GitHub
          Actions — no AWS setup required.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Reddit queue</p>
          <p className="mt-1 text-2xl font-bold">{pendingReddit}</p>
          <p className="mt-1 text-xs text-neutral-400">threads in latest scan</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Published devtalks</p>
          <p className="mt-1 text-2xl font-bold">{publishedCount}</p>
          <p className="mt-1 text-xs text-neutral-400">{devtalks.filter((d) => d.isDraft).length} drafts</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Social drafts</p>
          <p className="mt-1 text-2xl font-bold">{socialDraft ? "Ready" : "None"}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {socialDraft ? socialDraft.devtalkTitle : "Run distribute after devtalk"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Channels</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MARKETING_SECTIONS.map((section) => (
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
              {section.status === "blocked" ? (
                <p className="mt-2 text-xs font-semibold text-red-300">⚠ Do not use yet</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Automation</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Reddit scans run on GitHub Actions (free). Social distribution runs on demand from the
          DevTalk or Social pages.
        </p>
        <ul className="mt-3 space-y-3">
          {AUTOMATION_JOBS.map((job) => (
            <li
              key={job.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-neutral-100">{job.title}</span>
                <code className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-cyan-200">
                  {job.command}
                </code>
              </div>
              <p className="mt-1 text-neutral-400">{job.description}</p>
              <p className="mt-1 text-xs text-neutral-500">{job.schedule}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-4 text-sm text-cyan-100/90">
        <p className="font-semibold text-cyan-200">Weekly rhythm (manual)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-neutral-300">
          <li>Review Reddit queue → post 1–2 helpful replies (edit before posting)</li>
          <li>Publish or polish one devtalk</li>
          <li>Generate social drafts → copy to X / Steam community manually</li>
          <li>Skip creators until the blocked checklist is done</li>
        </ol>
      </section>
    </div>
  );
}
