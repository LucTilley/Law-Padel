#!/usr/bin/env node
/**
 * Load test: 100 runs. Each run:
 * - 30–40 people, add names (state), create pairs, submit scores so each pair plays every other pair once (round-robin).
 * Usage: BASE_URL=http://localhost:3000 node scripts/load-test.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_PASSWORD = "lucella";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate n unique names like "User_1", "User_2", ... with optional run prefix to avoid collisions across runs */
function randomNames(n, runId) {
  const prefix = runId != null ? `R${runId}_` : "";
  const names = [];
  const used = new Set();
  while (names.length < n) {
    const name = `${prefix}User_${randomInt(1, 100000)}`;
    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
  }
  return names;
}

/** Create tournament pairs from a list of names (odd one out sits in waiting). Pairs are [string, string][]. */
function createPairs(names) {
  const shuffled = shuffle(names);
  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }
  return pairs;
}

function pairKey(pair) {
  const [a, b] = pair.map((s) => String(s).trim()).filter(Boolean);
  return [a, b].sort().join("|");
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return res;
}

async function resetScores() {
  const res = await api("/api/scores", {
    method: "DELETE",
    headers: { "x-admin-reset": ADMIN_PASSWORD },
  });
  if (!res.ok) throw new Error(`Reset scores failed: ${res.status}`);
}

async function setState(tournamentPlayers, playMode = "tournament", stage = "pairing") {
  const res = await api("/api/state", {
    method: "POST",
    body: JSON.stringify({
      tournamentPlayers,
      socialPlayers: [],
      playMode,
      stage,
    }),
  });
  if (!res.ok) throw new Error(`State POST failed: ${res.status}`);
  return res.json();
}

async function setPairs(tournamentPairs, socialPairs = []) {
  const res = await api("/api/pairs", {
    method: "POST",
    body: JSON.stringify({ tournament: tournamentPairs, social: socialPairs }),
  });
  if (!res.ok) throw new Error(`Pairs POST failed: ${res.status}`);
  return res.json();
}

async function addScore(pairA, pairB, winner) {
  const res = await api("/api/scores", {
    method: "POST",
    body: JSON.stringify({ pairA, pairB, winner }),
  });
  if (!res.ok) throw new Error(`Scores POST failed: ${res.status}`);
  return res.json();
}

async function getScores() {
  const res = await api("/api/scores");
  if (!res.ok) throw new Error(`Scores GET failed: ${res.status}`);
  return res.json();
}

/** Run one full scenario: 30–40 people, pairs, round-robin (each pair plays each other once). */
async function runOne(runId) {
  const n = randomInt(30, 40);
  const names = randomNames(n, runId);
  const pairs = createPairs(names);
  const P = pairs.length;
  const expectedMatches = (P * (P - 1)) / 2;

  await resetScores();
  await setState(names, "tournament", "pairing");
  await setPairs(pairs, []);

  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const winner = Math.random() < 0.5 ? "A" : "B";
      await addScore(pairs[i], pairs[j], winner);
    }
  }

  const { matches } = await getScores();
  const matchCount = Array.isArray(matches) ? matches.length : 0;
  const ok = matchCount === expectedMatches;

  return {
    runId,
    people: n,
    pairsCount: P,
    expectedMatches,
    matchCount,
    ok,
  };
}

async function main() {
  const totalRuns = 100;
  const results = [];
  console.log(`Running ${totalRuns} tests against ${BASE_URL} (30–40 people per run, round-robin scores)...\n`);

  for (let r = 1; r <= totalRuns; r++) {
    try {
      const result = await runOne(r);
      results.push(result);
      const icon = result.ok ? "✓" : "✗";
      if (r % 10 === 0 || !result.ok) {
        console.log(`  Run ${String(r).padStart(3)} ${icon} people=${result.people} pairs=${result.pairsCount} matches=${result.matchCount}/${result.expectedMatches}`);
      }
    } catch (err) {
      results.push({ runId: r, ok: false, error: String(err.message) });
      console.log(`  Run ${String(r).padStart(3)} ✗ ERROR: ${err.message}`);
    }
  }

  const passed = results.filter((x) => x.ok).length;
  const failed = results.filter((x) => !x.ok);
  console.log(`\n--- Summary ---`);
  console.log(`Passed: ${passed}/${totalRuns}`);
  if (failed.length > 0) {
    console.log(`Failed runs: ${failed.map((f) => f.runId + (f.error ? ` (${f.error})` : "")).join(", ")}`);
  }
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
