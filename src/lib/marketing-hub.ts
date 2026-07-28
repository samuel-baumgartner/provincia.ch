export type MarketingStatus = "ready" | "active" | "blocked" | "setup";

export type MarketingSection = {
  id: string;
  title: string;
  href: string;
  description: string;
  status: MarketingStatus;
  statusLabel: string;
  blockedReason?: string;
  prerequisites?: string[];
};

export type AutomationJob = {
  id: string;
  title: string;
  command: string;
  schedule: string;
  runner: "github-actions" | "cursor-loop" | "manual";
  description: string;
};

export const MARKETING_SECTIONS: MarketingSection[] = [
  {
    id: "reddit",
    title: "Reddit",
    href: "/admin/reddit",
    description: "Scan threads, review AI-drafted replies, post manually.",
    status: "active",
    statusLabel: "Active — run scan, then review queue",
  },
  {
    id: "devtalk",
    title: "DevTalk",
    href: "/admin/devtalk",
    description: "Published posts, drafts from Reddit, and distribution.",
    status: "active",
    statusLabel: "Active — publish devlogs weekly",
  },
  {
    id: "social",
    title: "Social drafts",
    href: "/admin/social",
    description: "Platform-specific posts generated from your latest devtalk.",
    status: "active",
    statusLabel: "Active — generate after each devtalk",
  },
  {
    id: "steam",
    title: "Steam",
    href: "/admin/steam",
    description: "Next Fest checklist and store-page prep.",
    status: "setup",
    statusLabel: "Setup — no Steam page yet",
    prerequisites: [
      "Public Coming Soon store page on Steam",
      "Playable 20–40 minute demo build",
      "Capsule art + 5+ screenshots",
    ],
  },
  {
    id: "creators",
    title: "Creators & press",
    href: "/admin/creators",
    description: "YouTuber outreach, press kit, and key distribution.",
    status: "blocked",
    statusLabel: "Blocked — not ready yet",
    blockedReason:
      "Wait until you have a playable demo link, a polished press kit, and at least 3 published devtalks. Cold outreach before that burns contacts.",
    prerequisites: [
      "3+ published devtalks",
      "Public demo (itch or Steam)",
      "/press page with screenshots and one-liner",
      "10+ hours of genuine Reddit participation (not promo)",
    ],
  },
];

export const AUTOMATION_JOBS: AutomationJob[] = [
  {
    id: "reddit-scan",
    title: "Reddit opportunity scan",
    command: "pnpm reddit:scan",
    schedule: "Daily 08:00 UTC (GitHub Actions)",
    runner: "github-actions",
    description:
      "Fetches fresh threads from city-builder subs and writes reports/reddit-opportunities.md. The admin UI reads that file — no AWS needed.",
  },
  {
    id: "devtalk-distribute",
    title: "DevTalk → social drafts",
    command: "pnpm devtalk:distribute",
    schedule: "After each new devtalk (manual or button)",
    runner: "manual",
    description:
      "Turns your latest devtalk into Reddit, X, and Steam community post drafts in reports/social-drafts/.",
  },
  {
    id: "cursor-loop",
    title: "Local scan loop (optional)",
    command: "/loop 1d pnpm reddit:scan",
    schedule: "Every 24h while your machine is on",
    runner: "cursor-loop",
    description:
      "Use a Cursor automation loop if you develop locally and want scans without GitHub Actions.",
  },
];

export const STEAM_NEXT_FEST_CHECKLIST = [
  { id: "store-page", label: "Public Coming Soon store page", done: false },
  { id: "demo", label: "Playable demo (20–40 min of best content)", done: false },
  { id: "capsule", label: "Capsule art + 5 screenshots", done: false },
  { id: "wishlist-cta", label: "Wishlist CTA on demo end screen", done: false },
  { id: "register", label: "Register for Next Fest in Steamworks", done: false },
  { id: "build-review", label: "Submit demo build 2+ weeks before fest", done: false },
  { id: "devtalk-momentum", label: "2+ devtalks + Reddit presence before fest", done: false },
];
