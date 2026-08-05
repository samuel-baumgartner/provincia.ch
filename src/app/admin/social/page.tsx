import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getLatestSocialDraft, listSocialDraftFiles } from "@/lib/social-drafts";
import { getPublishLedger, summarizePublishLedger } from "@/lib/publish-ledger";
import { getMarketingControls } from "@/lib/marketing-controls";
import { StatusBadge } from "../AdminShell";
import SocialDraftViewer from "../SocialDraftViewer";
import JobRunnerPanel from "../JobRunnerPanel";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const [draft, files, ledger, controls] = await Promise.all([
    getLatestSocialDraft(),
    listSocialDraftFiles(),
    getPublishLedger(),
    getMarketingControls(),
  ]);
  const summary = summarizePublishLedger(ledger);
  const canRunLocal =
    process.env.MARKETING_RUNNER === "enabled" || process.env.NODE_ENV === "development";
  const canGh = Boolean(
    process.env.CONTROLS_GITHUB_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim(),
  );
  const lastPublish = summary.publishedSlugs[0]
    ? ledger?.social?.publishedSlugs?.[summary.publishedSlugs[0]]
    : null;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Social</h1>
          <StatusBadge
            status={controls.masterPublish ? "active" : "setup"}
            label={controls.masterPublish ? "Master ON" : "Master OFF"}
          />
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Drafts from your latest DevTalk. Kill switches on{" "}
          <Link href="/admin" className="text-cyan-300 hover:underline">
            Overview
          </Link>
          . Steam stays reminder-only via Discord.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-xs uppercase text-neutral-500">Discord</p>
          <p className="mt-1 font-semibold">{controls.discordAutoPost ? "Enabled" : "Off"}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {draft?.platforms?.discord ? "Draft ready" : "No Discord draft"}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-xs uppercase text-neutral-500">X</p>
          <p className="mt-1 font-semibold">{controls.xAutoPost ? "Enabled" : "Off"}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {draft?.platforms?.x?.posts?.length
              ? `${draft.platforms.x.posts.length} posts in draft`
              : "No X draft"}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-xs uppercase text-neutral-500">Last published slug</p>
          <p className="mt-1 font-semibold">{summary.publishedSlugs[0] ?? "—"}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {lastPublish && typeof lastPublish === "object" && "at" in lastPublish
              ? String(lastPublish.at)
              : "none yet"}
          </p>
        </div>
      </section>

      <JobRunnerPanel canRunLocal={canRunLocal} canTriggerGithub={canGh} />

      {!draft ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 text-sm text-neutral-300">
          No drafts yet. Publish a DevTalk, then run distribute from Jobs or the DevTalk page.
        </div>
      ) : (
        <SocialDraftViewer draft={draft} />
      )}

      {files.length > 1 ? (
        <p className="text-xs text-neutral-500">
          {files.length} draft files on disk. Showing latest: {files[0]}
        </p>
      ) : null}
    </div>
  );
}
