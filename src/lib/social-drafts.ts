import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export type SocialDraft = {
  slug: string;
  devtalkTitle: string;
  generatedAt: string;
  platforms: {
    reddit: { title: string; body: string };
    x: { posts: string[] };
    steam: { title: string; body: string };
  };
};

const DRAFTS_DIR = path.resolve(process.cwd(), "reports/social-drafts");

export async function getLatestSocialDraft(): Promise<SocialDraft | null> {
  let files: string[];
  try {
    files = (await readdir(DRAFTS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return null;
  }

  if (files.length === 0) return null;

  files.sort((a, b) => b.localeCompare(a));
  const latest = files[0];

  try {
    const raw = await readFile(path.join(DRAFTS_DIR, latest), "utf8");
    return JSON.parse(raw) as SocialDraft;
  } catch {
    return null;
  }
}

export async function listSocialDraftFiles(): Promise<string[]> {
  try {
    const files = await readdir(DRAFTS_DIR);
    return files.filter((f) => f.endsWith(".json")).sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}
