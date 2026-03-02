#!/usr/bin/env node
/**
 * 40 variation tests: POST state/pairs/schedule then simulate refresh (GET) and verify
 * names and pairs are not lost. Ensures the site works without glitches after refresh.
 * Usage: BASE_URL=http://localhost:3000 node scripts/refresh-test.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const RUNS = 40;

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

function randomNames(n, runId) {
  const prefix = `Run${runId}_`;
  const names = [];
  const used = new Set();
  while (names.length < n) {
    const name = `${prefix}P${randomInt(1, 99999)}`;
    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
  }
  return names;
}

function createPairs(names) {
  const sh = shuffle(names);
  const pairs = [];
  for (let i = 0; i + 1 < sh.length; i += 2) {
    pairs.push([sh[i], sh[i + 1]]);
  }
  return pairs;
}

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return res;
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const as = [...a].sort();
  const bs = [...b].sort();
  return as.every((x, i) => x === bs[i]);
}

function pairsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const norm = (p) => (Array.isArray(p) && p.length >= 2 ? [String(p[0]).trim(), String(p[1]).trim()].sort().join("|") : "");
  const as = a.map(norm).sort();
  const bs = b.map(norm).sort();
  return as.every((x, i) => x === bs[i]);
}

async function runOne(runId) {
  const errors = [];
  // Variation: 2–40 players, tournament-only, social-only, or mixed
  const mode = runId % 3; // 0=tournament only, 1=social only, 2=mixed
  const n = randomInt(2, 40);
  const nT = mode === 1 ? 0 : mode === 2 ? randomInt(1, n - 1) : n;
  const nS = mode === 0 ? 0 : mode === 2 ? n - nT : n;
  const tournamentNames = nT ? randomNames(nT, runId * 2) : [];
  const socialNames = nS ? randomNames(nS, runId * 2 + 1) : [];
  const allNames = [...tournamentNames, ...socialNames];
  if (allNames.length === 0) return { runId, ok: true };

  const tournamentPairs = createPairs(tournamentNames);
  const socialPairs = createPairs(socialNames);

  // POST state
  const stateBody = {
    tournamentPlayers: tournamentNames,
    socialPlayers: socialNames,
    playMode: tournamentNames.length && socialNames.length ? "tournament" : tournamentNames.length ? "tournament" : "social",
    stage: runId % 5 === 0 ? "courts" : runId % 5 === 1 ? "pairing" : "names",
  };
  const postState = await api("/api/state", { method: "POST", body: JSON.stringify(stateBody) });
  if (!postState.ok) {
    errors.push(`state POST ${postState.status}`);
    return { runId, ok: false, errors };
  }

  // POST pairs
  const pairsBody = { tournament: tournamentPairs, social: socialPairs };
  const postPairs = await api("/api/pairs", { method: "POST", body: JSON.stringify(pairsBody) });
  if (!postPairs.ok) {
    errors.push(`pairs POST ${postPairs.status}`);
    return { runId, ok: false, errors };
  }

  // Optional: POST schedule (when we have pairs)
  if (tournamentPairs.length + socialPairs.length > 0 && stateBody.stage === "courts") {
    const scheduleT = tournamentPairs.flatMap((_, i) =>
      tournamentPairs.slice(i + 1).map((p2) => ({ pairA: tournamentPairs[i], pairB: p2 }))
    );
    const scheduleS = socialPairs.flatMap((_, i) =>
      socialPairs.slice(i + 1).map((p2) => ({ pairA: socialPairs[i], pairB: p2 }))
    );
    const scheduleBody = {
      tournament: scheduleT.map((m) => [m.pairA, m.pairB]),
      social: scheduleS.map((m) => [m.pairA, m.pairB]),
    };
    const postSchedule = await api("/api/schedule", { method: "POST", body: JSON.stringify(scheduleBody) });
    if (!postSchedule.ok) errors.push(`schedule POST ${postSchedule.status}`);
  }

  // Simulate refresh: GET state, GET pairs (and GET schedule if we posted it)
  const getState = await api("/api/state");
  if (!getState.ok) {
    errors.push(`state GET ${getState.status}`);
    return { runId, ok: false, errors };
  }
  const stateData = await getState.json();
  const gotTournament = Array.isArray(stateData.tournamentPlayers) ? stateData.tournamentPlayers.filter((p) => typeof p === "string") : [];
  const gotSocial = Array.isArray(stateData.socialPlayers) ? stateData.socialPlayers.filter((p) => typeof p === "string") : [];
  if (!arraysEqual(gotTournament, tournamentNames)) {
    errors.push(`state tournament mismatch: expected ${tournamentNames.length}, got ${gotTournament.length}`);
  }
  if (!arraysEqual(gotSocial, socialNames)) {
    errors.push(`state social mismatch: expected ${socialNames.length}, got ${gotSocial.length}`);
  }

  const getPairs = await api("/api/pairs");
  if (!getPairs.ok) {
    errors.push(`pairs GET ${getPairs.status}`);
    return { runId, ok: false, errors };
  }
  const pairsData = await getPairs.json();
  const gotT = Array.isArray(pairsData.tournament) ? pairsData.tournament : [];
  const gotS = Array.isArray(pairsData.social) ? pairsData.social : [];
  if (!pairsEqual(gotT, tournamentPairs)) {
    errors.push(`pairs tournament mismatch: expected ${tournamentPairs.length}, got ${gotT.length}`);
  }
  if (!pairsEqual(gotS, socialPairs)) {
    errors.push(`pairs social mismatch: expected ${socialPairs.length}, got ${gotS.length}`);
  }

  return {
    runId,
    ok: errors.length === 0,
    errors: errors.length ? errors : undefined,
    n: allNames.length,
    mode: mode === 0 ? "tournament" : mode === 1 ? "social" : "mixed",
  };
}

async function main() {
  console.log(`Running ${RUNS} refresh/variation tests against ${BASE_URL}...\n`);
  const results = [];
  for (let r = 1; r <= RUNS; r++) {
    try {
      const result = await runOne(r);
      results.push(result);
      const icon = result.ok ? "✓" : "✗";
      const info = result.n != null ? ` n=${result.n} ${result.mode || ""}` : "";
      if (!result.ok || r % 10 === 0) {
        console.log(`  ${String(r).padStart(2)} ${icon}${info}${result.errors ? " " + result.errors.join("; ") : ""}`);
      }
    } catch (err) {
      results.push({ runId: r, ok: false, errors: [String(err.message)] });
      console.log(`  ${String(r).padStart(2)} ✗ ${err.message}`);
    }
  }
  const passed = results.filter((x) => x.ok).length;
  const failed = results.filter((x) => !x.ok);
  console.log(`\n--- Summary ---\nPassed: ${passed}/${RUNS}`);
  if (failed.length > 0) {
    const failedStr = failed.map((f) => f.runId + (f.errors ? " (" + f.errors.join("; ") + ")" : "")).join(", ");
    console.log("Failed:", failedStr);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
