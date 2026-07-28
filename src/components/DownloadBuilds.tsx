import { downloadBuilds, downloadReleaseTag } from "@/lib/game-content";

type Props = {
  compact?: boolean;
};

export default function DownloadBuilds({ compact = false }: Props) {
  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div
        className={`flex flex-wrap gap-3 ${compact ? "justify-start" : "justify-center"}`}
      >
        {downloadBuilds.map((build) => (
          <a
            key={build.id}
            href={build.href}
            className="min-w-[9.5rem] rounded-md bg-cypress px-5 py-3 text-center text-sm font-semibold tracking-wide text-ink transition hover:bg-cypress-bright"
            download
          >
            {build.label}
          </a>
        ))}
      </div>
      {!compact ? (
        <ul className="mx-auto flex max-w-2xl flex-col gap-1 text-center text-sm text-stone-muted sm:flex-row sm:justify-center sm:gap-6">
          {downloadBuilds.map((build) => (
            <li key={`${build.id}-hint`}>
              <span className="font-medium text-stone">{build.label}:</span> {build.hint}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-1 text-sm text-stone-muted">
          {downloadBuilds.map((build) => (
            <li key={`${build.id}-hint`}>
              <span className="font-medium text-stone">{build.label}:</span> {build.hint}
            </li>
          ))}
        </ul>
      )}
      <p
        className={`text-xs text-stone-muted/80 ${compact ? "text-left" : "text-center"}`}
      >
        Pre-alpha build <span className="font-mono">{downloadReleaseTag}</span> — free download,
        expect bugs. Steam coming later.
      </p>
    </div>
  );
}
