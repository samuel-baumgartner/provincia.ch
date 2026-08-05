import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getDevTalkAdminItems } from "@/lib/devtalk-admin";
import { getMarketingControls } from "@/lib/marketing-controls";
import CopyItchButton from "../CopyItchButton";
import CopyCoverButton from "../CopyCoverButton";
import ItchChecklistForm from "../ItchChecklistForm";

export const dynamic = "force-dynamic";

export default async function AdminItchPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const [items, controls] = await Promise.all([getDevTalkAdminItems(), getMarketingControls()]);
  const published = items.filter((i) => i.isPublished);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">itch.io</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Copy as <strong className="text-neutral-200">rich HTML</strong> for itch&apos;s visual
          Devlog editor (Markdown/BBCode paste shows as raw tags). Covers and inline shots are{" "}
          <strong className="text-neutral-200">real in-game screenshots</strong> via{" "}
          <code className="text-cyan-200">coverImage</code> +{" "}
          <code className="text-cyan-200">pnpm assets:sync</code> (never AI).
        </p>
      </header>

      <ItchChecklistForm initial={controls.itch} />

      <section>
        <h2 className="text-lg font-semibold">Copy DevTalk → itch</h2>
        <p className="mt-1 text-sm text-neutral-400">
          <strong className="text-neutral-200">Copy itch HTML</strong> puts rich HTML on the
          clipboard (with <code className="text-cyan-200">https://provincia.ch/…</code> images) —
          paste into itch&apos;s <em>visual</em> Devlog editor, not Markdown/source mode. Cover
          button copies the PNG onto the clipboard. Body images live in the DevTalk markdown at the
          right sections (real in-game captures via{" "}
          <code className="text-cyan-200">pnpm assets:sync</code>).
        </p>
        <ul className="mt-3 space-y-2">
          {published.length === 0 ? (
            <li className="text-sm text-neutral-500">Publish a DevTalk first.</li>
          ) : (
            published.map((item) => (
              <li
                key={item.slug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-neutral-500">
                    {item.date}
                    {item.coverExists ? " · cover OK" : " · missing coverImage / file"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {item.publicUrl ? (
                    <Link
                      href={item.publicUrl}
                      className="text-sm text-cyan-300 hover:underline"
                      target="_blank"
                    >
                      View
                    </Link>
                  ) : null}
                  <CopyItchButton slug={item.slug} />
                  <CopyCoverButton
                    slug={item.slug}
                    coverPath={item.coverExists ? item.coverImage : null}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
