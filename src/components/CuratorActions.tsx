"use client";

import { useState } from "react";
import { PlusIcon, HeartIcon, CheckIcon } from "./icons";

// The Spotify Web API blocks playlist writes for restricted apps, so these are
// demo actions: they confirm intent and deep-link to Spotify to do it for real.
export default function CuratorActions({
  trackCount,
  spotifyUrl,
}: {
  trackCount: number;
  spotifyUrl: string | null;
}) {
  const [merged, setMerged] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMerged(true)}
          className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-pill bg-ai-green px-3 text-xs font-bold text-black active:scale-[0.98]"
        >
          {merged ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {merged ? "Added to your mix" : "Merge into my playlist"}
        </button>
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-pill border border-white/15 px-3 text-xs font-semibold text-ai-text active:scale-[0.98]"
        >
          <HeartIcon className="h-4 w-4" filled={saved} />
          {saved ? "Saved" : "Save songs"}
        </button>
      </div>

      {(merged || saved) && (
        <p className="mt-2 text-[11px] text-ai-green">
          {merged
            ? `${trackCount} songs queued to merge into your library.`
            : `${trackCount} songs saved.`}{" "}
          {spotifyUrl && (
            <a href={spotifyUrl} target="_blank" rel="noreferrer" className="underline">
              Open in Spotify to confirm
            </a>
          )}
        </p>
      )}
    </div>
  );
}
