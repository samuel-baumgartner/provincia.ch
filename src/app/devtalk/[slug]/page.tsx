import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { getAllDevTalkMeta, getDevTalkBySlug } from "@/lib/devtalks";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  return getAllDevTalkMeta().map((talk) => ({ slug: talk.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const talk = await getDevTalkBySlug(slug);
  if (!talk) {
    return { title: "DevTalk Not Found" };
  }
  return {
    title: `${talk.title} | DevTalk`,
    description: talk.excerpt,
  };
}

export default async function DevTalkDetailPage({ params }: Props) {
  const { slug } = await params;
  const talk = await getDevTalkBySlug(slug);

  if (!talk) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
        <Link href="/devtalk" className="text-sm text-cypress-bright hover:text-cypress">
          ← Back to DevTalk
        </Link>

        <header className="mt-6 border border-ink-border bg-ink-elevated/40 p-6 md:p-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-stone md:text-5xl">
            {talk.title}
          </h1>
          <p className="mt-4 text-sm text-stone-muted">
            {formatDate(talk.date)} • {talk.author}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {talk.tags.map((tag) => (
              <span
                key={`${talk.slug}-${tag}`}
                className="border border-ink-border bg-ink px-2.5 py-1 text-xs text-stone-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <section
          className="mt-8 border border-ink-border bg-ink-elevated/20 p-6 text-lg leading-8 text-stone md:p-8 [&_a]:text-cypress-bright [&_a]:underline-offset-4 [&_a:hover]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-ink-border [&_blockquote]:pl-4 [&_em]:text-stone-muted [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-stone-muted [&_figure]:my-8 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_img]:w-full [&_img]:border [&_img]:border-ink-border [&_li]:my-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-6 [&_strong]:font-semibold [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: talk.html }}
        />
      </article>
      <SiteFooter />
    </main>
  );
}
