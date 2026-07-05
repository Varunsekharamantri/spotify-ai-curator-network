import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurators, getTasteDNA, getCachedMatches } from "@/lib/data";
import MatchBadge from "@/components/MatchBadge";
import WhyThisCurator from "@/components/WhyThisCurator";
import FeedbackBar from "@/components/FeedbackBar";
import CuratorActions from "@/components/CuratorActions";
import TrackRow from "@/components/TrackRow";
import { ChevronLeftIcon, SparkleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ match?: string; reason?: string }>;
};

type CachedMatch = { curatorId: string; matchPercent: number; reason: string };

export default async function CuratorDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const curators = getCurators();
  const curator = curators.find((c: { id: string }) => c.id === id);
  if (!curator) notFound();

  const dna = getTasteDNA();
  const curatorDNA = dna?.curators?.[id];

  const matchPercent = sp.match ? Number(sp.match) : null;
  const reason = sp.reason ? decodeURIComponent(sp.reason) : curatorDNA?.paragraph ?? curator.description;

  // "Next best match" — advance through the same ranked order as the home deck.
  const ranked: CachedMatch[] = getCachedMatches();
  const pos = ranked.findIndex((m) => m.curatorId === id);
  const nextMatch = ranked.length > 0 ? ranked[(pos + 1) % ranked.length] : null;
  const nextHref =
    nextMatch && nextMatch.curatorId !== id
      ? `/curator/${nextMatch.curatorId}?match=${Math.round(nextMatch.matchPercent)}&reason=${encodeURIComponent(nextMatch.reason)}`
      : null;

  return (
    <main className="pb-8">
      <div className="relative h-56 w-full overflow-hidden bg-ai-card">
        {curator.coverUrl && (
          <Image src={curator.coverUrl} alt={curator.name} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ai-bg via-black/20 to-black/40" />
        <Link
          href="/"
          aria-label="Back to matches"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-ai-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      </div>

      <div className="px-6 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold leading-tight">{curator.name}</h1>
            <p className="text-xs text-ai-subtext">by {curator.ownerName}</p>
          </div>
          {matchPercent !== null && <MatchBadge percent={matchPercent} />}
        </div>

        <div className="mt-4">
          <FeedbackBar curatorId={curator.id} />
        </div>

        <div className="mt-5">
          <WhyThisCurator curatorId={curator.id} fallback={reason} />
        </div>

        <CuratorActions trackCount={curator.sampleTracks.length} spotifyUrl={curator.spotifyUrl ?? null} />

        <div className="mb-2 mt-6 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ai-subtext">Tracks</h2>
          {nextHref && (
            <Link
              href={nextHref}
              className="flex items-center gap-1 rounded-pill border border-ai-green/40 px-3 py-1 text-[11px] font-semibold text-ai-green"
            >
              <SparkleIcon className="h-3 w-3" />
              Next best match
            </Link>
          )}
        </div>
        <div className="flex flex-col">
          {curator.sampleTracks.map((track: { id: string; name: string; artists: string[] }) => (
            <TrackRow
              key={track.id}
              track={track}
              queue={curator.sampleTracks}
              curatorName={curator.name}
              coverUrl={curator.coverUrl}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
