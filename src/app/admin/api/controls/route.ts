import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  getMarketingControls,
  saveMarketingControls,
  type MarketingControls,
} from "@/lib/marketing-controls";
import { getPublishLedger, summarizePublishLedger } from "@/lib/publish-ledger";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const LEDGER_PATH = path.resolve(process.cwd(), "reports/publish-ledger.json");

async function clearHaltOnDisk() {
  try {
    const raw = JSON.parse(await readFile(LEDGER_PATH, "utf8"));
    raw.reddit = { ...(raw.reddit ?? {}), halted: false, haltReason: null };
    raw.updatedAt = new Date().toISOString();
    await mkdir(path.dirname(LEDGER_PATH), { recursive: true });
    await writeFile(LEDGER_PATH, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
    return raw;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [controls, ledger] = await Promise.all([getMarketingControls(), getPublishLedger()]);
  return NextResponse.json({
    controls,
    ledgerSummary: summarizePublishLedger(ledger),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    controls?: Partial<MarketingControls>;
    clearHalt?: boolean;
  };

  if (body.clearHalt) {
    await clearHaltOnDisk();
  }

  let controls = await getMarketingControls();
  if (body.controls) {
    controls = await saveMarketingControls(body.controls, "admin");
  }

  const ledger = await getPublishLedger();
  return NextResponse.json({
    ok: true,
    controls,
    ledgerSummary: summarizePublishLedger(ledger),
  });
}
