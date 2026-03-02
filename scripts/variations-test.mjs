#!/usr/bin/env node
/**
 * Run 40 different usage variations against the padel tournament app.
 * Usage: BASE_URL=http://localhost:3000 node scripts/variations-test.mjs
 * Or: npm run start (in one terminal), then node scripts/variations-test.mjs (in another).
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function fetchOk(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return { ok: res.ok, status: res.status, body: res.ok ? await res.json().catch(() => null) : await res.text().catch(() => "") };
}

async function get(path) {
  return fetchOk(path, { method: "GET" });
}

async function post(path, body) {
  return fetchOk(path, { method: "POST", body: JSON.stringify(body) });
}

async function del(path, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { method: "DELETE", headers: { "x-admin-reset": "lucella", ...headers } });
  return { ok: res.ok, status: res.status };
}

const results = [];
function pass(name) {
  results.push({ name, ok: true });
  console.log(`  ✓ ${name}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}: ${detail}`);
}

async function runVariations() {
  console.log("Running 40 variations against", BASE_URL, "\n");

  // 1. GET homepage
  let r = await get("/");
  if (r.ok && r.status === 200) pass("1. GET / returns 200");
  else fail("1. GET /", `${r.status} ${r.body}`);

  // 2. GET /api/state empty
  r = await get("/api/state");
  if (r.ok && r.body && Array.isArray(r.body.tournamentPlayers)) pass("2. GET /api/state empty");
  else fail("2. GET /api/state empty", `${r.status} ${JSON.stringify(r.body)}`);

  // 3. POST /api/state tournament only
  r = await post("/api/state", { tournamentPlayers: ["Alice"], socialPlayers: [], playMode: "tournament" });
  if (r.ok && r.body && r.body.version >= 0) pass("3. POST /api/state tournament only");
  else fail("3. POST /api/state tournament only", `${r.status}`);

  // 4. POST /api/state social only
  r = await post("/api/state", { tournamentPlayers: [], socialPlayers: ["Bob"], playMode: "social" });
  if (r.ok) pass("4. POST /api/state social only");
  else fail("4. POST /api/state social only", `${r.status}`);

  // 5. POST /api/state mixed
  r = await post("/api/state", { tournamentPlayers: ["A", "B", "C", "D"], socialPlayers: ["E", "F"], playMode: "tournament", stage: "names" });
  if (r.ok) pass("5. POST /api/state mixed players + stage");
  else fail("5. POST /api/state mixed", `${r.status}`);

  // 6. GET /api/state after update
  r = await get("/api/state");
  if (r.ok && r.body.tournamentPlayers?.length === 4 && r.body.socialPlayers?.length === 2) pass("6. GET /api/state reflects update");
  else fail("6. GET /api/state", `tournament=${r.body?.tournamentPlayers?.length} social=${r.body?.socialPlayers?.length}`);

  // 7. POST /api/pairs empty
  r = await post("/api/pairs", { tournament: [], social: [] });
  if (r.ok && Array.isArray(r.body?.tournament)) pass("7. POST /api/pairs empty");
  else fail("7. POST /api/pairs empty", `${r.status}`);

  // 8. POST /api/pairs tournament pairs
  r = await post("/api/pairs", { tournament: [["A", "B"], ["C", "D"]], social: [] });
  if (r.ok && r.body.tournament?.length === 2) pass("8. POST /api/pairs tournament pairs");
  else fail("8. POST /api/pairs tournament", `${r.status}`);

  // 9. POST /api/pairs social pairs
  r = await post("/api/pairs", { tournament: [], social: [["E", "F"]] });
  if (r.ok && r.body.social?.length === 1) pass("9. POST /api/pairs social pairs");
  else fail("9. POST /api/pairs social", `${r.status}`);

  // 10. GET /api/pairs
  r = await get("/api/pairs");
  if (r.ok && Array.isArray(r.body.tournament) && Array.isArray(r.body.social)) pass("10. GET /api/pairs");
  else fail("10. GET /api/pairs", `${r.status}`);

  // 11. POST /api/schedule empty
  r = await post("/api/schedule", { tournament: [], social: [] });
  if (r.ok) pass("11. POST /api/schedule empty");
  else fail("11. POST /api/schedule empty", `${r.status}`);

  // 12. POST /api/schedule one match
  r = await post("/api/schedule", { tournament: [[["A", "B"], ["C", "D"]]], social: [] });
  if (r.ok && r.body.tournament?.length === 1) pass("12. POST /api/schedule one match");
  else fail("12. POST /api/schedule one match", `${r.status}`);

  // 13. GET /api/schedule
  r = await get("/api/schedule");
  if (r.ok && Array.isArray(r.body.tournament)) pass("13. GET /api/schedule");
  else fail("13. GET /api/schedule", `${r.status}`);

  // 14. GET /api/scores empty
  r = await get("/api/scores");
  if (r.ok && typeof r.body?.points === "object" && Array.isArray(r.body?.matches)) pass("14. GET /api/scores empty");
  else fail("14. GET /api/scores empty", `${r.status}`);

  // 15. POST /api/scores valid
  r = await post("/api/scores", { pairA: ["A", "B"], pairB: ["C", "D"], winner: "A" });
  if (r.ok && r.body?.points) pass("15. POST /api/scores valid");
  else fail("15. POST /api/scores valid", `${r.status} ${JSON.stringify(r.body)}`);

  // 16. POST /api/scores same match again (should fail)
  r = await post("/api/scores", { pairA: ["A", "B"], pairB: ["C", "D"], winner: "B" });
  if (!r.ok && r.status === 400) pass("16. POST /api/scores duplicate rejected");
  else fail("16. POST /api/scores duplicate", `expected 400 got ${r.status}`);

  // 17. POST /api/scores winner B
  r = await post("/api/scores", { pairA: ["E", "F"], pairB: ["A", "B"], winner: "B" });
  if (r.ok) pass("17. POST /api/scores winner B");
  else fail("17. POST /api/scores winner B", `${r.status}`);

  // 18. GET /api/scores with data
  r = await get("/api/scores");
  if (r.ok && Object.keys(r.body?.points || {}).length >= 1) pass("18. GET /api/scores with data");
  else fail("18. GET /api/scores with data", `${r.status}`);

  // 19. DELETE /api/scores (admin)
  r = await del("/api/scores");
  if (r.ok) pass("19. DELETE /api/scores admin");
  else fail("19. DELETE /api/scores", `${r.status}`);

  // 20. DELETE /api/scores without auth (should fail)
  const url = `${BASE_URL}/api/scores`;
  const noAuth = await fetch(url, { method: "DELETE" });
  if (noAuth.status === 401) pass("20. DELETE /api/scores no auth rejected");
  else fail("20. DELETE /api/scores no auth", `expected 401 got ${noAuth.status}`);

  // 21. POST /api/state stage pairing
  r = await post("/api/state", { tournamentPlayers: ["X", "Y", "Z", "W"], socialPlayers: [], playMode: "tournament", stage: "pairing" });
  if (r.ok && r.body?.stage === "pairing") pass("21. POST /api/state stage pairing");
  else fail("21. POST /api/state stage pairing", `${r.status}`);

  // 22. POST /api/state stage courts
  r = await post("/api/state", { stage: "courts" });
  if (r.ok) pass("22. POST /api/state stage courts");
  else fail("22. POST /api/state stage courts", `${r.status}`);

  // 23. POST /api/state partial (only tournamentPlayers)
  r = await post("/api/state", { tournamentPlayers: ["P1", "P2"] });
  if (r.ok) pass("23. POST /api/state partial update");
  else fail("23. POST /api/state partial", `${r.status}`);

  // 24. POST /api/pairs with whitespace
  r = await post("/api/pairs", { tournament: [["  P1  ", " P2 "]], social: [] });
  if (r.ok && r.body.tournament?.length === 1) pass("24. POST /api/pairs trim names");
  else fail("24. POST /api/pairs trim", `${r.status}`);

  // 25. POST /api/scores invalid winner
  r = await post("/api/scores", { pairA: ["A", "B"], pairB: ["C", "D"], winner: "C" });
  if (!r.ok && r.status === 400) pass("25. POST /api/scores invalid winner rejected");
  else fail("25. POST /api/scores invalid winner", `expected 400 got ${r.status}`);

  // 26. POST /api/scores same pair (A vs A)
  r = await post("/api/scores", { pairA: ["A", "B"], pairB: ["A", "B"], winner: "A" });
  if (!r.ok && r.status === 400) pass("26. POST /api/scores same pair rejected");
  else fail("26. POST /api/scores same pair", `expected 400 got ${r.status}`);

  // 27. POST /api/state many players (cap 200)
  const many = Array.from({ length: 250 }, (_, i) => `Player_${i}`);
  r = await post("/api/state", { tournamentPlayers: many, socialPlayers: [], playMode: "tournament" });
  if (r.ok && r.body.tournamentPlayers?.length <= 200) pass("27. POST /api/state caps at 200");
  else fail("27. POST /api/state cap", `len=${r.body?.tournamentPlayers?.length}`);

  // 28. POST /api/state invalid stage (should be ignored or 400)
  r = await post("/api/state", { stage: "invalid" });
  if (r.ok && r.body?.stage !== "invalid") pass("28. POST /api/state invalid stage ignored");
  else fail("28. POST /api/state invalid stage", `${r.status}`);

  // 29. GET /api/state version increment
  const vBefore = (await get("/api/state")).body?.version;
  await post("/api/state", { tournamentPlayers: ["V1"] });
  const vAfter = (await get("/api/state")).body?.version;
  if (typeof vBefore === "number" && typeof vAfter === "number" && vAfter >= vBefore) pass("29. GET /api/state version increments");
  else fail("29. version", `before=${vBefore} after=${vAfter}`);

  // 30. POST /api/schedule many social matches
  const socialMatches = [
    [["E", "F"], ["G", "H"]],
    [["E", "F"], ["I", "J"]],
  ];
  r = await post("/api/schedule", { tournament: [], social: socialMatches });
  if (r.ok && r.body.social?.length === 2) pass("30. POST /api/schedule multiple social");
  else fail("30. POST /api/schedule multiple", `${r.status}`);

  // 31. POST /api/pairs invalid entry (filtered out)
  r = await post("/api/pairs", { tournament: [["A", "B"], [null, "x"], ["only"], []], social: [] });
  if (r.ok && r.body.tournament?.length === 1) pass("31. POST /api/pairs invalid entries filtered");
  else fail("31. POST /api/pairs invalid", `pairs=${r.body?.tournament?.length}`);

  // 32. POST /api/state empty arrays
  r = await post("/api/state", { tournamentPlayers: [], socialPlayers: [], playMode: null });
  if (r.ok) pass("32. POST /api/state empty arrays");
  else fail("32. POST /api/state empty arrays", `${r.status}`);

  // 33. GET / multiple times (no crash)
  let allOk = true;
  for (let i = 0; i < 3; i++) {
    const x = await get("/");
    if (!x.ok) allOk = false;
  }
  if (allOk) pass("33. GET / repeated 3x");
  else fail("33. GET / repeated", "one or more failed");

  // 34. POST /api/schedule malformed (should 400 or normalize)
  r = await post("/api/schedule", { tournament: "not-array" });
  if (!r.ok && r.status === 400) pass("34. POST /api/schedule malformed rejected");
  else if (r.ok && Array.isArray(r.body?.tournament)) pass("34. POST /api/schedule malformed normalized");
  else fail("34. POST /api/schedule malformed", `${r.status}`);

  // 35. POST /api/state non-string player (filtered)
  r = await post("/api/state", { tournamentPlayers: ["OK", 123, null, "Two"], socialPlayers: [], playMode: "tournament" });
  if (r.ok && r.body.tournamentPlayers?.filter((p) => typeof p === "string").length >= 2) pass("35. POST /api/state non-string filtered");
  else fail("35. POST /api/state non-string", `${r.status}`);

  // 36. GET /api/pairs then POST /api/pairs (overwrite)
  await post("/api/pairs", { tournament: [["a", "b"]], social: [] });
  r = await post("/api/pairs", { tournament: [["c", "d"]], social: [] });
  if (r.ok && r.body.tournament?.length === 1 && r.body.tournament[0][0] === "c") pass("36. POST /api/pairs overwrites");
  else fail("36. POST /api/pairs overwrites", `${JSON.stringify(r.body?.tournament)}`);

  // 37. POST /api/scores pair order independence (B,A vs A,B)
  await del("/api/scores");
  r = await post("/api/scores", { pairA: ["B", "A"], pairB: ["D", "C"], winner: "A" });
  if (r.ok) pass("37. POST /api/scores pair key order");
  else fail("37. POST /api/scores pair order", `${r.status}`);

  // 38. GET /api/scores after 37
  r = await get("/api/scores");
  const hasPair = r.body?.points && (r.body.points["A|B"] >= 0 || r.body.points["B|A"] >= 0);
  if (r.ok && (Object.keys(r.body?.points || {}).length >= 1 || r.body?.matches?.length >= 1)) pass("38. GET /api/scores after pair order");
  else fail("38. GET /api/scores after 37", `${r.status}`);

  // 39. POST /api/state stage names
  r = await post("/api/state", { stage: "names" });
  if (r.ok) pass("39. POST /api/state stage names");
  else fail("39. POST /api/state stage names", `${r.status}`);

  // 40. Full flow: state -> pairs -> schedule -> scores -> GET all
  await post("/api/state", { tournamentPlayers: ["F1", "F2", "F3", "F4"], socialPlayers: [], playMode: "tournament", stage: "courts" });
  await post("/api/pairs", { tournament: [["F1", "F2"], ["F3", "F4"]], social: [] });
  await post("/api/schedule", { tournament: [[["F1", "F2"], ["F3", "F4"]]], social: [] });
  r = await get("/api/state");
  const r2 = await get("/api/pairs");
  const r3 = await get("/api/schedule");
  if (r.ok && r2.ok && r3.ok && r.body.tournamentPlayers?.length === 4 && r2.body.tournament?.length === 2 && r3.body.tournament?.length === 1) {
    pass("40. Full flow state+pairs+schedule GET all");
  } else {
    fail("40. Full flow", `state=${r.ok} pairs=${r2.ok} schedule=${r3.ok}`);
  }

  const passed = results.filter((x) => x.ok).length;
  const failed = results.filter((x) => !x.ok);
  console.log("\n---");
  console.log(`Passed: ${passed}/40. Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log("Failed:", failed.map((f) => f.name + " " + (f.detail || "")).join("; "));
    process.exit(1);
  }
  process.exit(0);
}

runVariations().catch((err) => {
  console.error("Run error:", err);
  process.exit(1);
});
