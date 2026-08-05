import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SITE = process.env.GAME_URL?.replace(/\/$/, "") ?? "https://provincia.ch";
const DEV_TALKS_DIR = path.join(process.cwd(), "content", "devtalks");

/** Convert DevTalk markdown body to itch.io BBCode. */
export function markdownToItchBbcode(markdown: string): string {
  let text = markdown.replace(/\r\n/g, "\n").trim();

  // Fenced code blocks
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code: string) => {
    return `[code]${code.trim()}[/code]`;
  });

  // Headings
  text = text.replace(/^######\s+(.+)$/gm, "[b]$1[/b]");
  text = text.replace(/^#####\s+(.+)$/gm, "[b]$1[/b]");
  text = text.replace(/^####\s+(.+)$/gm, "[b]$1[/b]");
  text = text.replace(/^###\s+(.+)$/gm, "[h3]$1[/h3]");
  text = text.replace(/^##\s+(.+)$/gm, "[h2]$1[/h2]");
  text = text.replace(/^#\s+(.+)$/gm, "[h1]$1[/h1]");

  // Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, _alt, url) => {
    const abs = url.startsWith("http") ? url : `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
    return `[img]${abs}[/img]`;
  });

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label, url) => {
    const abs = url.startsWith("http") ? url : `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
    return `[url=${abs}]${label}[/url]`;
  });

  // Bold / italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "[b][i]$1[/i][/b]");
  text = text.replace(/\*\*(.+?)\*\*/g, "[b]$1[/b]");
  text = text.replace(/\*(.+?)\*/g, "[i]$1[/i]");
  text = text.replace(/__(.+?)__/g, "[b]$1[/b]");
  text = text.replace(/_(.+?)_/g, "[i]$1[/i]");
  text = text.replace(/`([^`]+)`/g, "[code]$1[/code]");

  // Unordered lists
  text = text.replace(/((?:^[-*]\s+.+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => line.replace(/^[-*]\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `[*]${item}`)
      .join("\n");
    return `[list]\n${items}\n[/list]\n`;
  });

  // Ordered lists (simple)
  text = text.replace(/((?:^\d+\.\s+.+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `[*]${item}`)
      .join("\n");
    return `[list=1]\n${items}\n[/list]\n`;
  });

  return text.trim();
}

export type ItchDevlogPayload = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  canonicalUrl: string;
  bbcode: string;
};

export function getDevTalkItchBbcode(slug: string): ItchDevlogPayload | null {
  const fullPath = path.join(DEV_TALKS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as {
    title?: string;
    excerpt?: string;
    date?: string;
    draft?: boolean;
  };
  const title = data.title ?? slug;
  const canonicalUrl = `${SITE}/devtalk/${slug}`;
  const body = markdownToItchBbcode(parsed.content);
  const header = `[h1]${title}[/h1]\n[url=${canonicalUrl}]Also on provincia.ch[/url]\n\n`;
  return {
    slug,
    title,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    canonicalUrl,
    bbcode: `${header}${body}`,
  };
}
