import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getCurators, getFeedback, getTasteDNA } from "@/lib/data";
import { getCuratorMatches } from "@/lib/match";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const CACHE_FILE = path.join(process.cwd(), "data", "matches_cache.json");
const LIVE_TIMEOUT_MS = 8000;
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(matches: unknown) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ matches, cachedAt: new Date().toISOString() }, null, 2));
  } catch {
    // best-effort; a failed cache write shouldn't break the response
  }
}

export async function GET() {
  const dna = getTasteDNA();
  const curators = getCurators();
  const feedback = getFeedback();

  if (!dna || curators.length === 0) {
    return NextResponse.json({ matches: [], error: "No data yet" });
  }

  const cached = readCache();
  const hasFeedback = (feedback?.entries ?? []).length > 0;

  // Every load runs a REAL live Groq ranking (the provider fallback chain), so
  // the "Analysis in progress" the viewer sees corresponds to actual AI work.
  // The precomputed cache is only a safety net: if the live call fails or gets
  // rate-limited, we serve the last good result instead of erroring/hanging.
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Live matching timed out")), LIVE_TIMEOUT_MS),
    );
    const matches = await Promise.race([
      getCuratorMatches({ userDNA: dna.user, curators, curatorDNAs: dna.curators, feedback }),
      timeout,
    ]);
    // Keep the baseline cache warm from the freshest live result (no feedback).
    if (!hasFeedback) writeCache(matches);
    return NextResponse.json({ matches, source: "live" }, { headers: NO_STORE });
  } catch (err) {
    if (cached?.matches?.length) {
      return NextResponse.json(
        { matches: cached.matches, source: "cache-fallback", stale: true },
        { headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { matches: [], error: err instanceof Error ? err.message : "Matching failed" },
      { headers: NO_STORE },
    );
  }
}
