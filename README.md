# Spotify AI Curator Network

> Discover music through **people, not algorithms.** An AI intelligence layer reads your musical taste, reads the taste of real human curators, and matches you to the humans whose taste *leads* yours — with a plain-language reason for every match.

Built as an AI-native MVP: a Spotify-faithful mobile web app where the AI is the **reasoning layer connecting a listener to the right human**, not another song-recommender.

---

## What it does

1. **Reads your taste** — an LLM turns your real Spotify listening into a natural-language "Taste DNA."
2. **Reads each curator's taste** — the same, for a set of real Spotify playlists.
3. **Matches you to curators** — ranked, with a **match %** and a forward-looking reason ("you've been leaning into X; this curator leads one step further into Y"). Generated **live**.
4. **Explains any match** — open a curator and the AI compares your Taste DNA to theirs, live.
5. **Learns from feedback** — follow / loved / not-my-taste is folded into the next ranking, in-context (no model training).

## Why AI is uniquely suited

Collaborative filtering matches **you → songs** in your own cluster: opaque, popularity-bound, no explanation. This matches **you → a human whose taste leads yours**, reasoning about *fit and direction* between two people and explaining it in words. That semantic, explainable, human-to-human matching is impossible for CF.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router) + React + Tailwind CSS |
| API | Next.js Route Handlers (serverless) |
| AI / LLM | Llama 3.3 70B via Groq (strict-JSON prompting) |
| Music data | Spotify Web API (OAuth + Search) |
| Store | JSON documents in `/data` |
| Hosting | Vercel |

See [`TECH_ARCHITECTURE.md`](./TECH_ARCHITECTURE.md) for the full architecture and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the phased build spec.

## Local setup

```bash
npm install
cp .env.example .env      # fill in SPOTIFY_CLIENT_ID/SECRET and GROQ_API_KEY
npm run dev               # http://localhost:3000
```

Dev-time data pipeline (run once):

```bash
npm run ingest:spotify    # OAuth → pull listening data + curator playlists
npm run build:taste-dna   # generate cached Taste DNA (user + curators)
npm run precompute:matches # warm the baseline match cache
```

The deployed app serves the precomputed data instantly and runs the matching engine live on each visit (with a cache fallback).

## Project structure

```
src/app          Next.js routes + API handlers (/api/matches, /api/why, /api/feedback)
src/components    UI (swipe deck, curator screen, now-playing, header, nav)
src/lib           groq / matching / data / player / deck-cache
scripts           dev-time: ingest-spotify, build-taste-dna, precompute-matches
data              generated JSON (curators, taste DNA, matches, profile, feedback)
```

Secrets live only in `.env` (gitignored). No API keys are committed.
