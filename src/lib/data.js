const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");

function readJSON(filename, fallback) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getUserProfile() {
  return readJSON("user_profile.json", null);
}

function getCurators() {
  return readJSON("curators.json", []);
}

function getTasteDNA() {
  return readJSON("taste_dna.json", null);
}

function getFeedback() {
  return readJSON("feedback.json", { entries: [] });
}

function saveFeedback(feedback) {
  fs.writeFileSync(path.join(DATA_DIR, "feedback.json"), JSON.stringify(feedback, null, 2));
}

// The ordered baseline matches (as shown on the home deck). Used by the curator
// screen to offer "next best match" navigation in the same ranked order.
function getCachedMatches() {
  const cache = readJSON("matches_cache.json", null);
  return cache?.matches ?? [];
}

module.exports = { getUserProfile, getCurators, getTasteDNA, getFeedback, saveFeedback, getCachedMatches };
