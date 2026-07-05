import Link from "next/link";
import { LibraryIcon } from "@/components/icons";

export default function LibraryPreview() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <LibraryIcon className="h-10 w-10 text-ai-subtext" />
      <h1 className="text-lg font-bold">Your Library</h1>
      <p className="text-sm text-ai-subtext">
        Curators you follow and songs you save will land here.
      </p>
      <Link href="/" className="mt-1 rounded-pill bg-ai-green px-5 py-2 text-sm font-bold text-black">
        Find curators
      </Link>
    </main>
  );
}
