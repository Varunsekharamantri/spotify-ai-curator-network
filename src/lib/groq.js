// Groq JSON helper that survives model retirements.
// Groq retired llama-3.1-8b-instant and llama-3.3-70b-versatile on 2026-08-16
// (console.groq.com/docs/deprecations). Instead of hardcoding one model, we ask
// Groq which models are live (cached ~1h), try the caller's preferred ones first,
// then fall back to any other live chat model. Override with GROQ_MODEL.

const BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"];
const NOT_CHAT = ["whisper", "tts", "orpheus", "guard", "safeguard", "embed", "playai", "compound"];
const CACHE_MS = 60 * 60 * 1000;

let liveCache = { at: 0, ids: null };
let lastUsedModel = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey() {
  const key = process.env.GROQ_API_KEY || process.env.API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");
  return key;
}

async function liveModels(apiKey) {
  if (liveCache.ids && Date.now() - liveCache.at < CACHE_MS) return liveCache.ids;
  try {
    const res = await fetch(`${BASE_URL}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return liveCache.ids;
    const body = await res.json();
    const ids = (body.data ?? []).map((m) => m.id);
    liveCache = { at: Date.now(), ids };
    return ids;
  } catch {
    return liveCache.ids;
  }
}

function rank(id) {
  const m = id.toLowerCase();
  return m.includes("gpt-oss") ? 0 : m.includes("llama") ? 1 : m.includes("qwen") ? 2 : 3;
}

async function modelCandidates(apiKey, preferred = DEFAULT_MODELS) {
  const override = (process.env.GROQ_MODEL || "").trim();
  const wanted = [...(override ? [override] : []), ...preferred, ...DEFAULT_MODELS].filter(
    (m, i, a) => a.indexOf(m) === i
  );
  const live = await liveModels(apiKey);
  if (!live || live.length === 0) return wanted;
  const chosen = wanted.filter((m) => live.includes(m));
  const others = live
    .filter((m) => !chosen.includes(m) && !NOT_CHAT.some((t) => m.toLowerCase().includes(t)))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return [...chosen, ...others];
}

function isRetiredModelError(status, text) {
  return status === 404 || (status === 400 && /decommission|model_not_found|does not exist|not supported/i.test(text));
}

async function groqJSON(
  prompt,
  { models, temperature = 0.6, retries = 2, maxTokens = 1400 } = {}
) {
  const apiKey = getApiKey();
  const candidates = (await modelCandidates(apiKey, models)).slice(0, 6);
  let lastError = new Error("No usable Groq model available");

  for (const model of candidates) {
    const isReasoning = model.startsWith("openai/gpt-oss");
    for (let attempt = 0; attempt <= retries; attempt++) {
      const body = {
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature,
        // LLM latency is dominated by output tokens; capping keeps live calls fast.
        // Reasoning models spend part of the budget thinking, so give them headroom.
        max_tokens: isReasoning ? maxTokens + 1500 : maxTokens,
      };
      if (isReasoning) body.reasoning_effort = "low";

      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      if (res.status === 401 || res.status === 403) {
        throw new Error("Groq rejected the key (invalid, expired or revoked). Create a new key and update GROQ_API_KEY.");
      }
      if (!res.ok) {
        const text = (await res.text()).slice(0, 300);
        lastError = new Error(`Groq error ${res.status} (${model}): ${text}`);
        if (isRetiredModelError(res.status, text)) {
          liveCache.at = 0; // re-discover live models next call
          break; // try the next model
        }
        throw lastError;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = JSON.parse(content);
        lastUsedModel = model;
        return parsed;
      } catch {
        lastError = new Error(`Malformed JSON from Groq (${model}): ${content.slice(0, 200)}`);
        if (attempt === retries) break;
      }
    }
  }
  throw lastError;
}

// Tiny live call for health checks. status: ok | degraded | error.
async function groqHealth() {
  try {
    await groqJSON('Reply with the JSON {"ok": true}', { retries: 0, maxTokens: 50, temperature: 0 });
  } catch (err) {
    return { status: "error", groq: String(err.message || err) };
  }
  const want = (process.env.GROQ_MODEL || "").trim() || DEFAULT_MODELS[0];
  if (lastUsedModel !== want) {
    return { status: "degraded", groq: `Working, but preferred model '${want}' is unavailable; using '${lastUsedModel}'.` };
  }
  return { status: "ok", groq: `Groq key accepted; using '${lastUsedModel}'.` };
}

module.exports = { groqJSON, groqHealth };
