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
  runner: "github-actions" | "cursor-loop" | "manual" | "local";
  description: string;
};

export const MARKETING_SECTIONS: MarketingSection[] = [
  {
    id: "reddit",
    title: "Reddit",
    href: "/admin/reddit",
    description: "Scan threads, safety-gated auto-replies, ledger status.",
    status: "active",
    statusLabel: "Helpful OK while young; promo after age/karma + public comments",
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
    title: "Social",
    href: "/admin/social",
    description: "Drafts + auto-publish to Discord / X / Reddit (Steam reminder).",
    status: "active",
    statusLabel: "Active — controlled by kill switches",
  },
  {
    id: "itch",
    title: "itch.io",
    href: "/admin/itch",
    description: "Page checklist + copy DevTalk as itch BBCode.",
    status: "setup",
    statusLabel: "Setup — paste BBCode into itch Devlogs",
  },
  {
    id: "setup",
    title: "Setup",
    href: "/admin/setup",
    description: "Checklists for Reddit, X, Discord, itch, and CI secrets.",
    status: "ready",
    statusLabel: "Ready — see what each channel needs",
  },
  {
    id: "downloads",
    title: "Downloads",
    href: "/admin/downloads",
    description: "Platform + source download counts (soft redirect).",
    status: "active",
    statusLabel: "Active — needs Upstash for counts",
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
    schedule: "Manual / local (no GitHub schedule)",
    runner: "manual",
    description:
      "Fetches fresh threads from city-builder subs and writes reports/reddit-opportunities.md.",
  },
  {
    id: "reddit-engage",
    title: "Reddit auto-engage",
    command: "pnpm reddit:engage",
    schedule: "Local/VPS daily (~80% days, ~4 comments / 30m + lurk)",
    runner: "local",
    description:
      "Paced browser session: random rest days, lurk/API fetches without commenting, then spaced replies. Requires master+Reddit toggles + login profile. Skips GitHub Actions.",
  },
  {
    id: "devtalk-distribute",
    title: "DevTalk → social drafts",
    command: "pnpm devtalk:distribute",
    schedule: "Before social:publish / after each new devtalk",
    runner: "manual",
    description:
      "Turns your latest devtalk into Reddit, Discord, X, and Steam drafts (UTM’d) in reports/social-drafts/.",
  },
  {
    id: "social-publish",
    title: "Social auto-publish",
    command: "pnpm social:publish",
    schedule: "Daily 15:00 UTC + after distribute (GitHub Actions)",
    runner: "github-actions",
    description:
      "Posts Discord webhook + optional X/Reddit self-post; Steam gets a Discord paste reminder. Kill switch: MARKETING_AUTO_PUBLISH=0.",
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
