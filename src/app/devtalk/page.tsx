import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { getAllDevTalkMeta } from "@/lib/devtalks";

export const metadata: Metadata = {
  title: "DevTalk | Provinica",
  description: "Development updates from the Provinica build — systems, screenshots, honest progress.",
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DevTalkPage() {
  const talks = getAllDevTalkMeta();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-ink-border bg-ink-elevated/30">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cypress">
            Development blog
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-stone md:text-5xl">
            DevTalk
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-muted">
            Design decisions, system rewrites, and screenshots from the Godot build — the same posts
            we link from Reddit and social.
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        {talks.map((talk) => (
          <article
            key={talk.slug}
            className="overflow-hidden border border-ink-border bg-ink-elevated/40 transition hover:border-cypress/40"
          >
            {talk.coverImage ? (
              <Link href={`/devtalk/${talk.slug}`} className="block">
                <Image
                  src={talk.coverImage}
                  alt=""
                  width={800}
                  height={420}
                  className="h-48 w-full border-b border-ink-border object-cover"
                />
              </Link>
            ) : null}
            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-stone-muted">
                <span>{formatDate(talk.date)}</span>
                <span>•</span>
                <span>{talk.author}</span>
              </div>
              <h2 className="font-display text-xl font-semibold text-stone">
                <Link href={`/devtalk/${talk.slug}`} className="hover:text-cypress-bright">
                  {talk.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-muted">{talk.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {talk.tags.map((tag) => (
                  <span
                    key={`${talk.slug}-${tag}`}
                    className="border border-ink-border px-2.5 py-1 text-xs text-stone-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <SiteFooter />
    </main>
  );
}
