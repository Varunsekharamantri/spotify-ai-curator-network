import Image from "next/image";
import { SparkleIcon } from "./icons";

const POSITIONS = [
  { top: 18, left: 18 },
  { top: 22, left: 106 },
  { top: 72, left: 12 },
  { top: 76, left: 112 },
  { top: 114, left: 62 },
];

export default function Hero({ curatorPhotos }: { curatorPhotos: (string | null)[] }) {
  const photos = curatorPhotos.filter(Boolean).slice(0, 5) as string[];

  return (
    <section className="flex shrink-0 items-start gap-3 px-6 pt-3">
      <div className="flex-1">
        <h2 className="text-2xl font-extrabold leading-tight">
          AI finds the{" "}
          <span className="text-ai-green">right human taste</span> for you
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ai-subtext">
          We analyze your listening patterns and match you with curators who truly get your vibe.
        </p>
      </div>

      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full">
          <g stroke="rgba(29,185,84,0.35)" strokeWidth="1" strokeDasharray="3 3" fill="none">
            {POSITIONS.map((p, i) => (
              <line key={i} x1="64" y1="64" x2={p.left} y2={p.top} />
            ))}
          </g>
        </svg>
        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ai-green text-black shadow-[0_0_20px_rgba(29,185,84,0.6)]">
          <SparkleIcon className="h-6 w-6" />
        </div>
        {photos.map((url, i) => (
          <div
            key={url}
            className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-2 ring-ai-green/60"
            style={{ top: `${POSITIONS[i].top}px`, left: `${POSITIONS[i].left}px` }}
          >
            <Image src={url} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
