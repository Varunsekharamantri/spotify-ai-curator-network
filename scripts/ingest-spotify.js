// Dev-time only. Run once via `npm run ingest:spotify`.
// Authorization Code flow -> pulls the developer's real listening data,
// then resolves a set of real editorial/curator playlists -> writes static JSON.
// The app never calls Spotify live after this.

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/callback";
const REDIRECT_PORT = Number(new URL(REDIRECT_URI).port) || 3000;
const REDIRECT_HOST = new URL(REDIRECT_URI).hostname;
const DATA_DIR = path.join(__dirname, "..", "data");
const TOKEN_CACHE_FILE = path.join(__dirname, "..", ".spotify-token-cache.json");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env");
  process.exit(1);
}

const SCOPES = ["user-top-read", "user-read-recently-played", "user-library-read"].join(" ");

const CURATOR_SEARCH_QUERIES = [
  "Today's Top Hits", "RapCaviar", "Rock Classics", "Hot Country", "Viva Latino",
  "Are & Be", "mint", "Deep Focus", "Peaceful Piano", "Jazz Vibes",
  "Chill Hits", "New Music Friday", "Songs to Sing in the Shower", "Beast Mode",
  "Get Turnt", "Indie Pop", "Alternative 90s", "Throwback Hits", "All Out 2000s",
  "All Out 80s", "All Out 70s", "Soul Coffee", "Lo-Fi Beats", "Bedroom Pop",
  "Afternoon Acoustic", "Feelin' Good", "Mood Booster", "Sad Songs", "Country Gold",
  "Metal Essentials", "Classical Essentials", "Piano Bar", "Dance Pop", "Techno Bunker",
  "UK Drill", "Grime Shutdown", "K-Pop Daebak", "Bollywood Butter", "Reggae Vibes",
  "Folk n Friends", "Fresh Finds", "This Is Billie Eilish", "This Is Taylor Swift",
  "This Is Kendrick Lamar", "Pop Rising",
];

function base64(str) {
  return Buffer.from(str).toString("base64");
}

async function spotifyFetch(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url} :: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function waitForAuthCode(state) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/html" });
      if (error) {
        res.end(`<h2>Spotify authorization failed: ${error}</h2>You can close this tab.`);
        server.close();
        reject(new Error(`Spotify auth error: ${error}`));
        return;
      }
      if (returnedState !== state) {
        res.end("<h2>State mismatch — possible CSRF. Aborting.</h2>");
        server.close();
        reject(new Error("OAuth state mismatch"));
        return;
      }
      res.end("<h2>Authorized ✓</h2>You can close this tab and return to the terminal.");
      server.close();
      resolve(code);
    });

    server.listen(REDIRECT_PORT, REDIRECT_HOST, () => {
      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("state", state);

      console.log("\nOpen this URL in your browser and click Agree:\n");
      console.log(authUrl.toString());
      console.log("\nWaiting for authorization (5 min timeout)...\n");

      if (process.platform === "darwin") {
        try {
          execSync(`open "${authUrl.toString()}"`);
        } catch {
          // best-effort; the printed URL above is the fallback
        }
      }
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for Spotify authorization (5 min)"));
    }, 5 * 60 * 1000);
  });
}

async function exchangeCodeForToken(code) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function getAccessToken() {
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, "utf8"));
      const tokenResponse = await refreshAccessToken(cached.refresh_token);
      fs.writeFileSync(
        TOKEN_CACHE_FILE,
        JSON.stringify({ refresh_token: tokenResponse.refresh_token ?? cached.refresh_token }),
      );
      console.log("Reused cached Spotify session (no browser needed).");
      return tokenResponse.access_token;
    } catch (err) {
      console.warn(`Cached token refresh failed (${err.message}), falling back to full login.`);
    }
  }

  const state = crypto.randomBytes(16).toString("hex");
  const code = await waitForAuthCode(state);
  const tokenResponse = await exchangeCodeForToken(code);
  fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify({ refresh_token: tokenResponse.refresh_token }));
  return tokenResponse.access_token;
}

async function fetchUserProfile(token) {
  const [topArtists, topTracks, recentlyPlayed, savedTracks] = await Promise.all([
    spotifyFetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50", token),
    spotifyFetch("https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50", token),
    spotifyFetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", token),
    spotifyFetch("https://api.spotify.com/v1/me/tracks?limit=50", token),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    topArtists: topArtists.items.map((a) => ({
      id: a.id,
      name: a.name,
      genres: a.genres,
      popularity: a.popularity,
      imageUrl: a.images?.[0]?.url ?? null,
    })),
    topTracks: topTracks.items.map((t) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name),
      album: t.album?.name ?? null,
      imageUrl: t.album?.images?.[0]?.url ?? null,
    })),
    recentlyPlayed: recentlyPlayed.items.map((item) => ({
      trackId: item.track?.id ?? null,
      name: item.track?.name ?? null,
      artists: item.track?.artists?.map((a) => a.name) ?? [],
      playedAt: item.played_at,
    })),
    savedTracks: savedTracks.items.map((item) => ({
      trackId: item.track?.id ?? null,
      name: item.track?.name ?? null,
      artists: item.track?.artists?.map((a) => a.name) ?? [],
      addedAt: item.added_at,
    })),
  };
}

// Spotify blocks GET /v1/playlists/{id}/tracks (403) for playlists the
// authenticated user doesn't own, for apps without extended API access —
// confirmed by direct testing, not something fixable client-side.
// So: playlist search gives the curator's real identity (name, description,
// cover art, owner, follow count); track search on the same theme gives real,
// currently-live sample tracks. Genre tags aren't sourced here — Spotify's
// artist objects no longer return a `genres` field for restricted apps either
// — they're inferred by Groq from name/description/tracks in Phase 3 instead.
async function fetchFollowerCount(id, token) {
  try {
    const result = await spotifyFetch(
      `https://api.spotify.com/v1/playlists/${id}?fields=followers.total`,
      token,
    );
    return result.followers?.total ?? 0;
  } catch {
    return 0;
  }
}

// User-uploaded playlists occasionally carry offensive, crude, or spam-stuffed
// names/descriptions. Reject those outright rather than baking them into a
// public demo, and fall back to the next-most-followed candidate.
const FLAGGED_PATTERNS = [
  /\b(white|black|asian|latino|latina|brown)\s+(people|folks|guys|girls)\b/i,
  /\bnigga|nigger|retard|slut|whore|rape|kill\s+yourself\b/i,
  /\bfuck|shit|bitch|cunt\b/i,
];

function isAppropriate(name, description) {
  const text = `${name} ${description}`;
  return !FLAGGED_PATTERNS.some((re) => re.test(text));
}

// Search ranking often surfaces low-quality/SEO-stuffed playlists ahead of
// genuinely notable ones. Follower count is a real "this is a trusted curator"
// signal, so rank the top candidates by it instead of taking the first hit.
async function findCuratorPlaylist(query, token, seen) {
  const result = await spotifyFetch(
    `https://api.spotify.com/v1/search?type=playlist&limit=5&q=${encodeURIComponent(query)}`,
    token,
  );
  const candidates = (result.playlists?.items ?? []).filter(
    (p) => p && p.images?.length && !seen.has(p.id) && isAppropriate(p.name, p.description ?? ""),
  );
  if (candidates.length === 0) return null;

  const withFollowers = await Promise.all(
    candidates.map(async (p) => ({ playlist: p, followers: await fetchFollowerCount(p.id, token) })),
  );
  withFollowers.sort((a, b) => b.followers - a.followers);
  return { ...withFollowers[0].playlist, followers: { total: withFollowers[0].followers } };
}

async function findSampleTracks(query, token) {
  // Restricted apps (no extended API access) cap search limit at 10, though
  // the public docs claim up to 50 — confirmed by direct testing.
  const result = await spotifyFetch(
    `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`,
    token,
  );
  return (result.tracks?.items ?? []).filter(Boolean).map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name),
    imageUrl: t.album?.images?.[0]?.url ?? null,
  }));
}

function topByFrequency(items, n) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([item]) => item);
}

async function buildCurators(token) {
  const seen = new Set();
  const curators = [];

  for (const query of CURATOR_SEARCH_QUERIES) {
    try {
      const playlist = await findCuratorPlaylist(query, token, seen);
      if (!playlist) {
        console.warn(`No usable playlist found for "${query}".`);
        continue;
      }
      const sampleTracks = await findSampleTracks(query, token);
      if (sampleTracks.length < 5) {
        console.warn(`Dropped "${playlist.name}": only ${sampleTracks.length} sample tracks.`);
        continue;
      }

      seen.add(playlist.id);
      curators.push({
        id: playlist.id,
        name: playlist.name,
        description: (playlist.description || "").replace(/<[^>]+>/g, ""),
        coverUrl: playlist.images?.[0]?.url ?? null,
        spotifyUrl: playlist.external_urls?.spotify ?? null,
        ownerName: playlist.owner?.display_name ?? "Spotify",
        followers: playlist.followers?.total ?? null,
        topArtists: topByFrequency(sampleTracks.flatMap((t) => t.artists), 5),
        genres: [],
        sampleTracks: sampleTracks.slice(0, 10),
      });
    } catch (err) {
      console.warn(`Failed to build curator for "${query}": ${err.message}`);
    }
  }

  return curators;
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const token = await getAccessToken();

  console.log("Authorized. Fetching listening history...");
  const userProfile = await fetchUserProfile(token);
  fs.writeFileSync(
    path.join(DATA_DIR, "user_profile.json"),
    JSON.stringify(userProfile, null, 2),
  );
  console.log(`Wrote user_profile.json (${userProfile.topArtists.length} top artists, ${userProfile.topTracks.length} top tracks).`);

  console.log("Resolving curator playlists...");
  const curators = await buildCurators(token);
  fs.writeFileSync(
    path.join(DATA_DIR, "curators.json"),
    JSON.stringify(curators, null, 2),
  );
  console.log(`Wrote curators.json (${curators.length} curators).`);

  if (curators.length < 30) {
    console.warn(`Only ${curators.length} curators resolved (target 30-50). Consider adding more search queries.`);
  }
}

main().catch((err) => {
  console.error("Ingestion failed:", err.message);
  process.exit(1);
});
