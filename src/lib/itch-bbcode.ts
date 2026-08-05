import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SITE = process.env.GAME_URL?.replace(/\/$/, "") ?? "https://provincia.ch";
const DEV_TALKS_DIR = path.join(process.cwd(), "content", "devtalks");

/** Absolute-ize image/links for itch paste (Devlogs use Markdown, not BBCode). */
export function markdownForItchPaste(markdown: string): string {
  let text = markdown.replace(/\r\n/g, "\n").trim();

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, alt, url) => {
    const abs = url.startsWith("http") ? url : `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
    return `![${alt}](${abs})`;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label, url) => {
    if (url.startsWith("http") || url.startsWith("#") || url.startsWith("mailto:")) {
      return `[${label}](${url})`;
    }
    const abs = `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
    return `[${label}](${abs})`;
  });

  return text.trim();
}

/** @deprecated itch Devlogs do not render BBCode — kept for game-page description paste if needed. */
export function markdownToItchBbcode(markdown: string): string {
  let text = markdownForItchPaste(markdown);

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
    return `[img]${url}[/img]`;
  });

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label, url) => {
    return `[url=${url}]${label}[/url]`;
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
  coverImageUrl: string | null;
  coverImagePath: string | null;
  /** Primary paste format for itch Devlogs. */
  markdown: string;
  /** Legacy: game page description only — Devlogs show these tags as plain text. */
  bbcode: string;
};

export function resolveDevTalkCover(slug: string, coverImage?: string | null): {
  path: string | null;
  absoluteUrl: string | null;
  fileExists: boolean;
} {
  const rel = coverImage?.trim() || null;
  if (!rel) return { path: null, absoluteUrl: null, fileExists: false };
  const publicPath = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
  const absoluteUrl = rel.startsWith("http") ? rel : `${SITE}${rel.startsWith("/") ? "" : "/"}${rel}`;
  return {
    path: rel,
    absoluteUrl,
    fileExists: fs.existsSync(publicPath),
  };
}

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
    coverImage?: string;
  };
  const title = data.title ?? slug;
  const canonicalUrl = `${SITE}/devtalk/${slug}`;
  const cover = resolveDevTalkCover(slug, data.coverImage);
  const bodyMd = markdownForItchPaste(parsed.content);
  const bodyBb = markdownToItchBbcode(parsed.content);

  const coverMd =
    cover.absoluteUrl && cover.fileExists
      ? `![${title}](${cover.absoluteUrl})\n\n`
      : "";
  const coverBb =
    cover.absoluteUrl && cover.fileExists ? `[img]${cover.absoluteUrl}[/img]\n\n` : "";

  const markdown = `${coverMd}# ${title}\n\n[Also on provincia.ch](${canonicalUrl})\n\n${bodyMd}`.trim();
  const bbcode = `${coverBb}[h1]${title}[/h1]\n[url=${canonicalUrl}]Also on provincia.ch[/url]\n\n${bodyBb}`;

  return {
    slug,
    title,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    canonicalUrl,
    coverImageUrl: cover.fileExists ? cover.absoluteUrl : null,
    coverImagePath: cover.fileExists ? cover.path : null,
    markdown,
    bbcode,
  };
}
