"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#features", label: "Features", homeOnly: true },
  { href: "/game", label: "About" },
  { href: "/devtalk", label: "DevTalk" },
];

export default function SiteNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-ink-border/60 bg-ink/85 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-stone"
        >
          Provinica
        </Link>
        <ul className="flex items-center gap-5 sm:gap-8">
          {links.map((link) => {
            if (link.homeOnly && !onHome) {
              return (
                <li key={link.href} className="hidden sm:block">
                  <Link
                    href="/#features"
                    className="text-sm text-stone-muted transition hover:text-cypress-bright"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            }
            if (link.homeOnly && onHome) {
              return (
                <li key={link.href} className="hidden sm:block">
                  <a
                    href={link.href}
                    className="text-sm text-stone-muted transition hover:text-cypress-bright"
                  >
                    {link.label}
                  </a>
                </li>
              );
            }
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm transition hover:text-cypress-bright ${
                    pathname === link.href ? "text-cypress-bright" : "text-stone-muted"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/devtalk"
              className="rounded-md bg-cypress px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:bg-cypress-bright sm:px-4 sm:py-2"
            >
              Follow build
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
