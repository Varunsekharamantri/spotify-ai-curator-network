import Link from "next/link";
import { SearchIcon, SparkleIcon } from "@/components/icons";

const GENRES = [
  { label: "Pop", color: "#8D67AB" },
  { label: "Hip-Hop", color: "#BA5D07" },
  { label: "Bollywood", color: "#E8115B" },
  { label: "Rock", color: "#E61E32" },
  { label: "Indie", color: "#1E3264" },
  { label: "Chill", color: "#537A96" },
  { label: "Dance", color: "#D84000" },
  { label: "Focus", color: "#503750" },
];

export default function SearchPreview() {
  return (
    <main className="pb-8">
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-bold">Search</h1>
        <div className="mt-4 flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-black">
          <SearchIcon className="h-5 w-5" filled />
          <span className="text-sm font-medium text-black/60">What do you want to listen to?</span>
        </div>
      </header>

      {/* Discover via curators */}
      <Link
        href="/"
        className="mx-5 mt-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-ai-green/25 to-ai-card p-4"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ai-green text-black">
          <SparkleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">Not sure what to search?</p>
          <p className="text-xs text-ai-subtext">Let AI Curators match you to human taste →</p>
        </div>
      </Link>

      <h2 className="mb-3 mt-6 px-5 text-lg font-bold">Browse all</h2>
      <div className="grid grid-cols-2 gap-3 px-5">
        {GENRES.map((g) => (
          <div
            key={g.label}
            className="relative h-24 overflow-hidden rounded-lg p-3"
            style={{ backgroundColor: g.color }}
          >
            <span className="text-sm font-bold">{g.label}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
