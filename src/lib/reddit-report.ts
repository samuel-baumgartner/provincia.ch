import { readFile } from "node:fs/promises";
import path from "node:path";

export type RedditOpportunity = {
  id: string;
  subreddit: string;
  title: string;
  link: string;
  score: number | null;
  activity: string;
  reason: string;
  devtalkLink: string | null;
  suggestedComment: string;
};

const REPORT_PATH = path.resolve(process.cwd(), "reports/reddit-opportunities.md");

export type RedditReport = {
  generatedAt: string | null;
  opportunities: RedditOpportunity[];
};

export async function getRedditReport(): Promise<RedditReport> {
  let content = "";

  try {
    content = await readFile(REPORT_PATH, "utf8");
  } catch {
    return { generatedAt: null, opportunities: [] };
  }

  const generatedMatch = content.match(/^Generated:\s+(.+)$/m);
  const generatedAt = generatedMatch?.[1]?.trim() ?? null;

  const blocks = content.split("\n### ").slice(1);

  const opportunities = blocks
    .map((rawBlock) => {
      const block = `### ${rawBlock}`;
      const lines = block.split("\n");
      const heading = lines[0] ?? "";
      const headingMatch = heading.match(/^###\s+\d+\.\s+\[r\/([^\]]+)\]\s+(.+)$/);

      if (!headingMatch) return null;

      const subreddit = headingMatch[1].trim();
      const title = headingMatch[2].trim();
      const link = block.match(/^- Link:\s+(.+)$/m)?.[1]?.trim() ?? "";
      const scoreRaw = block.match(/^- Opportunity score:\s+(\d+)/m)?.[1];
      const activity = block.match(/^- Post activity:\s+(.+)$/m)?.[1]?.trim() ?? "n/a";
      const reason = block.match(/^- Why this is promising:\s+(.+)$/m)?.[1]?.trim() ?? "n/a";
      const devtalkMatch = block.match(/^- Matching devtalk:\s+(.+)$/m)?.[1]?.trim() ?? "none";
      const suggestedComment = block.match(/>\s+(.+)/m)?.[1]?.trim() ?? "";

      if (!link) return null;

      return {
        id: `${subreddit}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        subreddit,
        title,
        link,
        score: scoreRaw ? Number(scoreRaw) : null,
        activity,
        reason,
        devtalkLink: devtalkMatch === "none" ? null : devtalkMatch,
        suggestedComment,
      } satisfies RedditOpportunity;
    })
    .filter((item): item is RedditOpportunity => item !== null);

  return { generatedAt, opportunities };
}

export async function getRedditOpportunities(): Promise<RedditOpportunity[]> {
  return (await getRedditReport()).opportunities;
}
