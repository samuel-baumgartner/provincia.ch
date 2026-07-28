import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

export type GuideMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
};

export type Guide = GuideMeta & {
  html: string;
};

function readMarkdownFiles(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .sort((a, b) => b.localeCompare(a));
}

function parseMeta(filename: string): GuideMeta | null {
  const slug = filename.replace(/\.md$/, "");
  const fullPath = path.join(GUIDES_DIR, filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Partial<GuideMeta>;

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    date: data.date ?? "1970-01-01",
  };
}

export function getAllGuideMeta(): GuideMeta[] {
  return readMarkdownFiles()
    .map((filename) => parseMeta(filename))
    .filter((item): item is GuideMeta => item !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const fullPath = path.join(GUIDES_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Partial<GuideMeta>;
  const html = await marked.parse(parsed.content);

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    date: data.date ?? "1970-01-01",
    html,
  };
}
