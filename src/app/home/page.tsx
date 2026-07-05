import Image from "next/image";
import Link from "next/link";
import { getUserProfile } from "@/lib/data";
import { SparkleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type Artist = { id: string; name: string; imageUrl: string | null };
type Track = { id: string; name: string; artists: string[]; imageUrl: string | null };

export default async function HomePreview() {
  const profile = getUserProfile();
  const artists: Artist[] = profile?.topArtists ?? [];
  const tracks: Track[] = profile?.topTracks ?? [];

  return (
    <main className="pb-8">
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-bold">{greeting()}</h1>
      </header>

      {/* Jump back in — quick tiles from real top artists */}
      <div className="mt-4 grid grid-cols-2 gap-2 px-5">
        {artists.slice(0, 6).map((a) => (
          <div key={a.id} className="flex items-center gap-2 overflow-hidden rounded-md bg-white/10">
            <div className="relative h-12 w-12 shrink-0 bg-ai-cardHover">
              {a.imageUrl && <Image src={a.imageUrl} alt={a.name} fill className="object-cover" />}
            </div>
            <span className="truncate pr-2 text-xs font-semibold">{a.name}</span>
          </div>
        ))}
      </div>

      {/* AI Curators promo */}
      <Link
        href="/"
        className="mx-5 mt-6 flex items-center gap-3 rounded-xl bg-gradient-to-r from-ai-green/25 to-ai-card p-4"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ai-green text-black">
          <SparkleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">Discover through people, not algorithms</p>
          <p className="text-xs text-ai-subtext">Open AI Curators to find your matches →</p>
        </div>
      </Link>

      {/* Recommended for today — real top tracks */}
      <h2 className="mb-3 mt-6 px-5 text-lg font-bold">Recommended for today</h2>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2">
        {tracks.slice(0, 10).map((t) => (
          <div key={t.id} className="w-32 shrink-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ai-cardHover">
              {t.imageUrl && <Image src={t.imageUrl} alt={t.name} fill className="object-cover" />}
            </div>
            <p className="mt-1.5 truncate text-xs font-semibold">{t.name}</p>
            <p className="truncate text-[11px] text-ai-subtext">{t.artists.join(", ")}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
