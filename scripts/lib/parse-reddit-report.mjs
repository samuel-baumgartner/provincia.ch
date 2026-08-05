import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_PATH = path.resolve(process.cwd(), "reports/reddit-opportunities.md");

export function parseRedditReport(filePath = DEFAULT_PATH) {
  if (!existsSync(filePath)) {
    return { generatedAt: null, opportunities: [] };
  }

  const content = readFileSync(filePath, "utf8");
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
      const suggestedComment = extractSuggestedComment(block);

      if (!link) return null;

      return {
        subreddit,
        title,
        link,
        score: scoreRaw ? Number(scoreRaw) : null,
        suggestedComment,
      };
    })
    .filter(Boolean);

  return { generatedAt, opportunities };
}

/** Collect the suggested-comment body until the next opportunity heading. */
function extractSuggestedComment(block) {
  const lines = block.split("\n");
  const start = lines.findIndex((l) => /^- Suggested comment:/i.test(l.trim()));
  if (start === -1) {
    return block.match(/^>\s?(.*)$/m)?.[1]?.trim() ?? "";
  }

  const parts = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^###\s+/.test(line)) break;
    if (/^- (Link|Opportunity score|Post activity|Why this|Matching|Suggested comment):/i.test(line)) break;
    if (line.startsWith(">")) {
      parts.push(line.replace(/^>\s?/, ""));
      continue;
    }
    // Legacy reports: continuation paragraphs after the first `>` line lack `>`
    if (parts.length === 0 && line.trim() === "") continue;
    parts.push(line);
  }

  return parts.join("\n").replace(/\n+$/, "").trim();
}
