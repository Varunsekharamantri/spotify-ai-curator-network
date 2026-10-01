import { NextResponse } from "next/server";
import { groqHealth } from "@/lib/groq";

export const dynamic = "force-dynamic";

// Deep check: makes a tiny live Groq call. 503 if the key or every model is broken.
export async function GET() {
  const result = await groqHealth();
  return NextResponse.json(result, {
    status: result.status === "error" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
