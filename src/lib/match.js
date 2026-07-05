const { groqJSON } = require("./groq");
const { githubModelsJSON } = require("./githubModels");

// Live ranking runs through a provider chain, tried in order until one returns.
// Speed-first ordering: each entry is also a separate quota bucket, so draining
// one doesn't take the feature down — the next still has budget.
//   1. Groq 8B   — fastest (sub-second) and the largest Groq daily budget.
//   2. Groq 70B  — richer prose; slower and first to hit its daily token cap.
//   3. GitHub Models 70B — separate free quota (slowest infra; last-resort only).
const PROVIDER_CHAIN = [
  { label: "groq-8b", call: (p) => groqJSON(p, { model: "llama-3.1-8b-instant", temperature: 0.7, retries: 0 }) },
  { label: "groq-70b", call: (p) => groqJSON(p, { model: "llama-3.3-70b-versatile", temperature: 0.7, retries: 0 }) },
  { label: "github-70b", call: (p) => githubModelsJSON(p, { temperature: 0.7 }) },
];

function summarizeDNA(dna) {
  if (!dna) return "(no taste profile available)";
  return `${dna.paragraph} Descriptors: ${(dna.bullets ?? []).join(", ")}. Genres/moods: ${(dna.genres ?? []).join(", ")}.`;
}

function buildFeedbackNote(feedback, curators) {
  const entries = feedback?.entries ?? [];
  if (entries.length === 0) return "";

  const named = entries.map((e) => {
    const curator = curators.find((c) => c.id === e.curatorId);
    return curator ? `${curator.name} (${e.action})` : null;
  }).filter(Boolean);

  if (named.length === 0) return "";
  return `\nPast feedback from this listener (weigh this into ranking — favor curators similar to loved/followed ones, avoid ones similar to disliked ones): ${named.join(", ")}.\n`;
}

// Compact per-curator line: bullets + genres only, no paragraph. With 42
// curators the full-paragraph version blows past Groq free tier's
// tokens-per-minute budget (~12k TPM) in one or two calls.
function shortDNA(dna) {
  if (!dna) return "(no profile)";
  return `${(dna.bullets ?? []).slice(0, 3).join("; ")} | ${(dna.genres ?? []).join(", ")}`;
}

function buildRankingPrompt({ userDNA, curators, curatorDNAs, feedback }) {
  const curatorLines = curators
    .map((c) => `- id: ${c.id} | "${c.name}" | ${shortDNA(curatorDNAs[c.id])}`)
    .join("\n");

  return `You are the matching engine for a music discovery product. It connects a listener to human curators whose taste fits — or leads — theirs. This is NOT a "more of the same" recommender: the whole point is discovery, so each match reason must emphasize DIRECTION (where this curator can take the listener next) rather than mere similarity (how alike they already are).

Listener's Taste DNA:
${summarizeDNA(userDNA)}
${buildFeedbackNote(feedback, curators)}
Available curators:
${curatorLines}

Pick the best 8 curators for this listener, ranked best-first (strictly descending matchPercent — the 1st is the strongest fit, the 8th the weakest of the eight). For each, write a punchy 2-sentence reason that names something specific the listener already likes AND where this curator leads beyond it — not "this curator is similar to you" but "you've been leaning into X; this curator lives one step further into that space and consistently surfaces Y." Keep each reason under 45 words.

Respond with STRICT JSON only, no markdown, in this exact shape:
{
  "matches": [
    { "curatorId": "string, must be one of the ids listed above", "matchPercent": number (0-100), "reason": "one paragraph, forward-looking" }
  ]
}`;
}

async function runChain(prompt) {
  let lastError;
  for (const provider of PROVIDER_CHAIN) {
    try {
      return await provider.call(prompt);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

async function getCuratorMatches({ userDNA, curators, curatorDNAs, feedback }) {
  const prompt = buildRankingPrompt({ userDNA, curators, curatorDNAs, feedback });
  const result = await runChain(prompt);

  const validIds = new Set(curators.map((c) => c.id));
  const matches = (result.matches ?? []).filter((m) => validIds.has(m.curatorId));

  return matches.map((m) => ({
    ...m,
    curator: curators.find((c) => c.id === m.curatorId),
  }));
}

// Live, per-curator explanation: Groq compares the listener's taste DNA against
// this curator's taste DNA and names the specific overlap + where it leads.
async function explainMatch({ userDNA, curatorDNA, curatorName }) {
  const prompt = `You are a music taste analyst. Compare a listener and a curator by their taste "DNA".

Listener's taste DNA: ${summarizeDNA(userDNA)}
Curator "${curatorName}" taste DNA: ${summarizeDNA(curatorDNA)}

In exactly 2 sentences, addressed to the listener as "you", name the SPECIFIC overlap between your taste and this curator's, then where this curator can lead you next (discovery, not just similarity). Under 45 words.

Respond as STRICT JSON: {"message": "..."}`;

  const result = await runChain(prompt);
  const message = typeof result.message === "string" ? result.message.trim() : "";
  if (!message) throw new Error("Empty explanation");
  return message;
}

module.exports = { getCuratorMatches, explainMatch };
