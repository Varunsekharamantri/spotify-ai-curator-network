"use client";

import { useEffect, useState } from "react";
import AnalysisProgress from "./AnalysisProgress";
import SwipeDeck from "./SwipeDeck";
import HowItWorks from "./HowItWorks";
import { getDeck, initDeck, clearDeck, BATCH_SIZE } from "@/lib/deckCache";

const STEP_COUNT = 4;
const FETCH_TIMEOUT_MS = 20000;

type Match = {
  curatorId: string;
  matchPercent: number;
  reason: string;
  curator: {
    id: string;
    name: string;
    coverUrl: string | null;
    description: string;
    sampleTracks: { id: string; name: string; artists: string[]; imageUrl: string | null }[];
  };
};

export default function DiscoverFeed({ curatorGenres }: { curatorGenres: Record<string, string[]> }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Already analyzed this session (e.g. user is navigating BACK): reuse the
    // cached deck instantly — no re-fetch, no re-run of the analysis animation.
    const cached = getDeck();
    if (cached) {
      setMatches(cached.matches);
      setSource(cached.source);
      setStepIndex(STEP_COUNT);
      return;
    }

    setMatches(null);
    setError(null);
    setSource(null);
    setStepIndex(0);

    // Always play the full 4-step synthesis animation (~0.9s) before revealing,
    // so it shows whether the result came back live OR from the cache fallback.
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < STEP_COUNT ? i + 1 : i));
    }, 230);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch("/api/matches", { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const m = data.matches ?? [];
        setMatches(m);
        setSource(data.source ?? null);
        if (data.error) setError(data.error);
        if (m.length > 0) initDeck(m, data.source ?? null, BATCH_SIZE);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.name === "AbortError" ? "Request timed out" : err instanceof Error ? err.message : "Matching failed");
        setMatches([]);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [retryKey]);

  const stepsDone = stepIndex >= STEP_COUNT;

  if (matches === null || (!stepsDone && !error)) {
    return <AnalysisProgress stepIndex={stepIndex} />;
  }

  return (
    <section className="mt-6 px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold leading-snug">Top Curators for You</h2>
          <div className="mt-0.5 flex items-center gap-1.5">
            {source === "live" && (
              <span className="flex items-center gap-1 rounded-pill bg-ai-green/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ai-green">
                <span className="h-1.5 w-1.5 rounded-full bg-ai-green" />
                Generated live by Groq
              </span>
            )}
            {source === "cache-fallback" && (
              <span className="rounded-pill bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ai-subtext">
                Cached (Groq busy)
              </span>
            )}
            <p className="text-xs text-ai-subtext">Swipe to follow the ones who fit</p>
          </div>
        </div>
        <HowItWorks />
      </div>

      {matches.length === 0 ? (
        <div className="mt-3 rounded-lg bg-ai-card p-4 text-sm text-ai-subtext">
          <p>{error ? `Matching engine is unavailable right now (${error}).` : "No curators available yet."}</p>
          <button
            type="button"
            onClick={() => {
              clearDeck();
              setRetryKey((k) => k + 1);
            }}
            className="mt-3 min-h-[36px] rounded-pill border border-ai-green/40 px-3 py-1 text-xs font-semibold text-ai-green"
          >
            Retry
          </button>
        </div>
      ) : (
        <SwipeDeck matches={matches} genres={curatorGenres} />
      )}
    </section>
  );
}
