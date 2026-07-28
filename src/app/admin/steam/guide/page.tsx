import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getGuideBySlug } from "@/lib/guides";

export const dynamic = "force-dynamic";

const GUIDE_SLUG = "steam-page-setup";

export const metadata: Metadata = {
  title: "Steam Setup Guide | Admin",
  description: "Step-by-step Provinica Steam store page and Next Fest prep.",
};

const PROSE_CLASS =
  "prose-guide text-sm leading-relaxed text-neutral-200 md:text-base [&_a]:text-cyan-300 [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-700 [&_blockquote]:pl-4 [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-neutral-800 [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-neutral-800 [&_pre]:bg-neutral-950 [&_pre]:p-4 [&_pre_code]:text-xs [&_pre_code]:text-neutral-300 [&_strong]:font-semibold [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm [&_td]:border [&_td]:border-neutral-800 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-neutral-800 [&_th]:bg-neutral-900/80 [&_th]:px-3 [&_th]:py-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6";

export default async function AdminSteamGuidePage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const guide = await getGuideBySlug(GUIDE_SLUG);
  if (!guide) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/steam" className="text-sm text-cyan-300 hover:underline">
          ← Back to Steam checklist
        </Link>
        <h1 className="mt-3 text-2xl font-bold">{guide.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-400">{guide.excerpt}</p>
        <p className="mt-2 text-xs text-neutral-500">
          Source: <code className="text-neutral-400">content/guides/{GUIDE_SLUG}.md</code> — edit
          there to update this page.
        </p>
      </header>

      <article
        className={`rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 md:p-8 ${PROSE_CLASS}`}
        dangerouslySetInnerHTML={{ __html: guide.html }}
      />
    </div>
  );
}
