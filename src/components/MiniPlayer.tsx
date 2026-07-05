"use client";

import Image from "next/image";
import { usePlayer } from "@/lib/PlayerContext";

export default function MiniPlayer() {
  const { track, curatorName, coverUrl, isPlaying, togglePlay, expand } = usePlayer();

  if (!track) return null;

  return (
    <button
      type="button"
      onClick={expand}
      className="flex w-full items-center gap-3 border-t border-white/10 bg-ai-cardHover px-3 py-2 text-left"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-ai-card">
        {coverUrl && <Image src={coverUrl} alt={track.name} fill className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{track.name}</p>
        <p className="truncate text-xs text-ai-subtext">
          {track.artists.join(", ")} {curatorName ? `· ${curatorName}` : ""}
        </p>
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            togglePlay();
          }
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ai-text"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </span>
    </button>
  );
}
