import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getLatestSocialDraft, listSocialDraftFiles } from "@/lib/social-drafts";
import { StatusBadge } from "../AdminShell";
import SocialDraftViewer from "../SocialDraftViewer";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const [draft, files] = await Promise.all([getLatestSocialDraft(), listSocialDraftFiles()]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Social drafts</h1>
          <StatusBadge status="active" label="Copy & post manually" />
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Platform-specific text from your latest devtalk. Never auto-post — copy, edit, then publish
          yourself.
        </p>
      </header>

      {!draft ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 text-sm text-neutral-300">
          No drafts yet. Publish a devtalk, then run{" "}
          <code className="text-cyan-200">pnpm devtalk:distribute</code> or use the button on the
          DevTalk page.
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
