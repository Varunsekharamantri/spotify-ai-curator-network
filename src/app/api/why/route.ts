import { NextRequest, NextResponse } from "next/server";
import { getCurators, getTasteDNA } from "@/lib/data";
import { explainMatch } from "@/lib/match";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(req: NextRequest) {
  const curatorId = req.nextUrl.searchParams.get("curatorId");
  if (!curatorId) {
    return NextResponse.json({ error: "Missing curatorId" }, { status: 400 });
  }

  const dna = getTasteDNA();
  const curators = getCurators();
  const curator = curators.find((c: { id: string }) => c.id === curatorId);
  const curatorDNA = dna?.curators?.[curatorId];

  if (!dna || !curator || !curatorDNA) {
    return NextResponse.json({ message: curator?.description ?? "", source: "fallback" }, { headers: NO_STORE });
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Live explanation timed out")), TIMEOUT_MS),
    );
    const message = await Promise.race([
      explainMatch({ userDNA: dna.user, curatorDNA, curatorName: curator.name }),
      timeout,
    ]);
    return NextResponse.json({ message, source: "live" }, { headers: NO_STORE });
  } catch {
    // Fall back to the curator's cached taste-DNA paragraph so the section is
    // never empty, even if Groq is rate-limited.
    return NextResponse.json(
      { message: curatorDNA.paragraph ?? curator.description, source: "fallback" },
      { headers: NO_STORE },
    );
  }
}
