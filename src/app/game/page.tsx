import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import DownloadBuilds from "@/components/DownloadBuilds";
import {
  coreLoop,
  curatorQuote,
  developmentStatus,
  galleryImages,
  gamePitch,
  gameSystems,
  landingFeatures,
} from "@/lib/game-content";

export const metadata: Metadata = {
  title: "About the Game | Provinica",
  description:
    "A Roman colony builder on a terrace grid — water simulation, housing districts, colonist logistics, and battles.",
};

export default function GamePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-ink-border">
        <Image
          src="/game/colony-overview.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-background" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cypress">About</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-stone md:text-5xl">
            Build a Roman colonia on ground that fights back.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-muted">{gamePitch}</p>
          <blockquote className="mt-8 max-w-xl border-l-2 border-cypress/50 pl-4 text-stone-muted italic">
            {curatorQuote}
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-stone">Your charter</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-stone-muted">
          The wagons leave. You stand above a strip of granted land with a curia, starter housing,
          ponds along the grant, and stone and timber in the hall. Families who came with the
          charter need work. More will arrive from the road when word spreads — if you keep beds and
          food ready. You are the curator, not a god. Rome gave you the outline. The rest is
          placement, water, and patience.
        </p>
      </section>

      <section className="border-t border-ink-border bg-ink-elevated/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-stone">What you&apos;ll do</h2>
          <ol className="mt-8 max-w-3xl space-y-4">
            {coreLoop.map((step, i) => (
              <li key={step} className="flex gap-4 text-stone">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-cypress/35 bg-cypress-deep/30 text-sm font-bold text-cypress-bright">
                  {i + 1}
                </span>
                <span className="pt-1 text-stone-muted">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-ink-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-stone">Features at a glance</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {landingFeatures.map((f) => (
              <article key={f.id} className="space-y-3">
                <div className="overflow-hidden border border-ink-border">
                  <Image
                    src={f.image}
                    alt={f.imageAlt}
                    width={640}
                    height={400}
                    className="aspect-video w-full object-cover"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-cypress-bright">{f.title}</h3>
                <p className="text-sm leading-relaxed text-stone-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink-border bg-ink-elevated/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-stone">Under the hood</h2>
          <p className="mt-2 text-sm text-stone-muted">
            For players who want the technical picture — straight from the dev build.
          </p>
          <div className="mt-10 space-y-16">
            {gameSystems.map((system, index) => (
              <article
                key={system.id}
                className={`grid gap-8 lg:grid-cols-2 lg:items-center ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div>
                  <h3 className="font-display text-xl font-semibold text-stone">{system.title}</h3>
                  <p className="mt-4 leading-relaxed text-stone-muted">{system.text}</p>
                </div>
                <div className="overflow-hidden border border-ink-border">
                  <Image
                    src={system.image}
                    alt={system.imageAlt}
                    width={1200}
                    height={800}
                    className="h-auto w-full"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="screenshots" className="scroll-mt-20 border-t border-ink-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-stone">Screenshots</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <div
                key={image.src}
                className="overflow-hidden border border-ink-border bg-ink-elevated/40"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={600}
                  height={400}
                  className="aspect-video w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="scroll-mt-20 border-t border-ink-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-stone">Download</h2>
          <p className="mt-3 max-w-2xl text-stone-muted">
            Grab the current pre-alpha build for your platform. Free — expect bugs.
          </p>
          <div className="mt-8">
            <DownloadBuilds compact />
          </div>
        </div>
      </section>

      <section className="border-t border-ink-border bg-ink-elevated/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold text-stone">Where we are</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-muted">{developmentStatus}</p>
          </div>
          <Link
            href="/devtalk"
            className="rounded-md bg-cypress px-6 py-3 text-sm font-semibold tracking-wide text-ink transition hover:bg-cypress-bright"
          >
            Follow on DevTalk
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
