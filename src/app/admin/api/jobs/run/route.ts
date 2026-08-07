import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

function canRunLocalJobs(): boolean {
  return (
    process.env.MARKETING_RUNNER === "enabled" || process.env.NODE_ENV === "development"
  );
}

function runPnpm(script: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["run", script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (c: Buffer) => {
      stdout += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

const LOCAL_SCRIPTS: Record<string, string> = {
  scan: "reddit:scan",
  engage: "reddit:engage",
  distribute: "devtalk:distribute",
  publish: "social:publish",
};

const GH_WORKFLOWS: Record<string, { workflow: string; inputs?: Record<string, string> }> = {
  publish: { workflow: "marketing-publish.yml", inputs: { mode: "publish" } },
  both: { workflow: "marketing-publish.yml", inputs: { mode: "both" } },
};

async function triggerGithub(job: string) {
  const token = process.env.CONTROLS_GITHUB_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("CONTROLS_GITHUB_TOKEN (or GITHUB_TOKEN) not set");

  const repo =
    process.env.GITHUB_REPOSITORY?.trim() ||
    process.env.CONTROLS_GITHUB_REPO?.trim() ||
    "samuel-baumgartner/provincia.ch";
  const ref = process.env.CONTROLS_GITHUB_REF?.trim() || "main";
  const cfg = GH_WORKFLOWS[job];
  if (!cfg) throw new Error(`Unknown github job: ${job}`);

  const url = `https://api.github.com/repos/${repo}/actions/workflows/${cfg.workflow}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref, inputs: cfg.inputs ?? {} }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub dispatch failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return { ok: true, repo, workflow: cfg.workflow, ref };
}

export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    job?: string;
    via?: "local" | "github";
  };
  const job = body.job ?? "";
  const via = body.via ?? "local";

  if (via === "github") {
    if (job === "scan" || job === "engage") {
      return NextResponse.json(
        {
          error:
            job === "scan"
              ? "Reddit scan is local only (marketing-scan.yml removed). Run: pnpm reddit:scan"
              : "Reddit engage is local/VPS only. Run: pnpm reddit:engage",
        },
        { status: 400 },
      );
    }
    try {
      const result = await triggerGithub(job === "distribute" ? "publish" : job);
      return NextResponse.json({ via: "github", ...result });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "GitHub trigger failed" },
        { status: 500 },
      );
    }
  }

  if (!canRunLocalJobs()) {
    return NextResponse.json(
      {
        error:
          "Local jobs only with MARKETING_RUNNER=enabled or NODE_ENV=development. Use via: github, or run pnpm on your machine.",
      },
      { status: 503 },
    );
  }

  const script = LOCAL_SCRIPTS[job];
  if (!script) {
    return NextResponse.json({ error: `Unknown job: ${job}` }, { status: 400 });
  }

  // Engage needs browser — fail clearly if asked without expecting long run
  if (job === "engage") {
    const { code, stdout, stderr } = await runPnpm(script);
    if (code !== 0) {
      return NextResponse.json(
        { error: stderr.trim() || stdout.trim() || "Engage failed", code },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, via: "local", job, output: stdout.slice(-2000) });
  }

  const { code, stdout, stderr } = await runPnpm(script);
  if (code !== 0) {
    return NextResponse.json(
      { error: stderr.trim() || stdout.trim() || `${script} failed`, code },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, via: "local", job, output: stdout.slice(-2000) });
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    localJobs: Object.keys(LOCAL_SCRIPTS),
    githubJobs: Object.keys(GH_WORKFLOWS),
    canRunLocal: canRunLocalJobs(),
    scriptsDir: path.resolve(process.cwd(), "scripts"),
  });
}
