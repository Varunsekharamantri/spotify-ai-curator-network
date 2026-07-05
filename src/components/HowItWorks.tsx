"use client";

import { useState } from "react";
import { InfoIcon } from "./icons";

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[32px] items-center gap-1.5 whitespace-nowrap rounded-pill border border-ai-green/40 px-3 py-1 text-[11px] font-semibold text-ai-green"
      >
        <InfoIcon className="h-3.5 w-3.5" />
        How it works
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-64 rounded-lg border border-ai-border bg-ai-cardHover p-3 text-xs leading-relaxed text-ai-subtext shadow-xl">
          This isn&apos;t a song recommender — it&apos;s a people matcher. AI reads your real listening
          history and writes a natural-language &quot;taste DNA,&quot; then compares it to the taste DNA of
          real human curators to find whose taste can lead you somewhere new, not just repeat what you
          already play.
        </div>
      )}
    </div>
  );
}
