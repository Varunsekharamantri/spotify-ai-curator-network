// Renders full-bleed on actual mobile viewports (the natural experience),
// but on anything wider it centers the app inside a phone-shaped frame so a
// juror opening the link on a desktop still immediately reads this as a
// mobile app, not a stretched website. The frame height is capped to the
// viewport so it never gets clipped (which would hide the top bar / back
// button) on shorter windows.
export default function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full bg-ai-bg sm:flex sm:h-dvh sm:items-center sm:justify-center sm:bg-black sm:p-4">
      <div className="relative flex h-full w-full flex-col overflow-hidden sm:h-[min(860px,calc(100dvh-2rem))] sm:w-[390px] sm:rounded-[2.75rem] sm:border sm:border-white/10 sm:shadow-[0_0_0_10px_rgba(0,0,0,0.85),0_30px_60px_rgba(0,0,0,0.6)]">
        {children}
      </div>
    </div>
  );
}
