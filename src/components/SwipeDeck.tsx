"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CloseIcon, CheckIcon, PlayIcon } from "./icons";
import { getDeck, patchDeck, BATCH_SIZE } from "@/lib/deckCache";

export type DeckCurator = {
  id: string;
  name: string;
  coverUrl: string | null;
  description: string;
  sampleTracks: { id: string; name: string; artists: string[]; imageUrl: string | null }[];
};

export type DeckMatch = {
  curatorId: string;
  matchPercent: number;
  reason: string;
  curator: DeckCurator;
};

const SWIPE_THRESHOLD = 90;
const TAP_THRESHOLD = 8;

export default function SwipeDeck({
  matches,
  genres,
}: {
  matches: DeckMatch[];
  genres: Record<string, string[]>;
}) {
  const router = useRouter();
  // Resume swipe position from the shared deck cache (so navigating away and
  // back doesn't reset you to the first card).
  const saved = getDeck();
  const [index, setIndex] = useState(saved?.index ?? 0);
  const [unlocked, setUnlocked] = useState(saved?.unlocked ?? BATCH_SIZE);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [flyOut, setFlyOut] = useState<null | "left" | "right">(null);
  const [likedCount, setLikedCount] = useState(saved?.likedCount ?? 0);
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  // Persist position so a return visit resumes exactly here.
  useEffect(() => {
    patchDeck({ index, unlocked, likedCount });
  }, [index, unlocked, likedCount]);

  const current = matches[index];
  // Only peek the next card if it's within the currently-unlocked batch.
  const next = index + 1 < unlocked ? matches[index + 1] : undefined;

  const finished = index >= matches.length;
  const atBatchGate = !finished && index >= unlocked;

  function recordFeedback(curatorId: string, action: "followed" | "not_my_taste") {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curatorId, action }),
    }).catch(() => {});
  }

  function commitSwipe(direction: "left" | "right") {
    if (!current || flyOut) return;
    recordFeedback(current.curatorId, direction === "right" ? "followed" : "not_my_taste");
    if (direction === "right") setLikedCount((c) => c + 1);
    setFlyOut(direction);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setDrag({ x: 0, y: 0 });
      setFlyOut(null);
    }, 260);
  }

  function openCurator(m: DeckMatch) {
    router.push(
      `/curator/${m.curatorId}?match=${Math.round(m.matchPercent)}&reason=${encodeURIComponent(m.reason)}`,
    );
  }

  function onPointerDown(e: React.PointerEvent) {
    if (flyOut) return;
    dragging.current = true;
    start.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (dx > SWIPE_THRESHOLD) return commitSwipe("right");
    if (dx < -SWIPE_THRESHOLD) return commitSwipe("left");

    // Barely moved → it's a tap: open this curator's playlist.
    if (Math.hypot(dx, dy) < TAP_THRESHOLD && current) openCurator(current);
    setDrag({ x: 0, y: 0 });
  }

  // Reached the end of the current batch, but lower-ranked curators remain.
  if (atBatchGate) {
    const remaining = matches.length - unlocked;
    const nextTop = matches[unlocked];
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-ai-card px-6 py-9 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ai-green/15 text-ai-green">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold">You&apos;re done with your top curators</h3>
        <p className="text-sm text-ai-subtext">
          Want to see the next best set? These are still strong matches, just a bit further from your
          core taste{nextTop ? ` (down to ~${Math.round(nextTop.matchPercent)}% match)` : ""}.
        </p>
        <button
          type="button"
          onClick={() => setUnlocked((u) => Math.min(u + BATCH_SIZE, matches.length))}
          className="mt-1 min-h-[44px] rounded-pill bg-ai-green px-5 text-sm font-bold text-black"
        >
          Show next {Math.min(BATCH_SIZE, remaining)} curators
        </button>
      </div>
    );
  }

  // No curators left at all.
  if (finished) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-ai-card px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ai-green/15 text-ai-green">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold">You&apos;re all caught up</h3>
        <p className="text-sm text-ai-subtext">
          You followed {likedCount} curator{likedCount === 1 ? "" : "s"} today. The AI will use your
          picks to sharpen tomorrow&apos;s matches.
        </p>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setUnlocked(BATCH_SIZE);
            setLikedCount(0);
          }}
          className="mt-1 min-h-[44px] rounded-pill bg-ai-green px-5 text-sm font-bold text-black"
        >
          Start over
        </button>
      </div>
    );
  }

  const rotate = drag.x * 0.05;
  const flyTransform =
    flyOut === "right"
      ? "translateX(140%) rotate(18deg)"
      : flyOut === "left"
        ? "translateX(-140%) rotate(-18deg)"
        : `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`;
  const likeOpacity = Math.min(1, Math.max(0, drag.x / SWIPE_THRESHOLD));
  const nopeOpacity = Math.min(1, Math.max(0, -drag.x / SWIPE_THRESHOLD));

  return (
    <div className="mt-4">
      <div className="relative h-[420px] w-full select-none">
        {next && (
          <DeckCard
            match={next}
            genres={genres[next.curatorId] ?? []}
            style={{ transform: "scale(0.94) translateY(10px)", opacity: 0.6 }}
          />
        )}

        <DeckCard
          match={current}
          genres={genres[current.curatorId] ?? []}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: flyTransform,
            transition: dragging.current ? "none" : "transform 0.26s ease-out",
            cursor: "grab",
          }}
          likeOpacity={likeOpacity}
          nopeOpacity={nopeOpacity}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => commitSwipe("left")}
            aria-label="Next match"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-ai-card text-ai-subtext active:scale-95"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          <span className="text-[10px] text-ai-subtext">Next</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => current && openCurator(current)}
            aria-label="Open playlist"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ai-green text-black shadow-[0_6px_20px_rgba(29,185,84,0.4)] active:scale-95"
          >
            <PlayIcon className="h-7 w-7" />
          </button>
          <span className="text-[10px] text-ai-subtext">Open playlist</span>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ai-subtext">
        Swipe right to follow · tap a card to open its playlist
      </p>
    </div>
  );
}

function DeckCard({
  match,
  genres,
  style,
  likeOpacity = 0,
  nopeOpacity = 0,
  ...handlers
}: {
  match: DeckMatch;
  genres: string[];
  style?: React.CSSProperties;
  likeOpacity?: number;
  nopeOpacity?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { curator, matchPercent, reason } = match;
  return (
    <div
      {...handlers}
      style={style}
      className="absolute inset-0 flex touch-none flex-col overflow-hidden rounded-2xl border border-ai-border bg-ai-card"
    >
      <div className="relative h-44 w-full shrink-0 bg-ai-cardHover">
        {curator.coverUrl && (
          <Image src={curator.coverUrl} alt={curator.name} fill className="object-cover" draggable={false} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ai-card via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-pill bg-black/70 px-2.5 py-1 text-xs font-bold text-ai-green">
          {Math.round(matchPercent)}% match
        </span>

        <span
          style={{ opacity: likeOpacity }}
          className="absolute right-3 top-3 rotate-12 rounded-lg border-2 border-ai-green px-2 py-0.5 text-sm font-extrabold uppercase text-ai-green"
        >
          Follow
        </span>
        <span
          style={{ opacity: nopeOpacity }}
          className="absolute left-3 top-12 -rotate-12 rounded-lg border-2 border-red-400 px-2 py-0.5 text-sm font-extrabold uppercase text-red-400"
        >
          Pass
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-2">
        <h3 className="flex items-center gap-1 text-base font-bold leading-tight">
          <span className="truncate">{curator.name}</span>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ai-green">
            <CheckIcon className="h-3 w-3 fill-black" />
          </span>
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-ai-subtext">{genres.slice(0, 3).join(" · ")}</p>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ai-text/85">{reason}</p>

        <div className="mt-auto flex items-center gap-2 pt-3">
          {curator.sampleTracks.slice(0, 4).map((t) => (
            <div key={t.id} className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-ai-cardHover">
              {t.imageUrl && <Image src={t.imageUrl} alt={t.name} fill className="object-cover" draggable={false} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
