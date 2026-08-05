"use client";

import { useState } from "react";

type Props = {
  slug: string;
  coverPath?: string | null;
};

async function copyImageBitmap(blob: Blob, urlText: string) {
  const type = blob.type || "image/png";
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [type]: blob,
          "text/plain": new Blob([urlText], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // Some browsers reject image+text together — try image-only
      try {
        await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
        return;
      } catch {
        /* fall through */
      }
    }
  }
  await navigator.clipboard.writeText(urlText);
}

export default function CopyCoverButton({ slug, coverPath }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function copyAndDownload() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/admin/api/itch/cover?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No cover");

      const absoluteUrl: string = json.coverImageUrl;
      const path: string = json.coverImagePath || coverPath || "";

      const fileRes = await fetch(path.startsWith("http") ? path : path);
      if (!fileRes.ok) throw new Error("Could not load cover file");
      const blob = await fileRes.blob();

      await copyImageBitmap(blob, absoluteUrl);

      const ext = path.split(".").pop()?.split("?")[0] || "png";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${slug}-cover.${ext}`;
      a.click();
      URL.revokeObjectURL(objectUrl);

      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyAndDownload}
        disabled={state === "loading" || coverPath === null}
        title={
          coverPath === null
            ? "Missing coverImage"
            : "Copy image to clipboard + download the file"
        }
        className="rounded border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === "done" ? "Image copied + downloaded" : "Copy cover image"}
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
