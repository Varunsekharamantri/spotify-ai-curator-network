import { getCurators, getTasteDNA } from "@/lib/data";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DiscoverFeed from "@/components/DiscoverFeed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dna = getTasteDNA();
  const curators = getCurators();

  if (!dna || curators.length === 0) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <span className="rounded-pill bg-ai-card px-4 py-1 text-xs font-semibold uppercase tracking-wide text-ai-green">
          No data yet
        </span>
        <h1 className="text-2xl font-bold">AI Curator Network</h1>
        <p className="max-w-md text-ai-subtext">
          Run <code className="text-ai-green">npm run ingest:spotify</code> then{" "}
          <code className="text-ai-green">npm run build:taste-dna</code> to generate real data
          before loading this page.
        </p>
      </main>
    );
  }

  const curatorGenres = Object.fromEntries(
    Object.entries(dna.curators as Record<string, { genres?: string[] }>).map(([id, d]) => [
      id,
      d.genres ?? [],
    ]),
  );

  const curatorPhotos = curators
    .slice(0, 5)
    .map((c: { coverUrl: string | null }) => c.coverUrl);

  return (
    <main className="pb-8">
      <Header />
      <Hero curatorPhotos={curatorPhotos} />
      <DiscoverFeed curatorGenres={curatorGenres} />
    </main>
  );
}
