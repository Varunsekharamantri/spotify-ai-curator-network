// Dev-time only. Run once via `npm run build:taste-dna`, after ingest-spotify.js.
// Generates a natural-language "Taste DNA" for the user and every curator via
// Groq, caches it to /data/taste_dna.json. The app reads cached DNA at runtime
// — no live Groq calls needed for this step.

const fs = require("fs");
const path = require("path");
const { groqJSON } = require("../src/lib/groq.js");

const DATA_DIR = path.join(__dirname, "..", "data");

if (!process.env.GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY in .env");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RESPONSE_SHAPE = `Respond with STRICT JSON only, no markdown, no code fences, in this exact shape:
{
  "paragraph": "2-3 sentence natural-language description",
  "bullets": ["4 to 6 short descriptors, e.g. 'emotional indie', 'vocal-heavy production', 'exploring alt-rock'"],
  "genres": ["3 to 6 short genre or mood tags"]
}`;

function buildUserPrompt(profile) {
  const artistNames = profile.topArtists.map((a) => a.name).slice(0, 20).join(", ");
  const trackNames = profile.topTracks
    .map((t) => `${t.name} — ${t.artists.join(", ")}`)
    .slice(0, 20)
    .join("; ");
  const recentNames = profile.recentlyPlayed
    .map((t) => t.name)
    .filter(Boolean)
    .slice(0, 15)
    .join(", ");

  return `You are a music taste analyst. Based on this Spotify listener's real data, write their "Taste DNA".

Top artists: ${artistNames}
Top tracks: ${trackNames}
Recently played: ${recentNames}

${RESPONSE_SHAPE}`;
}

function buildCuratorPrompt(curator) {
  const sampleTrackNames = curator.sampleTracks.map((t) => `${t.name} — ${t.artists.join(", ")}`).join("; ");
  return `You are a music taste analyst. Based on this real Spotify playlist's metadata, write a "Taste DNA" for the curator behind it.

Playlist name: ${curator.name}
Description: ${curator.description || "(none provided)"}
Sample tracks: ${sampleTrackNames}

${RESPONSE_SHAPE}`;
}

async function main() {
  const userProfile = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "user_profile.json"), "utf8"));
  const curators = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "curators.json"), "utf8"));

  console.log("Generating user Taste DNA...");
  const userDNA = await groqJSON(buildUserPrompt(userProfile));

  console.log(`Generating Taste DNA for ${curators.length} curators...`);
  const curatorDNAs = {};
  for (const curator of curators) {
    try {
      const dna = await groqJSON(buildCuratorPrompt(curator));
      curatorDNAs[curator.id] = dna;
      curator.genres = dna.genres ?? [];
      console.log(`  done: ${curator.name}`);
    } catch (err) {
      console.warn(`  failed: ${curator.name}: ${err.message}`);
    }
    await sleep(150);
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "taste_dna.json"),
    JSON.stringify({ user: userDNA, curators: curatorDNAs }, null, 2),
  );
  fs.writeFileSync(path.join(DATA_DIR, "curators.json"), JSON.stringify(curators, null, 2));

  console.log(`Wrote taste_dna.json (user + ${Object.keys(curatorDNAs).length} curators).`);
  console.log("Updated curators.json with Groq-inferred genres.");
}

main().catch((err) => {
  console.error("Taste DNA generation failed:", err.message);
  process.exit(1);
});
