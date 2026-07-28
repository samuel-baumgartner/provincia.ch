import Link from "next/link";
import { developmentStatus } from "@/lib/game-content";

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-border bg-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-xl font-semibold tracking-tight text-stone">
            Provinica
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-muted">{developmentStatus}</p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-stone">Explore</p>
            <ul className="space-y-1.5 text-stone-muted">
              <li>
                <Link href="/#download" className="transition hover:text-cypress-bright">
                  Download
                </Link>
              </li>
              <li>
                <Link href="/#features" className="transition hover:text-cypress-bright">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#media" className="transition hover:text-cypress-bright">
                  Media
                </Link>
              </li>
              <li>
                <Link href="/game" className="transition hover:text-cypress-bright">
                  About the game
                </Link>
              </li>
              <li>
                <Link href="/devtalk" className="transition hover:text-cypress-bright">
                  DevTalk
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-stone">Status</p>
            <ul className="space-y-1.5 text-stone-muted">
              <li>Pre-alpha — free download</li>
              <li>Steam — coming later</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-ink-border/80 py-4 text-center text-xs text-stone-muted/70">
        © {new Date().getFullYear()} Provinica
      </div>
    </footer>
  );
}
