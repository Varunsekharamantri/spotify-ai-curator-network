import { SpotifyIcon } from "./icons";
import ScanAgainButton from "./ScanAgainButton";

export default function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between px-6 pb-1 pt-6">
      <div className="flex items-center gap-2">
        <SpotifyIcon className="h-7 w-7" />
        <h1 className="text-sm font-bold">AI Curator Network</h1>
      </div>
      <ScanAgainButton />
    </header>
  );
}
