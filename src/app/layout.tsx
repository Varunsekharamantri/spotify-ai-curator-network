import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileFrame from "@/components/MobileFrame";
import MiniPlayer from "@/components/MiniPlayer";
import NowPlayingSheet from "@/components/NowPlayingSheet";
import BottomNav from "@/components/BottomNav";
import { PlayerProvider } from "@/lib/PlayerContext";

export const metadata: Metadata = {
  title: "AI Curator Network — Discover music through people, not algorithms",
  description:
    "AI reads your taste, then matches you to the human curators whose taste fits — or leads — yours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans bg-ai-bg text-ai-text min-h-screen">
        <MobileFrame>
          <PlayerProvider>
            <div className="flex h-full min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
              <MiniPlayer />
              <BottomNav />
            </div>
            <NowPlayingSheet />
          </PlayerProvider>
        </MobileFrame>
      </body>
    </html>
  );
}
