import { NextRequest, NextResponse } from "next/server";
import { getFeedback, saveFeedback } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const curatorId = body?.curatorId;
  const action = body?.action;

  if (typeof curatorId !== "string" || typeof action !== "string") {
    return NextResponse.json({ error: "Missing curatorId or action" }, { status: 400 });
  }

  const feedback = getFeedback();
  feedback.entries = feedback.entries ?? [];
  feedback.entries.push({ curatorId, action, at: new Date().toISOString() });
  saveFeedback(feedback);

  return NextResponse.json({ ok: true });
}
