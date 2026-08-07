import { existsSync } from "node:fs";
import path from "node:path";
import { getMarketingControlsSync, type MarketingControls } from "./marketing-controls";
import { getPublishLedger, summarizePublishLedger } from "./publish-ledger";
import { getRedditReport } from "./reddit-report";
import { getLatestSocialDraft } from "./social-drafts";
import { getDevTalkAdminItems } from "./devtalk-admin";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
  href?: string;
};

export type ChannelReadiness = {
  id: string;
  title: string;
  status: "ready" | "active" | "setup" | "blocked";
  statusLabel: string;
  items: ChecklistItem[];
  score: number;
  tweak?: string;
};

export type HealthBreakdown = {
  id: string;
  label: string;
  score: number;
  max: number;
  note: string;
  href?: string;
};

export type MarketingHealth = {
  score: number;
  grade: string;
  summary: string;
  breakdown: HealthBreakdown[];
  channels: ChannelReadiness[];
  controls: MarketingControls;
  secrets: Record<string, boolean>;
  canRunLocalJobs: boolean;
  canTriggerGithub: boolean;
};

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function workflowExists(name: string): boolean {
  return existsSync(path.resolve(process.cwd(), ".github/workflows", name));
}

function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export async function getMarketingHealth(): Promise<MarketingHealth> {
  const controls = getMarketingControlsSync();
  const [ledger, redditReport, socialDraft] = await Promise.all([
    getPublishLedger(),
    getRedditReport(),
    getLatestSocialDraft(),
  ]);
  const summary = summarizePublishLedger(ledger);
  const devtalks = getDevTalkAdminItems();
  const published = devtalks.filter((d) => d.isPublished).length;

  const secrets = {
    OPENAI_API_KEY: present("OPENAI_API_KEY"),
    DISCORD_WEBHOOK_URL: present("DISCORD_WEBHOOK_URL"),
    X_API_KEY: present("X_API_KEY"),
    X_API_SECRET: present("X_API_SECRET"),
    X_ACCESS_TOKEN: present("X_ACCESS_TOKEN"),
    X_ACCESS_SECRET: present("X_ACCESS_SECRET"),
    ADMIN_PASSWORD: present("ADMIN_PASSWORD"),
    GITHUB_TOKEN: present("CONTROLS_GITHUB_TOKEN") || present("GITHUB_TOKEN"),
    UPSTASH_REDIS: present("UPSTASH_REDIS_REST_URL") && present("UPSTASH_REDIS_REST_TOKEN"),
  };

  const profileDir = path.resolve(
    process.cwd(),
    process.env.REDDIT_BROWSER_PROFILE?.trim() || "data/reddit-browser-profile",
  );
  const browserProfile = existsSync(profileDir);

  const scanAgeH = hoursSince(redditReport.generatedAt);
  const draftAgeH = hoursSince(socialDraft?.generatedAt ?? null);

  const redditItems: ChecklistItem[] = [
    {
      id: "openai",
      label: "OPENAI_API_KEY for scan drafts",
      done: secrets.OPENAI_API_KEY,
      hint: "Required for reddit:scan comment drafts",
    },
    {
      id: "browser",
      label: "Local Reddit browser session (pnpm reddit:login)",
      done: browserProfile,
      hint: "Engage needs a persistent profile — local/VPS only, not GitHub Actions",
      href: "/admin/reddit",
    },
    {
      id: "master",
      label: "Master publish enabled",
      done: controls.masterPublish,
      href: "/admin",
    },
    {
      id: "reddit-auto",
      label: "Reddit auto-post enabled",
      done: controls.redditAutoPost,
      href: "/admin",
    },
    {
      id: "scan-fresh",
      label: "Scan report fresher than 36h",
      done: scanAgeH != null && scanAgeH < 36,
      hint: scanAgeH == null ? "No report yet" : `${scanAgeH.toFixed(0)}h old`,
      href: "/admin/reddit",
    },
    {
      id: "queue",
      label: `Opportunity queue (${redditReport.opportunities.length})`,
      done: redditReport.opportunities.length > 0,
      href: "/admin/reddit",
    },
    {
      id: "soft-halt",
      label: "No soft-halt (comments visible to strangers)",
      done: !summary.halted,
      hint: summary.halted ? summary.haltReason ?? "Halted" : undefined,
      href: "/admin/reddit",
    },
  ];

  const xItems: ChecklistItem[] = [
    {
      id: "x-keys",
      label: "X API keys present",
      done: secrets.X_API_KEY && secrets.X_API_SECRET && secrets.X_ACCESS_TOKEN && secrets.X_ACCESS_SECRET,
    },
    { id: "x-auto", label: "X auto-post enabled", done: controls.xAutoPost, href: "/admin" },
    {
      id: "x-draft",
      label: "Latest draft has X posts",
      done: Boolean(socialDraft?.platforms?.x?.posts?.length),
      href: "/admin/social",
    },
  ];

  const discordItems: ChecklistItem[] = [
    { id: "webhook", label: "DISCORD_WEBHOOK_URL present", done: secrets.DISCORD_WEBHOOK_URL },
    {
      id: "discord-auto",
      label: "Discord auto-post enabled",
      done: controls.discordAutoPost,
      href: "/admin",
    },
    {
      id: "discord-draft",
      label: "Latest draft has Discord payload",
      done: Boolean(socialDraft?.platforms?.discord),
      href: "/admin/social",
    },
  ];

  const itch = controls.itch;
  const itchItems: ChecklistItem[] = [
    {
      id: "page",
      label: "itch.io page ready",
      done: itch.pageReady,
      hint: itch.pageUrl || "Set URL in itch checklist",
      href: "/admin/itch",
    },
    { id: "cover", label: "Cover art uploaded", done: itch.coverReady, href: "/admin/itch" },
    { id: "demo", label: "Demo / download linked", done: itch.demoLinked, href: "/admin/itch" },
    { id: "tags", label: "Tags set", done: itch.tagsSet, href: "/admin/itch" },
    {
      id: "devtalks",
      label: `Published DevTalks to copy (${published})`,
      done: published > 0,
      href: "/admin/itch",
    },
  ];

  const ciItems: ChecklistItem[] = [
    {
      id: "scan-local",
      label: "Reddit scan is local/manual (pnpm reddit:scan)",
      done: true,
      hint: "Scheduled marketing-scan.yml removed — run when you want a fresh queue",
    },
    {
      id: "publish-wf",
      label: "marketing-publish.yml present",
      done: workflowExists("marketing-publish.yml"),
    },
    {
      id: "gh-token",
      label: "GitHub token for triggers (CONTROLS_GITHUB_TOKEN)",
      done: secrets.GITHUB_TOKEN,
      hint: "Optional — enables Run via GitHub from admin",
    },
    {
      id: "note-reddit",
      label: "Understand: Reddit engage is local/VPS (browser), not GHA",
      done: true,
      hint: "CI can distribute/publish Discord+X; Reddit comments need your machine",
    },
  ];

  const channelFrom = (
    id: string,
    title: string,
    items: ChecklistItem[],
    tweak?: string,
  ): ChannelReadiness => {
    const done = items.filter((i) => i.done).length;
    const score = pct(done, items.length);
    let status: ChannelReadiness["status"] = "setup";
    let statusLabel = `${done}/${items.length} ready`;
    if (score >= 85) {
      status = "active";
      statusLabel = "Ready";
    } else if (score >= 50) {
      status = "ready";
      statusLabel = "Almost";
    } else if (score < 25) {
      status = "blocked";
      statusLabel = "Needs setup";
    }
    return { id, title, status, statusLabel, items, score, tweak };
  };

  const channels = [
    channelFrom(
      "reddit",
      "Reddit",
      redditItems,
      "Age/karma only block promo; keep posting helpful until comments are public",
    ),
    channelFrom("x", "X (Twitter)", xItems, "Enable X auto-post only after keys are verified"),
    channelFrom("discord", "Discord", discordItems),
    channelFrom("itch", "itch.io", itchItems, "Copy DevTalk as BBCode from /admin/itch"),
    channelFrom("ci", "CI / GitHub Actions", ciItems),
  ];

  const breakdown: HealthBreakdown[] = [];

  // Publishing 25
  let pub = 0;
  if (controls.masterPublish) pub += 10;
  if (controls.discordAutoPost && secrets.DISCORD_WEBHOOK_URL) pub += 8;
  if (controls.xAutoPost && secrets.X_API_KEY) pub += 4;
  if (summary.publishedSlugs.length > 0) pub += 3;
  breakdown.push({
    id: "publishing",
    label: "Publishing",
    score: pub,
    max: 25,
    note: controls.masterPublish
      ? "Master publish is on"
      : "Master publish is off — pipelines stay safe/no-op",
    href: "/admin",
  });

  // Reddit quality 30
  let rq = 0;
  if (!summary.halted) rq += 10;
  else rq += 3;
  if (scanAgeH != null && scanAgeH < 36) rq += 8;
  if (redditReport.opportunities.length > 0) rq += 5;
  if (browserProfile) rq += 4;
  if (summary.last30d.helpful >= summary.last30d.promo * 3) rq += 3;
  breakdown.push({
    id: "reddit",
    label: "Reddit quality",
    score: Math.min(30, rq),
    max: 30,
    note: summary.halted
      ? "Soft-halt: promo blocked, helpful continues"
      : `Cadence ~every 4th promo (${summary.last30d.helpful}h / ${summary.last30d.promo}p last 30d)`,
    href: "/admin/reddit",
  });

  // Coverage 25
  let cov = 0;
  if (published > 0) cov += 8;
  if (socialDraft) cov += 6;
  if (socialDraft?.platforms?.discord) cov += 4;
  if (socialDraft?.platforms?.x?.posts?.length) cov += 4;
  if (itch.pageReady) cov += 3;
  breakdown.push({
    id: "coverage",
    label: "Coverage",
    score: Math.min(25, cov),
    max: 25,
    note:
      draftAgeH != null
        ? `Latest social draft ~${draftAgeH.toFixed(0)}h old`
        : "No social draft yet — run distribute",
    href: "/admin/social",
  });

  // CI 20
  let ci = 0;
  if (workflowExists("marketing-publish.yml")) ci += 8;
  if (secrets.OPENAI_API_KEY) ci += 6;
  if (secrets.GITHUB_TOKEN) ci += 6;
  breakdown.push({
    id: "ci",
    label: "CI",
    score: Math.min(20, ci),
    max: 20,
    note: "Publish workflow + secrets; Reddit scan/engage stay local",
    href: "/admin/setup",
  });

  const score = breakdown.reduce((s, b) => s + b.score, 0);
  const grade = score >= 80 ? "Good" : score >= 55 ? "OK" : score >= 35 ? "Warming up" : "Setup needed";
  const summaryText =
    score >= 80
      ? "Pipelines look healthy — keep an eye on Reddit public visibility before promos."
      : score >= 55
        ? "Basics work; finish checklists and turn on only the channels you trust."
        : "Finish setup checklists and enable master publish when ready.";

  return {
    score,
    grade,
    summary: summaryText,
    breakdown,
    channels,
    controls,
    secrets,
    canRunLocalJobs:
      process.env.MARKETING_RUNNER === "enabled" || process.env.NODE_ENV === "development",
    canTriggerGithub: secrets.GITHUB_TOKEN,
  };
}
