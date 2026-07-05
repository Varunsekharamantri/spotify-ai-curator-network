// Dev/build-time. Run via `npm run precompute:matches`, after taste DNA exists.
// Generates the baseline curator matches (no feedback) and caches them to
// /data/matches_cache.json. The deployed app serves this instantly on first
// load — zero live LLM dependency at demo time. Live re-ranking only kicks in
// once a viewer gives feedback.

const fs = require("fs");
const path = require("path");
const { getCurators, getTasteDNA, getFeedback } = require("../src/lib/data.js");
const { getCuratorMatches } = require("../src/lib/match.js");

const CACHE_FILE = path.join(__dirname, "..", "data", "matches_cache.json");
const HARD_TIMEOUT_MS = 60000;

async function main() {
  const dna = getTasteDNA();
  const curators = getCurators();
  if (!dna || curators.length === 0) {
    throw new Error("Missing taste_dna.json / curators.json — run ingest + build:taste-dna first.");
  }

  const started = Date.now();
  const matches = await getCuratorMatches({
    userDNA: dna.user,
    curators,
    curatorDNAs: dna.curators,
    feedback: getFeedback(),
  });

  if (matches.length === 0) throw new Error("Matching returned no results.");

  fs.writeFileSync(CACHE_FILE, JSON.stringify({ matches, cachedAt: new Date().toISOString() }, null, 2));
  console.log(`Precomputed ${matches.length} matches in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  for (const m of matches) console.log(`  ${m.matchPercent}%  ${m.curator?.name}`);
}

const guard = setTimeout(() => {
  console.error("Precompute timed out (60s).");
  process.exit(1);
}, HARD_TIMEOUT_MS);

main()
  .then(() => {
    clearTimeout(guard);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Precompute failed:", err.message);
    process.exit(1);
  });
