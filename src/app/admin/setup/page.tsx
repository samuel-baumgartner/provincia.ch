import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getMarketingHealth } from "@/lib/marketing-health";
import { StatusBadge } from "../AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  if (!(await isAdminAuthed())) redirect("/admin");

  const health = await getMarketingHealth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Setup checklists</h1>
        <p className="mt-1 text-sm text-neutral-400">
          What each channel needs. Secrets show as present/missing only — values are never displayed.
        </p>
      </header>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
        <p className="font-semibold text-neutral-100">Secret presence</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {Object.entries(health.secrets).map(([key, ok]) => (
            <li key={key} className={ok ? "text-emerald-300" : "text-amber-200"}>
              {ok ? "✓" : "○"} {key}
            </li>
          ))}
        </ul>
      </div>

      {health.channels.map((channel) => (
        <section
          key={channel.id}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{channel.title}</h2>
            <StatusBadge status={channel.status} label={`${channel.score}% · ${channel.statusLabel}`} />
          </div>
          {channel.tweak ? <p className="mt-1 text-sm text-amber-200/90">{channel.tweak}</p> : null}
          <ul className="mt-3 space-y-2">
            {channel.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm"
              >
                <div>
                  <p className={item.done ? "text-emerald-200" : "text-neutral-300"}>
                    {item.done ? "✓" : "○"} {item.label}
                  </p>
                  {item.hint ? <p className="mt-0.5 text-xs text-neutral-500">{item.hint}</p> : null}
                </div>
                {item.href ? (
                  <Link href={item.href} className="text-xs text-cyan-300 hover:underline">
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
