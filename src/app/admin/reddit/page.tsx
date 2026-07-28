import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getRedditReport } from "@/lib/reddit-report";
import AdminOpportunities from "../AdminOpportunities";
import RedditScanPanel from "../RedditScanPanel";

export const dynamic = "force-dynamic";

export default async function AdminRedditPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const report = await getRedditReport();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Reddit</h1>
        <p className="mt-1 text-sm text-neutral-400">
          AI finds threads and drafts replies. You edit and post manually — never auto-post.
        </p>
      </header>

      <RedditScanPanel generatedAt={report.generatedAt} />

      <AdminOpportunities opportunities={report.opportunities} generatedAt={report.generatedAt} />
    </div>
  );
}
