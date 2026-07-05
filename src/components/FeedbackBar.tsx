"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { ThumbUpIcon, ThumbDownIcon, HeartIcon } from "./icons";

export default function FeedbackBar({ curatorId }: { curatorId: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [sentiment, setSentiment] = useState<"loved" | "not_my_taste" | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function post(action: string) {
    setPending(action);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curatorId, action }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  function toggleFollow() {
    setFollowing((f) => !f);
    post("followed");
  }

  // Loved and Not-my-taste are mutually exclusive; picking one clears the other.
  function setSentimentAction(next: "loved" | "not_my_taste") {
    setSentiment((prev) => (prev === next ? null : next));
    post(next);
  }

  const btn = (active: boolean) =>
    `flex min-h-[40px] items-center gap-1.5 rounded-pill border px-3.5 text-xs font-semibold transition disabled:opacity-60 ${
      active ? "border-ai-green bg-ai-green text-black" : "border-white/15 text-ai-text hover:border-white/40"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending !== null} onClick={toggleFollow} className={btn(following)}>
        {pending === "followed" ? <Spinner className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" filled={following} />}
        {following ? "Following" : "Follow curator"}
      </button>

      <button
        type="button"
        disabled={pending !== null}
        onClick={() => setSentimentAction("loved")}
        className={btn(sentiment === "loved")}
      >
        {pending === "loved" ? <Spinner className="h-4 w-4" /> : <ThumbUpIcon className="h-4 w-4" filled={sentiment === "loved"} />}
        Loved it
      </button>

      <button
        type="button"
        disabled={pending !== null}
        onClick={() => setSentimentAction("not_my_taste")}
        className={btn(sentiment === "not_my_taste")}
      >
        {pending === "not_my_taste" ? <Spinner className="h-4 w-4" /> : <ThumbDownIcon className="h-4 w-4" filled={sentiment === "not_my_taste"} />}
        Not my taste
      </button>
    </div>
  );
}
