import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const SITE = process.env.GAME_URL?.replace(/\/$/, "") ?? "https://provincia.ch";
const DEV_TALKS_DIR = path.join(process.cwd(), "content", "devtalks");

/** Absolute-ize image/links for itch paste. */
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

/** HTML for itch’s visual/rich Devlog editor (paste as text/html). */
export function markdownToItchHtml(markdown: string): string {
  const md = markdownForItchPaste(markdown);
  const html = marked.parse(md, { async: false }) as string;
  return html.replace(/<img /g, '<img style="max-width:100%;height:auto;" ').trim();
}

/** @deprecated itch Devlogs do not render BBCode — kept for game-page description paste if needed. */
export function markdownToItchBbcode(markdown: string): string {
  let text = markdownForItchPaste(markdown);

  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code: string) => {
    return `[code]${code.trim()}[/code]`;
  });

  text = text.replace(/^######\s+(.+)$/gm, "[b]$1[/b]");
  text = text.replace(/^#####\s+(.+)$/gm, "[b]$1[/b]");
  text = text.replace(/^####\s+(.+)$/gm, "[b]$1[/b]");
  text = text.replace(/^###\s+(.+)$/gm, "[h3]$1[/h3]");
  text = text.replace(/^##\s+(.+)$/gm, "[h2]$1[/h2]");
  text = text.replace(/^#\s+(.+)$/gm, "[h1]$1[/h1]");

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, _alt, url) => {
    return `[img]${url}[/img]`;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label, url) => {
    return `[url=${url}]${label}[/url]`;
  });

  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "[b][i]$1[/i][/b]");
  text = text.replace(/\*\*(.+?)\*\*/g, "[b]$1[/b]");
  text = text.replace(/\*(.+?)\*/g, "[i]$1[/i]");
  text = text.replace(/__(.+?)__/g, "[b]$1[/b]");
  text = text.replace(/_(.+?)_/g, "[i]$1[/i]");
  text = text.replace(/`([^`]+)`/g, "[code]$1[/code]");

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
  /** Primary: paste into itch rich/visual editor (Clipboard text/html). */
  html: string;
  markdown: string;
  bbcode: string;
  imagePaths: string[];
};

export function resolveDevTalkCover(
  slug: string,
  coverImage?: string | null,
): {
  path: string | null;
  absoluteUrl: string | null;
  fileExists: boolean;
} {
  const rel = coverImage?.trim() || null;
  if (!rel) return { path: null, absoluteUrl: null, fileExists: false };
  const publicPath = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
  const absoluteUrl = rel.startsWith("http")
    ? rel
    : `${SITE}${rel.startsWith("/") ? "" : "/"}${rel}`;
  return {
    path: rel,
    absoluteUrl,
    fileExists: fs.existsSync(publicPath),
  };
}

function collectMdImagePaths(markdown: string): string[] {
  const out: string[] = [];
  const re = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown))) {
    const url = m[1];
    if (url.startsWith("/") && !out.includes(url)) out.push(url);
  }
  return out;
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
    cover.absoluteUrl && cover.fileExists ? `![${title}](${cover.absoluteUrl})\n\n` : "";
  const coverBb =
    cover.absoluteUrl && cover.fileExists ? `[img]${cover.absoluteUrl}[/img]\n\n` : "";

  const markdown =
    `${coverMd}# ${title}\n\n[Also on provincia.ch](${canonicalUrl})\n\n${bodyMd}`.trim();
  const bbcode = `${coverBb}[h1]${title}[/h1]\n[url=${canonicalUrl}]Also on provincia.ch[/url]\n\n${bodyBb}`;
  const html = `<div>${markdownToItchHtml(markdown)}</div>`;

  const imagePaths = [
    ...(cover.fileExists && cover.path ? [cover.path] : []),
    ...collectMdImagePaths(parsed.content),
  ].filter((p, i, arr) => arr.indexOf(p) === i);

  return {
    slug,
    title,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    canonicalUrl,
    coverImageUrl: cover.fileExists ? cover.absoluteUrl : null,
    coverImagePath: cover.fileExists ? cover.path : null,
    html,
    markdown,
    bbcode,
    imagePaths,
  };
}
