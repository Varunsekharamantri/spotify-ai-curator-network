// In-memory deck state, shared across client-side navigations within a tab.
// Lets the user leave the deck (open a curator, play a song) and come BACK
// without the "Analysis in progress" animation replaying or matches re-fetching.
// Cleared only on a full page reload (which is when a fresh analysis is wanted).

export const BATCH_SIZE = 4;

export type DeckMatchLike = {
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

type DeckState = {
  matches: DeckMatchLike[];
  source: string | null;
  index: number;
  unlocked: number;
  likedCount: number;
};

let state: DeckState | null = null;

export function getDeck(): DeckState | null {
  return state;
}

export function initDeck(matches: DeckMatchLike[], source: string | null, unlocked: number) {
  state = { matches, source, index: 0, unlocked, likedCount: 0 };
}

export function patchDeck(patch: Partial<Pick<DeckState, "index" | "unlocked" | "likedCount">>) {
  if (state) state = { ...state, ...patch };
}

export function clearDeck() {
  state = null;
}
