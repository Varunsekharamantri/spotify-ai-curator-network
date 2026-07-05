"use client";

import { clearDeck } from "@/lib/deckCache";
import { RefreshIcon } from "./icons";

// Forces a fresh AI scan: clears the cached deck and reloads so the analysis
// animation replays and the matching engine runs live again.
export default function ScanAgainButton() {
  return (
    <button
      type="button"
      onClick={() => {
        clearDeck();
        window.location.reload();
      }}
      className="flex min-h-[32px] items-center gap-1.5 rounded-pill border border-ai-green/50 px-3 text-[11px] font-semibold text-ai-green active:scale-95"
    >
      <RefreshIcon className="h-3.5 w-3.5" />
      Scan again
    </button>
  );
}
