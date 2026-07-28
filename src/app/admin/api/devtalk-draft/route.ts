import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function fallbackDraft(title: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `---
title: "${title}"
excerpt: "Draft devtalk generated from a Reddit opportunity."
date: "${today}"
author: "Provincia Dev Team"
draft: true
tags:
  - reddit
  - devtalk
---

This is a starter draft.

## Why this topic matters

Summarize the thread context and why this is relevant to Provincia.

## What we are doing in Provincia

Explain your concrete approach, constraints, and trade-offs.

## Practical takeaways

- One clear principle
- One implementation detail
- One thing still being tested
`;
}

function ensureDraftFlag(content: string) {
  if (/^draft:\s*true/m.test(content)) return content;
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      const fm = content.slice(0, end + 3);
      const rest = content.slice(end + 3);
      return fm.replace(/^---\n/, "---\ndraft: true\n") + rest;
    }
  }
  return content;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const reason = String(body?.reason ?? "").trim();
  const suggestedComment = String(body?.suggestedComment ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  let content = fallbackDraft(title);
  if (OPENAI_API_KEY) {
    const prompt = [
      "Create a markdown devtalk draft with valid frontmatter.",
      "Include draft: true in frontmatter.",
      "Tone: practical, concrete, no fluff.",
      "Length: 350-600 words.",
      "Use this as context:",
      `Title/topic: ${title}`,
      `Reason: ${reason}`,
      `Existing reply draft: ${suggestedComment}`,
    ].join("\n");

    try {
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.45,
          max_tokens: 1600,
          messages: [
            {
              role: "system",
              content:
                "You write markdown drafts for indie game DevTalk posts. Always output YAML frontmatter first (--- blocks) with draft: true, then the article body.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (aiRes.ok) {
        const json = await aiRes.json();
        const message = json?.choices?.[0]?.message?.content;
        const text =
          typeof message === "string"
            ? message.trim()
            : Array.isArray(message)
              ? message.map((part: unknown) =>
                  typeof part === "object" && part !== null && "text" in part
                    ? String((part as { text?: string }).text ?? "")
                    : "",
                ).join("")
              : "";
        if (text.startsWith("---")) content = ensureDraftFlag(text);
      }
    } catch {
      // Keep fallback content.
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const slug = `${today}-${slugify(title) || "devtalk-draft"}`;
  const draftsDir = path.resolve(process.cwd(), "content/devtalks");
  const filePath = path.join(draftsDir, `${slug}.md`);
  await mkdir(draftsDir, { recursive: true });
  await writeFile(filePath, content, "utf8");

  return NextResponse.json({ ok: true, slug, path: `content/devtalks/${slug}.md` });
}
