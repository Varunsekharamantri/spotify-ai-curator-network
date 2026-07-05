import { CheckIcon } from "./icons";

const STEPS = ["Listening", "Understanding you", "Finding curators", "Personalizing matches"];

export default function AnalysisProgress({ stepIndex }: { stepIndex: number }) {
  const displayPercent = Math.min(96, 15 + stepIndex * 25);
  const progressWidth = (stepIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-6 mt-4 rounded-xl border border-ai-green/30 bg-ai-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ai-green">Analysis in progress</p>
          <p className="mt-1 text-xs text-ai-subtext">
            Your taste is being analyzed and curated matches are being generated in real-time.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-extrabold text-ai-green">{displayPercent}%</p>
          <p className="text-[10px] font-semibold text-ai-green">Almost there!</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-col items-center gap-1">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                i < stepIndex
                  ? "bg-ai-green text-black"
                  : i === stepIndex
                    ? "border-2 border-ai-green text-ai-green shadow-[0_0_8px_rgba(29,185,84,0.6)]"
                    : "border border-white/15 text-ai-subtext"
              }`}
            >
              {i < stepIndex ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <span className="text-center text-[9px] leading-tight text-ai-subtext">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-ai-green transition-all duration-500"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
}
