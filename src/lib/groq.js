function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function groqJSON(prompt, { model = "llama-3.1-8b-instant", temperature = 0.6, retries = 2, maxTokens = 1400 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature,
        // LLM latency is dominated by output tokens; capping keeps live calls fast.
        max_tokens: maxTokens,
      }),
    });

    if (res.status === 429) {
      // Don't sleep when out of attempts, and never sleep longer than 10s —
      // Groq's retry-after can be minutes when a daily token cap is hit,
      // which would otherwise hang callers (and serverless functions).
      if (attempt === retries) {
        throw new Error(`Groq rate limited (retry-after ${res.headers.get("retry-after")}s)`);
      }
      const retryAfter = Math.min(Number(res.headers.get("retry-after") ?? "2"), 10);
      await sleep((retryAfter + 1) * 1000);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Groq error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    try {
      return JSON.parse(content);
    } catch {
      if (attempt === retries) {
        throw new Error(`Malformed JSON from Groq after ${retries + 1} attempts: ${content.slice(0, 200)}`);
      }
    }
  }
  throw new Error("Groq request exhausted retries (rate limited)");
}

module.exports = { groqJSON };
