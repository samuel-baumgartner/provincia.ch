import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { MARKETING_SECTIONS } from "@/lib/marketing-hub";
import { BlockedBanner, StatusBadge } from "../AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const section = MARKETING_SECTIONS.find((s) => s.id === "creators")!;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Creators & press</h1>
          <StatusBadge status="blocked" label="Blocked" />
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          YouTuber outreach, press emails, and Steam key campaigns — prepared but locked until you are
          ready.
        </p>
      </header>

      <BlockedBanner
        title="Do not contact creators yet"
        reason={section.blockedReason ?? ""}
        prerequisites={section.prerequisites}
      />

      <section className="pointer-events-none select-none opacity-50">
        <h2 className="text-lg font-semibold text-neutral-500">Preview (disabled)</h2>
        <p className="mt-1 text-sm text-neutral-600">
          This section unlocks when prerequisites are met. Tools below are placeholders.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <h3 className="font-medium text-neutral-500">Creator list</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Timberborn / city-builder YouTubers with 10k–100k subs
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <h3 className="font-medium text-neutral-500">Press kit</h3>
            <p className="mt-1 text-sm text-neutral-600">provincia.ch/press (not built yet)</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <h3 className="font-medium text-neutral-500">Outreach emails</h3>
            <p className="mt-1 text-sm text-neutral-600">AI-drafted, personalized pitches</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <h3 className="font-medium text-neutral-500">Key distribution</h3>
            <p className="mt-1 text-sm text-neutral-600">Steam keys for verified creators</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
        <p className="font-semibold text-neutral-100">What to do instead right now</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            <Link href="/admin/reddit" className="text-cyan-300 hover:underline">
              Reddit queue
            </Link>{" "}
            — helpful replies, not cold promo
          </li>
          <li>
            <Link href="/admin/devtalk" className="text-cyan-300 hover:underline">
              DevTalk
            </Link>{" "}
            — build public proof of development
          </li>
          <li>
            <Link href="/admin/social" className="text-cyan-300 hover:underline">
              Social drafts
            </Link>{" "}
            — grow organic reach first
          </li>
        </ol>
      </section>
    </div>
  );
}
