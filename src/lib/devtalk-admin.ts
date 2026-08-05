import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DEV_TALKS_DIR = path.join(process.cwd(), "content", "devtalks");

export type DevTalkAdminItem = {
  slug: string;
  title: string;
  date: string;
  isDraft: boolean;
  isPublished: boolean;
  path: string;
  publicUrl: string | null;
  coverImage: string | null;
  coverExists: boolean;
};

export function getDevTalkAdminItems(): DevTalkAdminItem[] {
  if (!fs.existsSync(DEV_TALKS_DIR)) return [];

  return fs
    .readdirSync(DEV_TALKS_DIR)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const fullPath = path.join(DEV_TALKS_DIR, filename);
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = matter(raw);
      const data = parsed.data as {
        title?: string;
        date?: string;
        draft?: boolean;
        coverImage?: string;
      };
      const isDraft = data.draft === true;
      const isPublished = !isDraft;
      const coverImage =
        typeof data.coverImage === "string" && data.coverImage.trim()
          ? data.coverImage.trim()
          : null;
      const coverExists = coverImage
        ? fs.existsSync(path.join(process.cwd(), "public", coverImage.replace(/^\//, "")))
        : false;

      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "unknown",
        isDraft,
        isPublished,
        path: `content/devtalks/${filename}`,
        publicUrl: isPublished ? `/devtalk/${slug}` : null,
        coverImage,
        coverExists,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
