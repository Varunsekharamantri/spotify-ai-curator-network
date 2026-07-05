# AI Curator Network — Technical Architecture

> **One-liner:** An AI intelligence layer that reads a listener's musical taste, reads the taste of real human curators, and matches the listener to the humans whose taste *leads* theirs — turning discovery from an opaque song-feed into "here's your taste, here's a human who gets it, here's why."

*This document is written assuming unconstrained LLM API access. It describes the production-ideal architecture; caching and provider-fallback exist in the reference build purely as reliability optimizations, not as core requirements.*

---

## 1. The Core Idea

Traditional recommenders match **you → songs** using collaborative filtering. This system matches **you → a human curator → their world of music**, with an AI-generated, plain-language reason for every match.

The AI is not another song-recommender. It is the **reasoning layer** that:
1. Reads *your* taste as natural-language "Taste DNA."
2. Reads *each curator's* taste as Taste DNA.
3. Reasons about **fit and direction** between two humans.
4. Explains the match in words a person can trust.

---

## 2. System Overview

Four layers, top to bottom:

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER   Next.js + Tailwind (Spotify-native UI) │
│  Taste reveal · Swipe deck · Curator playlist · Now Playing  │
└───────────────▲─────────────────────────────────────────────┘
                │  REST (JSON)
┌───────────────┴─────────────────────────────────────────────┐
│  APPLICATION / API LAYER   Next.js Route Handlers            │
│  /api/matches · /api/why · /api/feedback                     │
└───────────────▲─────────────────────────────────────────────┘
                │
┌───────────────┴─────────────────────────────────────────────┐
│  AI INTELLIGENCE LAYER   LLM (Llama 3.3 70B / frontier model)│
│  Taste-DNA synthesis · Match ranking · Match explanation     │
└───────────────▲─────────────────────────────────────────────┘
                │
┌───────────────┴─────────────────────────────────────────────┐
│  DATA LAYER   Spotify Web API (ingest) + JSON/DB store       │
│  user_profile · curators · taste_dna · feedback              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Breakdown

### 3.1 Data Layer — Ingestion & Storage

**Purpose:** Turn real Spotify signals into a clean, queryable knowledge base.

| Source | Via | Produces |
|---|---|---|
| Listener's account | Spotify OAuth (Authorization Code) | Top Artists, Top Tracks, Recently Played, Saved Tracks |
| Curator playlists | Spotify Search + Playlist API | Name, description, cover art, owner, follower count, sample tracks (with album art) |

- **Curator selection:** playlists ranked by follower count (a real "trusted curator" signal), moderation-filtered for name/description quality.
- **Store:** `user_profile.json`, `curators.json` (SQLite or a document DB at scale).
- **Cadence:** ingestion is a scheduled/batch job, decoupled from request-time serving.

### 3.2 AI Intelligence Layer — the heart

Three distinct LLM roles, each a well-scoped prompt with strict-JSON output.

**(a) Taste-DNA Synthesis** — *"Read the taste."*
- **Input:** raw listening data (user) / playlist metadata + sample tracks (curator).
- **Output:** a natural-language paragraph + 4–6 descriptors + genre/mood tags.
- **Runs for:** the listener once per session, and every curator.

**(b) Matching Engine** — *"Rank the humans."*
- **Input:** listener Taste DNA + all curator Taste DNAs + stored feedback.
- **Output:** ranked curators, each with a **match %** and a **forward-looking reason** (emphasizing *direction* — where the curator leads you — not mere similarity).
- **Key constraint in the prompt:** reasons must name a specific thing the listener already likes AND where the curator takes them next.

**(c) Match Explanation** — *"Explain this pairing, live."*
- **Input:** listener Taste DNA vs. one curator's Taste DNA.
- **Output:** a 2-sentence, second-person explanation of the specific overlap + the discovery direction.
- **Runs:** on demand when a listener opens a curator ("Why this curator?").

### 3.3 Application / API Layer

Stateless REST endpoints (Next.js Route Handlers), no server session required:

| Endpoint | Responsibility |
|---|---|
| `GET /api/matches` | Runs the Matching Engine → ranked curators + reasons |
| `GET /api/why?curatorId=` | Runs Match Explanation for one curator, live |
| `POST /api/feedback` | Persists follow / loved / not-my-taste signals |

- Server-side only secrets (Spotify + LLM keys).
- JSON in / JSON out; horizontally scalable (serverless functions).

### 3.4 Presentation Layer

Next.js (App Router) + Tailwind, built as a **Spotify-native mobile app**:

- **Taste DNA reveal** — the AI's read of *you*, made visible.
- **Swipe deck (Tinder-style)** — one curator card at a time; swipe right to follow, left to pass; batched "top matches" → "next best matches" on request.
- **Curator screen** — cover, live "Why this curator?", playable tracklist, per-track add, merge-playlist / save-songs.
- **Now Playing** — full player + persistent mini-player.
- **Feedback controls** — independent Follow toggle; mutually-exclusive Loved / Not-my-taste.

---

## 4. End-to-End Data Flow

```
[Dev/Batch time]
Spotify OAuth ──► user listening data ─┐
Spotify Search ─► curator playlists ───┤──► LLM: Taste-DNA synthesis ──► taste_dna store
                                       ┘

[Request time]
Listener opens app
     │
     ├─► GET /api/matches
     │        └─► LLM: rank curators vs user Taste DNA (+ feedback)
     │                 └─► ranked curators + match% + reasons ──► Swipe deck
     │
     ├─► taps a curator ─► GET /api/why
     │        └─► LLM: compare user vs curator Taste DNA (live)
     │                 └─► "Why this curator?" explanation
     │
     └─► gives feedback ─► POST /api/feedback ─► store
                                   └─► folded into the NEXT ranking prompt
```

---

## 5. The Feedback Loop (self-improving, no ML training)

```
User action (👍 loved / 👎 not-my-taste / ♥ follow)
        │
        ▼
   feedback store
        │
        ▼
Injected as context into the next Matching Engine prompt
        │
        ▼
Re-ranked curators that reflect the user's evolving taste
```

No online model training — the LLM adapts *in-context* from stored preference signals. Cheap, instant, explainable.

---

## 6. AI Pipeline Detail (prompt roles)

| Role | Input | Output shape | Cardinality |
|---|---|---|---|
| Taste-DNA (user) | listening history | `{ paragraph, bullets[], genres[] }` | 1 |
| Taste-DNA (curator) | playlist metadata | `{ paragraph, bullets[], genres[] }` | N curators |
| Matching | user DNA + N curator DNAs + feedback | `{ matches: [{ curatorId, matchPercent, reason }] }` | 1 call → K ranked |
| Explanation | user DNA + 1 curator DNA | `{ message }` | 1 per curator view |

All outputs are strict JSON, validated against known curator IDs before rendering.

---

## 7. Data Model (core entities)

```
UserProfile   { topArtists[], topTracks[], recentlyPlayed[], savedTracks[] }
Curator       { id, name, description, coverUrl, ownerName, followers,
                genres[], sampleTracks[{ id, name, artists[], imageUrl }] }
TasteDNA      { paragraph, bullets[], genres[] }          // per user & per curator
Match         { curatorId, matchPercent, reason, curator }
Feedback      { curatorId, action, at }                   // action ∈ follow|loved|not_my_taste
```

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + React + Tailwind CSS |
| API | Next.js Route Handlers (serverless) |
| AI / LLM | Llama 3.3 70B (via Groq) or any frontier model — strict-JSON prompting |
| Music data | Spotify Web API (OAuth + Search + Playlist) |
| Store | JSON documents (SQLite / document DB at scale) |
| Hosting | Vercel (edge/serverless) |

---

## 9. Why AI Is Uniquely Suited

| | Traditional recommender (collaborative filtering) | AI Curator Network |
|---|---|---|
| **Matches** | you → songs in your own cluster | you → a *human* whose taste leads yours |
| **Reasoning** | opaque, popularity-bound | explicit, natural-language "why" |
| **Discovery** | more of the same | *direction* — one step beyond your taste |
| **Explainability** | none | a trustable, human-readable reason per match |
| **Adaptation** | retrain models | in-context from stored feedback, instantly |

**What AI unlocks that was previously hard:** reading *taste itself* — a listener's and a curator's — as natural language, then reasoning about **fit and direction** between two people. This semantic, explainable, human-to-human matching is impossible for collaborative filtering.

---

## 10. Scalability & Production Notes (unconstrained)

- **Stateless API** → scales horizontally on serverless.
- **Taste-DNA is computed once** and reused → most requests are a single ranking call.
- **Batch ingestion** decouples Spotify rate limits from request-time.
- **Caching / provider fallback** (optional): warm cache of last ranking + multi-provider LLM routing for resilience — an optimization, not a dependency.
- **Personalization scales** with feedback: each user's stored signals sharpen their own prompt context.

---

## 11. Suggested Slide Breakdown (for deck generation)

1. **Title** — AI Curator Network: discover music through people, not algorithms.
2. **The Problem** — discovery is an opaque song-feed; users loop the same clusters.
3. **The Idea** — match listeners to human curators whose taste *leads* theirs.
4. **System Architecture** — the 4-layer diagram (Section 2).
5. **The AI Intelligence Layer** — Taste DNA → Matching → Explanation (Section 3.2).
6. **End-to-End Data Flow** — ingest → synthesize → match → explain (Section 4).
7. **The Feedback Loop** — self-improving without model training (Section 5).
8. **Why AI Is Uniquely Suited** — CF vs. this, comparison table (Section 9).
9. **Tech Stack & Deployment** — Section 8.
10. **Vision / Scale** — personalization + curator network effects (Section 10).
```
