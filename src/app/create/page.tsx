import Link from "next/link";
import { CreateIcon } from "@/components/icons";

export default function CreatePreview() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <CreateIcon className="h-10 w-10 text-ai-subtext" />
      <h1 className="text-lg font-bold">Create</h1>
      <p className="text-sm text-ai-subtext">
        Build a playlist by merging the curators the AI matched you with.
      </p>
      <Link href="/" className="mt-1 rounded-pill bg-ai-green px-5 py-2 text-sm font-bold text-black">
        Start from a match
      </Link>
    </main>
  );
}
