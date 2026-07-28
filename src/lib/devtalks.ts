import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const DEV_TALKS_DIR = path.join(process.cwd(), "content", "devtalks");

export type DevTalkMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  coverImage?: string;
};

export type DevTalk = DevTalkMeta & {
  html: string;
};

function readMarkdownFiles(): string[] {
  if (!fs.existsSync(DEV_TALKS_DIR)) return [];
  return fs
    .readdirSync(DEV_TALKS_DIR)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .sort((a, b) => b.localeCompare(a));
}

function parseMeta(filename: string): DevTalkMeta | null {
  const slug = filename.replace(/\.md$/, "");
  const fullPath = path.join(DEV_TALKS_DIR, filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Partial<DevTalkMeta> & { draft?: boolean };

  if (data.draft === true) return null;

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    date: data.date ?? "1970-01-01",
    author: data.author ?? "Unknown",
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverImage: typeof data.coverImage === "string" ? data.coverImage : undefined,
  };
}

export function getAllDevTalkMeta(): DevTalkMeta[] {
  return readMarkdownFiles()
    .map((filename) => parseMeta(filename))
    .filter((item): item is DevTalkMeta => item !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getDevTalkBySlug(slug: string): Promise<DevTalk | null> {
  const fullPath = path.join(DEV_TALKS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Partial<DevTalkMeta>;
  const html = await marked.parse(parsed.content);

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    date: data.date ?? "1970-01-01",
    author: data.author ?? "Unknown",
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverImage: typeof data.coverImage === "string" ? data.coverImage : undefined,
    html,
  };
}

