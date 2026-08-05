import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getDevTalkItchBbcode } from "@/lib/itch-bbcode";

export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const slug = new URL(req.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const payload = getDevTalkItchBbcode(slug);
  if (!payload) {
    return NextResponse.json({ error: "DevTalk not found" }, { status: 404 });
  }
  if (!payload.coverImageUrl || !payload.coverImagePath) {
    return NextResponse.json(
      { error: "No coverImage frontmatter or file missing under public/" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    slug: payload.slug,
    title: payload.title,
    coverImageUrl: payload.coverImageUrl,
    coverImagePath: payload.coverImagePath,
  });
}
