"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/lib/PlayerContext";
import { ChevronDownIcon, HomeIcon } from "./icons";

export default function NowPlayingSheet() {
  const router = useRouter();
  const { track, curatorName, coverUrl, isPlaying, isExpanded, togglePlay, minimize, skip } = usePlayer();

  if (!track || !isExpanded) return null;

  function goHome() {
    minimize();
    router.push("/");
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-ai-cardHover to-ai-bg px-6 pb-8 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={minimize}
          aria-label="Minimize"
          className="flex h-9 w-9 items-center justify-center text-ai-text"
        >
          <ChevronDownIcon className="h-6 w-6" />
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ai-subtext">
          {curatorName ? `From ${curatorName}` : "Now playing"}
        </span>
        <button
          type="button"
          onClick={goHome}
          aria-label="Back to home"
          className="flex h-9 w-9 items-center justify-center text-ai-text"
        >
          <HomeIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-ai-card shadow-2xl">
        {coverUrl && <Image src={coverUrl} alt={track.name} fill className="object-cover" />}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold leading-tight">{track.name}</h2>
        <p className="mt-1 text-sm text-ai-subtext">
          {track.artists.join(", ")} {curatorName ? `· from ${curatorName}` : ""}
        </p>
      </div>

      <div className="mt-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-ai-text"
            style={{
              animation: "now-playing-progress 30s linear infinite",
              animationPlayState: isPlaying ? "running" : "paused",
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => skip(-1)}
          aria-label="Previous"
          className="text-ai-text"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-ai-text text-ai-bg"
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button type="button" onClick={() => skip(1)} aria-label="Next" className="text-ai-text">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">
            <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={minimize}
        className="mt-auto flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pill border border-white/20 px-4 text-sm font-semibold text-ai-text"
      >
        <ChevronDownIcon className="h-5 w-5" />
        Back
      </button>
    </div>
  );
}
