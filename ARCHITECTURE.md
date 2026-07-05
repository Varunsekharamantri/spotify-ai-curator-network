# Spotify AI Curator Network — Phase-Wise Development Architecture

> **For Claude Code.** Sequential build spec. Each phase has a goal, tasks, files, and acceptance criteria. Build in order; don't start a phase until the previous one passes its acceptance criteria.

> **What you have to work with:** Spotify Web API (via your Premium account, dev-time only) + Groq free-tier LLM. This architecture is designed around those two constraints — nothing else is assumed.

---

## Product in one line

The user logs in → AI reads their taste → AI matches them to the **human curators** whose taste fits (or leads) theirs → user discovers music through trusted human curators, each with an AI-generated reason. **AI is the intelligence layer connecting listener to the right human, not another song-recommender.**

---

## Design decisions (improvements over the raw spec — read first)

1. **Live API at dev-time, static data at demo-time.** OAuth + Web API are used *once during development* to pull real listening data + real playlists. That data is **baked into static JSON** for the demo. The deployed prototype does **not** require the viewer to log in — no OAuth on stage, nothing to break. (Your Premium is the *kitchen*, not the *plate*.)
2. **No vector DB for the MVP.** With ~40 curators, skip ChromaDB/FAISS. Either (a) let Groq rank all curators in one prompt, or (b) do in-memory cosine similarity on lightweight embeddings. Less infra, free-tier-friendly.
3. **Groq calls are generated once and cached.** Taste DNA (user + curators) is computed once and stored as JSON. The demo reads cached DNA — you never hit rate limits live. Only the *final ranking/explanation* may run live (small, cheap, one call).
4. **Curators framed as "ahead of you," not just "like you."** To avoid looking like Spotify's "For You" (which is same-cluster collaborative filtering), the match reason emphasizes *where the curator can take you*, not just similarity. (See Phase 4.)
5. **Feedback is stored, not learned online.** 👍/👎/❤️ is saved to JSON and folded into the next ranking prompt. No ML training loop needed.

---

## Global setup (before Phase 1)

**Stack (kept minimal for free-tier + Premium-only):**
- Frontend: **Next.js** (React) + Tailwind.
- Backend: **Next.js API routes** (no separate server needed for MVP) — or a thin FastAPI if you prefer Python for Groq calls.
- Data store: **JSON files** for the demo (SQLite optional for dev-time ingestion).
- AI: **Groq** (free tier) — `llama-3.1-8b-instant` for cheap/fast tasks, a larger Groq model only for final ranking.
- Spotify: **Web API + OAuth**, dev-time only.

**Secrets:** `.env` holds `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `GROQ_API_KEY`. Never commit. Never ship to the client.

**Structure:**
```
/scripts        ingest-spotify.js, build-taste-dna.js   (dev-time, run once)
/data           user_profile.json, curators.json, taste_dna.json, feedback.json
/src
  /app          Next.js routes
  /components   CuratorCard, TasteDNAPanel, MatchBadge, FeedbackBar, Explanation
  /lib          groq.js, match.js, data.js
/.env
```

**Acceptance:** app boots, Tailwind + Spotify-dark theme applied, `.env` loads keys server-side only.

---

## PHASE 1 — Spotify Ingestion (dev-time, real data)

**Goal:** Pull the developer's real listening data + a real curator set, once, into static JSON.

**Tasks:**
1. `/scripts/ingest-spotify.js` — OAuth (Authorization Code flow, run locally once) to fetch: Top Artists, Top Tracks, Recently Played, Saved Tracks. Write to `/data/user_profile.json`.
2. Select **30–50 real Spotify playlists** to serve as curators (editorial + notable user playlists). For each, fetch: playlist ID, name, description, top artists, genres, ~10 representative tracks, cover image URL. Write to `/data/curators.json`.
3. **This script runs once at dev time.** The app never calls Spotify live.

**Free-tier / Premium notes:**
- Metadata + playlist fetch needs only Client ID/Secret (free API tier) for public playlists; user listening history needs your one-time user OAuth (Premium account works fine).
- If audio-features/preview endpoints are restricted for a new app, skip them — you don't need them for curator matching.

**Acceptance:** `user_profile.json` has real top artists/tracks; `curators.json` has 30+ real playlists with metadata + cover art. Zero runtime Spotify calls thereafter.

---

## PHASE 2 — Curator Knowledge Base

**Goal:** Turn raw playlist data into a clean, queryable curator dataset.

**Tasks:**
1. Normalize `curators.json`: each curator = `{ id, name, description, coverUrl, topArtists[], genres[], sampleTracks[] }`.
2. Give each curator a display persona (name is the playlist name; e.g. "Midnight Vinyl").
3. Validate: every curator has ≥5 sample tracks and ≥3 genres (drop thin ones).

**Acceptance:** 30+ clean curators, each demo-ready with cover art and a track sample.

---

## PHASE 3 — AI Taste Modeling (Groq, cached)

**Goal:** Generate natural-language "Taste DNA" for the user and every curator — once — and cache it.

**Tasks:**
1. `/scripts/build-taste-dna.js`:
   - **User Taste DNA:** send `user_profile.json` to Groq → a concise paragraph + 4–6 bullet descriptors ("emotional indie, vocal-heavy, exploring alt-rock…"). Store in `/data/taste_dna.json`.
   - **Curator Taste DNA:** for each curator, send its metadata to Groq → same format. Store per curator.
2. **Cache everything.** These calls run once, offline. The demo reads cached DNA — no live Groq needed for this step.
3. Prompt design: instruct Groq to return **strict JSON** (paragraph + bullets), so parsing is reliable. Wrap in retry-on-malformed logic.

**Free-tier note:** ~40 curator calls + 1 user call = ~41 calls, run once, well within free limits. Use the 8B model here (fast, cheap).

**Acceptance:** `taste_dna.json` has a user DNA + a DNA for every curator, all valid JSON.

---

## PHASE 4 — AI Matching Engine

**Goal:** Match the listener to the best curators, ranked, with an AI-generated reason.

**Two implementation options (pick per effort budget):**

**Option A — Groq-only (simplest, recommended for MVP):**
1. Send User Taste DNA + all Curator Taste DNAs to Groq in one prompt.
2. Ask it to return the **top 3–5 curators**, each with a **match %** and a **one-paragraph reason**, as strict JSON.
3. No embeddings, no vector DB. One live call. Cheap, fast, demoable.

**Option B — Embedding + rerank (if you want a "real similarity" story):**
1. Embed User DNA + Curator DNAs (any embedding model).
2. In-memory cosine similarity → top 5 candidates.
3. Send those 5 to Groq for final ranking + explanations.
4. Still no vector DB needed at 40 items — a plain array + cosine loop suffices.

**Critical framing (avoids looking like "For You"):**
- The reason must emphasize **direction, not just similarity**: not "this curator is similar to you," but *"you've recently shifted toward X — this curator lives one step further into that space and consistently finds emerging artists there."* This is what makes it *discovery* (leading you outward) rather than a mirror (more of the same).

**Acceptance:** given the cached DNA, the engine returns 3–5 ranked curators with match % + a forward-looking reason, as clean JSON.

---

## PHASE 5 — Discovery Experience (the UI)

**Goal:** The end-to-end user-facing flow, Spotify-faithful.

**Screens/flow:**
1. **Taste DNA reveal** (the hook): "Here's your musical DNA right now" — shows the user's AI-generated taste paragraph + bullets. (Makes the AI *visible* immediately.)
2. **Today's Curators:** 3–5 `CuratorCard`s — cover art, name, **MatchBadge %**, the AI **Explanation** ("Why this curator?"), and **[Explore Playlist]**.
3. **Explore:** tapping opens the curator's real playlist (deep-link to Spotify, or an embedded track list from `sampleTracks`).
4. **FeedbackBar:** 👍 Loved it · 👎 Not my taste · ❤️ Follow curator → writes to `/data/feedback.json`.
5. **Feedback effect:** stored feedback is folded into the next matching prompt (loved/followed curators bias future ranking; disliked ones are down-weighted).

**Design system (Spotify-faithful):** bg `#121212`, cards `#181818`, green `#1DB954`, text `#FFFFFF`/`#B3B3B3`, Montserrat (Circular substitute), pill buttons, cover-art-forward cards.

**Acceptance:** full flow clickable — DNA reveal → curator cards with reasons → explore → feedback — visually reads as native Spotify.

---

## PHASE 6 — Deploy & Demo Hardening

**Goal:** Bulletproof, deployable, no live dependencies on stage.

**Tasks:**
1. Bake all data (profile, curators, taste DNA) into static JSON shipped with the app.
2. Decide the one live call: either pre-compute the match too (fully static, safest) **or** keep the final Groq ranking live (more impressive, needs `GROQ_API_KEY` server-side + a fallback to cached results if the call fails).
3. Deploy to **Vercel**. Verify on mobile + desktop.
4. "Reset demo" control; graceful fallback if Groq is slow (show cached ranking).
5. `/about` note: "Listening data and curators are real (pulled via Spotify API); taste modeling and matching run on Groq. Matching is live; ingestion is pre-baked for reliability."

**Acceptance:** public link loads <2s; full flow runs without OAuth; if the live Groq call fails, cached results render seamlessly.

---

## How this satisfies the brief (keep visible)

- **Why traditional recs are insufficient:** collaborative filtering recommends *songs* from your own cluster (popularity-bound, no explanation) — it can't reason about *taste* or connect you to a *human* whose taste leads yours.
- **What AI unlocks that was previously difficult:** reading a listener's taste *and* a curator's taste as natural-language "DNA," then reasoning about *fit and direction* between two humans — matching people, not just songs. This semantic, explainable matching is impossible for CF.
- **How AI changes the UX:** discovery shifts from an opaque song-feed to **"here's your taste, here's a human who gets it and leads it, here's why"** — legible, trustable, human.

---

## Build order (hand to Claude Code one phase at a time)

| Phase | Milestone | Live AI? | Depends on |
|---|---|---|---|
| Setup | Next.js + Tailwind + env | — | — |
| 1 | Spotify ingestion → JSON | dev-time only | Setup |
| 2 | Curator knowledge base | no | 1 |
| 3 | Taste DNA (cached) | dev-time only | 2 |
| 4 | Matching engine | optional live | 3 |
| 5 | Discovery UI + feedback | live optional | 4 |
| 6 | Deploy + harden | 1 live call max | 5 |

**Invariants for Claude Code:** keep secrets server-side only; cache all Groq DNA (never regenerate live); match reasons must emphasize *direction/discovery*, not mere similarity; the deployed demo must run without viewer OAuth.

---

## Free-tier / Premium reality check

- **Spotify Premium** is only needed for the *one-time* user-history pull (Phase 1). Curator/playlist metadata uses the free API tier.
- **Groq free tier** is enough because all heavy calls (Taste DNA ×41) run **once, offline, cached**. Only the final ranking may run live — one small call per demo, easily within limits.
- **No vector DB, no separate backend, no paid infra** — Next.js + JSON + Groq + Vercel, all free.
