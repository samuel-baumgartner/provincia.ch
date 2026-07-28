import { spawn } from "node:child_process";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

function canRunLocalJobs(): boolean {
  return (
    process.env.MARKETING_RUNNER === "enabled" ||
    process.env.NODE_ENV === "development"
  );
}

function runScript(scriptPath: string): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stderr });
    });
  });
}

export async function POST() {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canRunLocalJobs()) {
    return NextResponse.json(
      {
        error:
          "Distribution only runs locally or with MARKETING_RUNNER=enabled. Run: pnpm devtalk:distribute",
      },
      { status: 503 },
    );
  }

  const scriptPath = path.resolve(process.cwd(), "scripts/devtalk-distribute.mjs");
  const { code, stderr } = await runScript(scriptPath);

  if (code !== 0) {
    return NextResponse.json(
      { error: stderr.trim() || "Distribute script failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Social drafts created in reports/social-drafts/",
  });
}
