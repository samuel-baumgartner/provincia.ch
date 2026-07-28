import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LandingFeatures from "@/components/LandingFeatures";
import DownloadBuilds from "@/components/DownloadBuilds";
import SiteFooter from "@/components/SiteFooter";
import {
  developmentStatus,
  galleryImages,
  gamePitch,
  heroSubtitle,
  heroTagline,
  heroTaglineAccent,
  landingFeatures,
} from "@/lib/game-content";
import { getAllDevTalkMeta } from "@/lib/devtalks";

export const metadata: Metadata = {
  title: "Provinica | Roman Colony Builder",
  description: gamePitch,
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const latestTalks = getAllDevTalkMeta().slice(0, 2);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero — full-bleed key art, brand first */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-end overflow-hidden px-6 pb-20 pt-28 text-center md:justify-center md:pb-24 md:pt-24">
        <Image
          src="/game/title-hero.png"
          alt=""
          fill
          priority
          className="animate-hero-fade object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/55 to-background" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5">
          <h1 className="animate-hero-rise font-display text-5xl font-semibold leading-[1.05] tracking-tight text-stone text-balance sm:text-6xl md:text-7xl lg:text-8xl">
            Provinica
          </h1>
          <p className="animate-hero-rise-delay max-w-xl font-display text-xl leading-snug text-stone/95 text-balance md:text-2xl">
            {heroTagline}{" "}
            <span className="text-cypress-bright">{heroTaglineAccent}</span>
          </p>
          <p className="animate-hero-rise-delay max-w-lg text-base leading-relaxed text-stone-muted md:text-lg">
            {heroSubtitle}
          </p>

          <div className="animate-hero-rise-delay-2 mt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/#download"
              className="min-w-[10rem] rounded-md bg-cypress px-6 py-3 text-sm font-semibold tracking-wide text-ink transition hover:bg-cypress-bright"
            >
              Download
            </a>
            <Link
              href="/game"
              className="min-w-[10rem] rounded-md border border-stone/35 bg-ink/50 px-6 py-3 text-sm font-semibold tracking-wide text-stone backdrop-blur transition hover:border-stone/60"
            >
              About the game
            </Link>
          </div>

          <p className="animate-hero-rise-delay-2 mt-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-muted/80">
            Free pre-alpha · Steam — soon
          </p>
        </div>
      </section>

      {/* Features — Manor Lords / Foundation style pillars */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-4">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight text-stone md:text-4xl">
            About the game
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-stone-muted md:text-lg">
            {gamePitch}
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-12">
          <LandingFeatures features={landingFeatures} />
        </div>
      </section>

      {/* Key art strip */}
      <section className="border-y border-ink-border bg-ink-elevated/40">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="overflow-hidden border border-ink-border">
            <Image
              src="/game/title-secondary.png"
              alt="Provinica colony at golden hour"
              width={1200}
              height={800}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Media gallery */}
      <section id="media" className="scroll-mt-20 border-t border-ink-border bg-ink-elevated/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight text-stone md:text-4xl">
            Media
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-stone-muted">
            Screenshots from the Godot build — pre-alpha, work in progress.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.slice(0, 6).map((image) => (
              <div
                key={image.src}
                className="group overflow-hidden border border-ink-border bg-ink transition hover:border-cypress/40"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={640}
                  height={400}
                  className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/game#screenshots"
              className="text-sm font-semibold text-cypress-bright hover:underline"
            >
              View all screenshots →
            </Link>
          </p>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="scroll-mt-20 border-t border-ink-border bg-ink-elevated/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight text-stone md:text-4xl">
            Download
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-stone-muted md:text-lg">
            Play the current Godot build on your machine — Windows, macOS, or Linux.
          </p>
          <div className="mt-10">
            <DownloadBuilds />
          </div>
        </div>
      </section>

      {/* Follow the build */}
      <section id="follow" className="scroll-mt-20 border-t border-ink-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="border border-cypress/25 bg-gradient-to-br from-cypress-deep/25 to-ink-elevated/60 p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <h2 className="font-display text-2xl font-semibold text-stone md:text-3xl">
                  Follow the build
                </h2>
                <p className="mt-3 text-stone-muted">
                  DevTalk posts cover real rewrites — water sims, housing solvers, aqueduct
                  placement — with screenshots from the game. No fake roadmap.
                </p>
                <p className="mt-4 text-sm text-stone-muted/80">{developmentStatus}</p>
                <Link
                  href="/devtalk"
                  className="mt-6 inline-block rounded-md bg-cypress px-6 py-3 text-sm font-semibold tracking-wide text-ink transition hover:bg-cypress-bright"
                >
                  Read DevTalk
                </Link>
              </div>
              {latestTalks.length > 0 ? (
                <ul className="space-y-4">
                  {latestTalks.map((talk) => (
                    <li key={talk.slug}>
                      <Link
                        href={`/devtalk/${talk.slug}`}
                        className="block border border-ink-border bg-ink/70 p-5 transition hover:border-cypress/35"
                      >
                        <p className="text-xs text-stone-muted">{formatDate(talk.date)}</p>
                        <p className="mt-1 font-semibold text-stone">{talk.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-stone-muted">{talk.excerpt}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
