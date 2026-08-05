import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getDevTalkAdminItems } from "@/lib/devtalk-admin";
import DevTalkActions from "../DevTalkActions";
import CopyItchButton from "../CopyItchButton";
import CopyCoverButton from "../CopyCoverButton";

export const dynamic = "force-dynamic";

export default async function AdminDevTalkPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const items = getDevTalkAdminItems();
  const published = items.filter((i) => i.isPublished);
  const drafts = items.filter((i) => i.isDraft);
  const missingCover = published.filter((i) => !i.coverExists);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">DevTalk</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Every published DevTalk needs a <code className="text-cyan-200">coverImage</code>. Copy
          BBCode / cover from here or{" "}
          <Link href="/admin/itch" className="text-cyan-300 hover:underline">
            /admin/itch
          </Link>
          .
        </p>
      </header>

      {missingCover.length > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          Missing cover file/frontmatter:{" "}
          {missingCover.map((i) => i.slug).join(", ")}
        </div>
      ) : null}

      <DevTalkActions />

      <section>
        <h2 className="text-lg font-semibold">Published ({published.length})</h2>
        <ul className="mt-3 space-y-2">
          {published.length === 0 ? (
            <li className="text-sm text-neutral-500">No published posts yet.</li>
          ) : (
            published.map((item) => (
              <li
                key={item.slug}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-neutral-500">
                    {item.date}
                    {item.coverExists ? " · cover OK" : " · missing cover"}
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

      <section>
        <h2 className="text-lg font-semibold">Drafts ({drafts.length})</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Remove <code>draft: true</code> from frontmatter (or ensure slug is in the published list)
          before going live.
        </p>
        <ul className="mt-3 space-y-2">
          {drafts.length === 0 ? (
            <li className="text-sm text-neutral-500">No drafts. Generate from Reddit queue.</li>
          ) : (
            drafts.map((item) => (
              <li
                key={item.slug}
                className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
              >
                <p className="font-medium text-amber-100">{item.title}</p>
                <p className="text-xs text-neutral-500">{item.path}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
        <p className="font-semibold text-neutral-100">New devtalk workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Write in <code>content/devtalks/your-slug.md</code> with YAML frontmatter including
            required <code>coverImage</code>
          </li>
          <li>
            Put the cover file at <code>public/devtalks/your-slug/cover.png</code> (topic-fitting
            screenshot or generated image)
          </li>
          <li>Run distribute (button above) to create social drafts</li>
          <li>Link from Reddit replies to <code>provincia.ch/devtalk/…</code></li>
        </ol>
      </section>
    </div>
  );
}
