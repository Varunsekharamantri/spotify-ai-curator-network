"use client";

import { useState } from "react";
import { usePlayer, type PlayerTrack } from "@/lib/PlayerContext";
import { PlusIcon, CheckIcon, PlayIcon, PauseIcon } from "./icons";

type Props = {
  track: PlayerTrack;
  queue: PlayerTrack[];
  curatorName: string;
  coverUrl: string | null;
};

export default function TrackRow({ track, queue, curatorName, coverUrl }: Props) {
  const { play, track: current, isPlaying } = usePlayer();
  const isActive = current?.id === track.id;
  const [added, setAdded] = useState(false);

  return (
    <div className="flex min-h-[48px] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5">
      <button
        type="button"
        onClick={() => play(track, { curatorName, coverUrl, queue })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`Play ${track.name}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isActive ? "bg-ai-green text-black" : "bg-black/30 text-ai-text"
          }`}
        >
          {isActive && isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${isActive ? "font-semibold text-ai-green" : "font-medium"}`}>
            {track.name}
          </p>
          <p className="truncate text-xs text-ai-subtext">{track.artists.join(", ")}</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => setAdded((a) => !a)}
        aria-label={added ? "Added to playlist" : "Add to playlist"}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
          added ? "border-ai-green bg-ai-green text-black" : "border-white/25 text-ai-subtext hover:text-ai-text"
        }`}
      >
        {added ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
