"use client";

import { useState } from "react";
import type { SocialDraft } from "@/lib/social-drafts";

type Props = {
  draft: SocialDraft;
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function SocialDraftViewer({ draft }: Props) {
  const [status, setStatus] = useState("");

  async function onCopy(label: string, text: string) {
    try {
      await copyText(text);
      setStatus(`Copied ${label}`);
    } catch {
      setStatus(`Could not copy ${label}`);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-400">
        From <span className="text-neutral-200">{draft.devtalkTitle}</span> · generated{" "}
        {new Date(draft.generatedAt).toLocaleString()}
      </p>

      {status ? (
        <p className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
          {status}
        </p>
      ) : null}

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Reddit post</h2>
          <button
            type="button"
            onClick={() =>
              onCopy(
                "Reddit post",
                `${draft.platforms.reddit.title}\n\n${draft.platforms.reddit.body}`,
              )
            }
            className="text-sm text-cyan-300 hover:underline"
          >
            Copy all
          </button>
        </div>
        <p className="mt-2 font-medium text-neutral-200">{draft.platforms.reddit.title}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
          {draft.platforms.reddit.body}
        </p>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="font-semibold">X / Twitter thread</h2>
        <ul className="mt-3 space-y-3">
          {draft.platforms.x.posts.map((post, i) => (
            <li key={i} className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
              <div className="flex justify-between gap-2">
                <span className="text-xs text-neutral-500">Post {i + 1}</span>
                <button
                  type="button"
                  onClick={() => onCopy(`post ${i + 1}`, post)}
                  className="text-xs text-cyan-300 hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">{post}</p>
            </li>
          ))}
        </ul>
      </section>

      {draft.platforms.discord ? (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Discord</h2>
            <button
              type="button"
              onClick={() =>
                onCopy(
                  "Discord",
                  draft.platforms.discord?.content ??
                    `${draft.platforms.discord?.embed?.title ?? ""}\n${draft.platforms.discord?.embed?.url ?? ""}`,
                )
              }
              className="text-sm text-cyan-300 hover:underline"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
            {draft.platforms.discord.content}
          </p>
          {draft.platforms.discord.embed?.url ? (
            <p className="mt-2 text-xs text-neutral-500">{draft.platforms.discord.embed.url}</p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Steam community post</h2>
          <button
            type="button"
            onClick={() =>
              onCopy(
                "Steam post",
                `${draft.platforms.steam.title}\n\n${draft.platforms.steam.body}`,
              )
            }
            className="text-sm text-cyan-300 hover:underline"
          >
            Copy all
          </button>
        </div>
        <p className="mt-2 font-medium text-neutral-200">{draft.platforms.steam.title}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
          {draft.platforms.steam.body}
        </p>
        <p className="mt-3 text-xs text-amber-200/90">
          No Steam write API — auto-publish sends this as a Discord reminder to paste into
          Steamworks Events.
        </p>
      </section>
    </div>
  );
}
