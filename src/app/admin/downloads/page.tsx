import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getDownloadStats } from "@/lib/download-stats";
import { StatusBadge } from "../AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDownloadsPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const stats = await getDownloadStats(30);
  const platforms = Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1]);
  const sources = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Downloads</h1>
          <StatusBadge
            status={stats.configured ? "active" : "setup"}
            label={stats.configured ? "Tracking on" : "Upstash not configured"}
          />
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Soft-redirect counts from{" "}
          <code className="text-cyan-200">/api/download/[platform]</code> → itch.io. Source comes
          from UTMs on marketing links (sessionStorage) — no cookie wall.
        </p>
      </header>

      {!stats.configured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-5 text-sm text-amber-100/90">
          Set <code className="text-amber-200">UPSTASH_REDIS_REST_URL</code> and{" "}
          <code className="text-amber-200">UPSTASH_REDIS_REST_TOKEN</code> in Vercel /{" "}
          <code>.env.local</code>. Downloads still work; counts will appear once Redis is connected.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total (tracked)</p>
          <p className="mt-1 text-3xl font-bold">{stats.total}</p>
          <p className="mt-1 text-xs text-neutral-500">itch build {stats.releaseTag}</p>
        </div>
        {platforms.map(([id, n]) => (
          <div key={id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{id}</p>
            <p className="mt-1 text-3xl font-bold">{n}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="font-semibold">By source (last {stats.days.length || 30} days)</h2>
        {sources.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No attributed downloads yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sources.map(([src, n]) => (
              <li key={src} className="flex justify-between text-sm">
                <span className="text-neutral-300">{src}</span>
                <span className="font-mono text-neutral-100">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.days.length > 0 ? (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="font-semibold">Recent days</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Windows</th>
                  <th className="py-2 pr-4">macOS</th>
                  <th className="py-2 pr-4">Linux</th>
                </tr>
              </thead>
              <tbody>
                {stats.days.slice(0, 14).map((day) => (
                  <tr key={day} className="border-t border-neutral-800">
                    <td className="py-2 pr-4 font-mono text-neutral-300">{day}</td>
                    <td className="py-2 pr-4">{stats.byDayPlatform[day]?.windows ?? 0}</td>
                    <td className="py-2 pr-4">{stats.byDayPlatform[day]?.macos ?? 0}</td>
                    <td className="py-2 pr-4">{stats.byDayPlatform[day]?.linux ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
