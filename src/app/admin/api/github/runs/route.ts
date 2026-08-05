import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.CONTROLS_GITHUB_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({
      ok: true,
      runs: [],
      note: "Set CONTROLS_GITHUB_TOKEN to list workflow runs",
    });
  }

  const repo =
    process.env.GITHUB_REPOSITORY?.trim() ||
    process.env.CONTROLS_GITHUB_REPO?.trim() ||
    "samuel-baumgartner/provincia.ch";

  const url = `https://api.github.com/repos/${repo}/actions/runs?per_page=8`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `GitHub runs failed (${res.status}): ${text.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const json = (await res.json()) as {
    workflow_runs?: Array<{
      id: number;
      name: string;
      status: string;
      conclusion: string | null;
      html_url: string;
      created_at: string;
      display_title?: string;
    }>;
  };

  const runs = (json.workflow_runs ?? [])
    .filter((r) => /marketing/i.test(r.name) || /marketing/i.test(r.display_title ?? ""))
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      url: r.html_url,
      createdAt: r.created_at,
    }));

  return NextResponse.json({ ok: true, runs, repo });
}
