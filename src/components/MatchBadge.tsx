export default function MatchBadge({ percent }: { percent: number }) {
  return (
    <span className="shrink-0 rounded-pill bg-ai-green/15 px-2.5 py-1 text-xs font-bold text-ai-green">
      {Math.round(percent)}% match
    </span>
  );
}
