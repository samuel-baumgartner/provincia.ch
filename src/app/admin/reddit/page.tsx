import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getRedditReport } from "@/lib/reddit-report";
import { getPublishLedger, summarizePublishLedger } from "@/lib/publish-ledger";
import { getMarketingControls } from "@/lib/marketing-controls";
import AdminOpportunities from "../AdminOpportunities";
import RedditScanPanel from "../RedditScanPanel";
import { StatusBadge } from "../AdminShell";
import JobRunnerPanel from "../JobRunnerPanel";
import ClearHaltButton from "../ClearHaltButton";

export const dynamic = "force-dynamic";

export default async function AdminRedditPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const [report, ledger, controls] = await Promise.all([
    getRedditReport(),
    getPublishLedger(),
    getMarketingControls(),
  ]);
  const summary = summarizePublishLedger(ledger);
  const canRunLocal =
    process.env.MARKETING_RUNNER === "enabled" || process.env.NODE_ENV === "development";
  const canGh = Boolean(
    process.env.CONTROLS_GITHUB_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim(),
  );

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Reddit</h1>
          <StatusBadge
            status={summary.halted ? "setup" : "active"}
            label={summary.halted ? "Soft-halt (promo off)" : "Engage when toggles on"}
          />
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Browser session + safety gates. Cadence ≈ every 4th answer promo (
          {controls.reddit.minHelpfulPerPromo} helpful : 1) after the account is warmed. Master and
          Reddit kill switches live on Overview.
        </p>
      </header>

      {summary.halted ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100">
          <p className="font-semibold">Soft halt — helpful continues, promo blocked</p>
          <p className="mt-1 text-amber-100/80">{summary.haltReason}</p>
          <div className="mt-3">
            <ClearHaltButton />
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-xs uppercase text-neutral-500">Today</p>
          <p className="mt-1 text-neutral-200">
            helpful {summary.today.helpful} · promo {summary.today.promo} · self{" "}
            {summary.today.self_post}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-xs uppercase text-neutral-500">Last 30d</p>
          <p className="mt-1 text-neutral-200">
            helpful {summary.last30d.helpful} · promo {summary.last30d.promo} · self{" "}
            {summary.last30d.self_post}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-xs uppercase text-neutral-500">Controls</p>
          <p className="mt-1 text-neutral-200">
            master {controls.masterPublish ? "ON" : "OFF"} · reddit{" "}
            {controls.redditAutoPost ? "ON" : "OFF"} · dry{" "}
            {controls.redditDryRun ? "ON" : "OFF"}
          </p>
        </div>
      </section>

      {summary.recentActions.length > 0 ? (
        <ul className="space-y-2 text-sm text-neutral-300">
          {summary.recentActions.map((a) => (
            <li key={a.id} className="rounded-lg border border-neutral-800 px-3 py-2">
              <span className="font-mono text-xs text-cyan-300">{a.type}</span> r/{a.subreddit} ·{" "}
              {a.title ?? a.thingId} · {new Date(a.at).toLocaleString()}
              {a.permalink ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={a.permalink} className="text-cyan-300 hover:underline" target="_blank">
                    link
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <JobRunnerPanel canRunLocal={canRunLocal} canTriggerGithub={canGh} />

      <RedditScanPanel generatedAt={report.generatedAt} />

      <AdminOpportunities opportunities={report.opportunities} generatedAt={report.generatedAt} />
    </div>
  );
}
