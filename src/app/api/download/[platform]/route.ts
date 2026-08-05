import { NextResponse } from "next/server";
import { getGithubDownloadUrl, normalizeSource, trackDownload } from "@/lib/download-stats";
import { downloadBuilds } from "@/lib/game-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ platform: string }> };

export async function GET(request: Request, { params }: Params) {
  const { platform } = await params;
  const allowed = downloadBuilds.some((b) => b.id === platform);
  const githubUrl = getGithubDownloadUrl(platform);

  if (!allowed || !githubUrl) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }

  const url = new URL(request.url);
  const src =
    normalizeSource(url.searchParams.get("src") ?? url.searchParams.get("utm_source")) ||
    "unknown";

  // Fire-and-forget count; never block the redirect on Redis errors.
  void trackDownload(platform, src);

  return NextResponse.redirect(githubUrl, 302);
}
