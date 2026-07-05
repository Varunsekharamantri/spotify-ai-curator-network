export default function CuratorLoading() {
  return (
    <main className="animate-pulse pb-8">
      <div className="h-56 w-full bg-ai-card" />
      <div className="px-6 pt-4">
        <div className="h-5 w-2/3 rounded bg-ai-card" />
        <div className="mt-2 h-3 w-1/3 rounded bg-ai-card" />
        <div className="mt-4 h-3 w-full rounded bg-ai-card" />
        <div className="mt-2 h-3 w-5/6 rounded bg-ai-card" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-ai-card" />
              <div className="flex-1">
                <div className="h-3 w-1/2 rounded bg-ai-card" />
                <div className="mt-1.5 h-2.5 w-1/3 rounded bg-ai-card" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
