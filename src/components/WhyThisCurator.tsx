"use client";

import { useEffect, useState } from "react";
import Spinner from "./Spinner";

export default function WhyThisCurator({ curatorId, fallback }: { curatorId: string; fallback: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMessage(null);
    setSource(null);

    fetch(`/api/why?curatorId=${encodeURIComponent(curatorId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setMessage(data.message || fallback);
        setSource(data.source ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setMessage(fallback);
          setSource("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [curatorId, fallback]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ai-subtext">Why this curator?</p>
        {source === "live" && (
          <span className="flex items-center gap-1 rounded-pill bg-ai-green/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ai-green">
            <span className="h-1.5 w-1.5 rounded-full bg-ai-green" />
            Live by Groq
          </span>
        )}
      </div>

      {message === null ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-ai-subtext">
          <Spinner className="h-4 w-4 text-ai-green" />
          Comparing your taste DNA with theirs…
        </p>
      ) : (
        <p className="mt-1 text-sm leading-snug text-ai-text/90">{message}</p>
      )}
    </div>
  );
}
