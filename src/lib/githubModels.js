// GitHub Models provider — a separate free quota from Groq (10 req/min, 50/day
// on the good models), so it works as a genuine cross-provider fallback when
// Groq's daily token cap is drained. OpenAI-compatible endpoint.
// Auth: a GitHub PAT (fine-grained, `models: read` permission) in GITHUB_MODELS_TOKEN.

const ENDPOINT = "https://models.github.ai/inference/chat/completions";
const DEFAULT_MODEL = "meta/Llama-3.3-70B-Instruct";

// Not every catalog model honors response_format json_object, so we don't rely
// on it — instead we extract the first balanced JSON object from the reply.
function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object in response");
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function githubModelsJSON(prompt, { model = DEFAULT_MODEL, temperature = 0.7 } = {}) {
  const token = process.env.GITHUB_MODELS_TOKEN;
  if (!token) throw new Error("Missing GITHUB_MODELS_TOKEN");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub Models error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return extractJSON(content);
}

module.exports = { githubModelsJSON };
