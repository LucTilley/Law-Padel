"use client";

import React, { useEffect, useState, useCallback } from "react";

const PAIRS_STORAGE_KEY = "lawx-padel-pairs";

export type PairsData = {
  tournament: [string, string][];
  social: [string, string][];
};

function loadPairsFromStorage(): PairsData {
  if (typeof window === "undefined")
    return { tournament: [], social: [] };
  try {
    const raw = window.localStorage.getItem(PAIRS_STORAGE_KEY);
    if (!raw) return { tournament: [], social: [] };
    const parsed = JSON.parse(raw);
    return {
      tournament: Array.isArray(parsed.tournament) ? parsed.tournament : [],
      social: Array.isArray(parsed.social) ? parsed.social : [],
    };
  } catch {
    return { tournament: [], social: [] };
  }
}

function savePairsToStorage(pairs: PairsData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify(pairs));
  } catch {
    // ignore
  }
}

const COURT_NAMES = ["C7", "C8", "C9", "C10", "C11"] as const;
const MAX_PER_COURT = 4;
const ADMIN_PASSWORD = "lucella";

type CourtPair = [[string, string], [string, string]];

function CourtsView({
  tournamentPlayers,
  socialPlayers,
  getCourtAssignment,
  isAdmin,
  removePlayer,
  movePlayer,
  onBackToLineup,
}: {
  tournamentPlayers: string[];
  socialPlayers: string[];
  getCourtAssignment: () => {
    tournamentCourts: CourtPair[];
    socialCourts: CourtPair[];
    tournamentWaiting: string[];
    socialWaiting: string[];
    tournamentCourtLabels: string[];
    socialCourtLabels: string[];
  };
  isAdmin: boolean;
  removePlayer: (player: string, from: "tournament" | "social") => void;
  movePlayer: (player: string, from: "tournament" | "social", to: "tournament" | "social") => void;
  onBackToLineup: () => void;
}) {
  const {
    tournamentCourts,
    socialCourts,
    tournamentWaiting,
    socialWaiting,
    tournamentCourtLabels,
    socialCourtLabels,
  } = getCourtAssignment();

  function PlayerRow({
    player,
    from,
    badge,
  }: {
    player: string;
    from: "tournament" | "social";
    badge: React.ReactNode;
  }) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-900/50 px-2.5 py-1.5 text-sm text-slate-100">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {badge}
          <span className="truncate font-medium">{player}</span>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => movePlayer(player, from, from === "tournament" ? "social" : "tournament")}
              className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-700/80 hover:text-slate-200"
            >
              {from === "tournament" ? "→ Social" : "→ Tourn."}
            </button>
            <button
              type="button"
              onClick={() => removePlayer(player, from)}
              className="rounded p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
              aria-label={`Remove ${player}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </li>
    );
  }

  const tournamentBadge = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/70 to-cyan-400/70 text-[10px] font-bold text-slate-950" />
  );
  const socialBadge = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-500/80 to-slate-300/80 text-[10px] font-bold text-slate-950" />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToLineup}
          className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition hover:text-emerald-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to lineup
        </button>
        <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400">
          Courts: {COURT_NAMES.join(", ")}
        </span>
      </div>

      <div className="space-y-5">
        {/* Tournament courts */}
        {tournamentCourtLabels.length > 0 && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/85">
              Tournament courts
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tournamentCourts.map((court, i) => {
                const label = tournamentCourtLabels[i] ?? `T${i + 1}`;
                const [sideA, sideB] = court;
                return (
                  <div
                    key={label}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"
                  >
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                      Court {label}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-emerald-500/20 bg-slate-800/50 px-2.5 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">Side A</span>
                        <span className="text-sm font-medium text-slate-100">{sideA[0]} & {sideA[1]}</span>
                      </div>
                      <span className="hidden shrink-0 text-slate-500 sm:inline">vs</span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-emerald-500/20 bg-slate-800/50 px-2.5 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">Side B</span>
                        <span className="text-sm font-medium text-slate-100">{sideB[0]} & {sideB[1]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {tournamentWaiting.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-200/90">
                  Waiting for court (Tournament)
                </p>
                <ul className="space-y-1.5">
                  {tournamentWaiting.map((player) => (
                    <PlayerRow
                      key={player}
                      player={player}
                      from="tournament"
                      badge={tournamentBadge}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Social courts */}
        {socialCourtLabels.length > 0 && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300/85">
              Social play courts
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {socialCourts.map((court, i) => {
                const label = socialCourtLabels[i] ?? `S${i + 1}`;
                const [sideA, sideB] = court;
                return (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-600/50 bg-slate-800/30 p-3"
                  >
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-200/90">
                      Court {label}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-slate-600/50 bg-slate-800/50 px-2.5 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Side A</span>
                        <span className="text-sm font-medium text-slate-100">{sideA[0]} & {sideA[1]}</span>
                      </div>
                      <span className="hidden shrink-0 text-slate-500 sm:inline">vs</span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-slate-600/50 bg-slate-800/50 px-2.5 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Side B</span>
                        <span className="text-sm font-medium text-slate-100">{sideB[0]} & {sideB[1]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {socialWaiting.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-200/90">
                  Waiting for court (Social)
                </p>
                <ul className="space-y-1.5">
                  {socialWaiting.map((player) => (
                    <PlayerRow
                      key={player}
                      player={player}
                      from="social"
                      badge={socialBadge}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tournamentPlayers.length === 0 && socialPlayers.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/70 px-4 py-6 text-center text-xs text-slate-400">
            No players. Go back and add names.
          </div>
        )}
      </div>
    </div>
  );
}

type Step = 1 | 2 | 3;
type Stage = "names" | "pairing" | "courts";

function PairingView({
  tournamentPlayers,
  socialPlayers,
  pairs,
  onPairsChange,
  onViewCourts,
  isAdmin,
}: {
  tournamentPlayers: string[];
  socialPlayers: string[];
  pairs: PairsData;
  onPairsChange: (pairs: PairsData) => void;
  onViewCourts: () => void;
  isAdmin: boolean;
}) {
  const [tournamentPair, setTournamentPair] = useState<[string, string]>(["", ""]);
  const [socialPair, setSocialPair] = useState<[string, string]>(["", ""]);

  const pairedTournament = new Set(
    pairs.tournament.flat(),
  );
  const pairedSocial = new Set(pairs.social.flat());
  const unpairedTournament = tournamentPlayers.filter((p) => !pairedTournament.has(p));
  const unpairedSocial = socialPlayers.filter((p) => !pairedSocial.has(p));

  function addPair(list: "tournament" | "social", a: string, b: string) {
    if (!a || !b || a === b) return;
    const [x, y] = a < b ? [a, b] : [b, a];
    const next = { ...pairs };
    if (list === "tournament") {
      if (pairedTournament.has(x) || pairedTournament.has(y)) return;
      next.tournament = [...next.tournament, [x, y]];
      setTournamentPair(["", ""]);
    } else {
      if (pairedSocial.has(x) || pairedSocial.has(y)) return;
      next.social = [...next.social, [x, y]];
      setSocialPair(["", ""]);
    }
    onPairsChange(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400">
        Pair names within each list. Everyone can create or remove pairs; changes are visible to all.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {/* Tournament list + pairing */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/85">
            Tournament players
          </p>
          <ul className="scroll-smooth-area mb-3 max-h-48 space-y-1 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2">
            {tournamentPlayers.length === 0 ? (
              <li className="text-[11px] text-slate-500">No tournament players</li>
            ) : (
              tournamentPlayers.map((p) => (
                <li key={p} className="text-sm text-slate-200">
                  {p}
                  {pairedTournament.has(p) && (
                    <span className="ml-2 text-[10px] text-emerald-400">(paired)</span>
                  )}
                </li>
              ))
            )}
          </ul>
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              value={tournamentPair[0]}
              onChange={(e) => setTournamentPair((prev) => [e.target.value, prev[1]])}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">Select first</option>
              {unpairedTournament.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="text-slate-500">+</span>
            <select
              value={tournamentPair[1]}
              onChange={(e) => setTournamentPair((prev) => [prev[0], e.target.value])}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">Select second</option>
              {unpairedTournament.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addPair("tournament", tournamentPair[0], tournamentPair[1])}
              disabled={!tournamentPair[0] || !tournamentPair[1] || tournamentPair[0] === tournamentPair[1]}
              className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200 disabled:opacity-50"
            >
              Pair (tournament)
            </button>
          </div>
          {pairs.tournament.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pairs (locked once created)
              </p>
              <ul className="space-y-1.5">
                {pairs.tournament.map(([a, b]) => (
                  <li
                    key={`${a}-${b}`}
                    className="rounded-lg border border-slate-600/60 bg-slate-800/50 px-2.5 py-1.5 text-sm text-slate-100"
                  >
                    {a} + {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Social list + pairing */}
        <div className="rounded-2xl border border-slate-600/50 bg-slate-800/30 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300/85">
            Social play players
          </p>
          <ul className="scroll-smooth-area mb-3 max-h-48 space-y-1 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2">
            {socialPlayers.length === 0 ? (
              <li className="text-[11px] text-slate-500">No social players</li>
            ) : (
              socialPlayers.map((p) => (
                <li key={p} className="text-sm text-slate-200">
                  {p}
                  {pairedSocial.has(p) && (
                    <span className="ml-2 text-[10px] text-slate-400">(paired)</span>
                  )}
                </li>
              ))
            )}
          </ul>
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              value={socialPair[0]}
              onChange={(e) => setSocialPair((prev) => [e.target.value, prev[1]])}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">Select first</option>
              {unpairedSocial.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="text-slate-500">+</span>
            <select
              value={socialPair[1]}
              onChange={(e) => setSocialPair((prev) => [prev[0], e.target.value])}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">Select second</option>
              {unpairedSocial.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addPair("social", socialPair[0], socialPair[1])}
              disabled={!socialPair[0] || !socialPair[1] || socialPair[0] === socialPair[1]}
              className="rounded-lg bg-slate-600/50 px-3 py-1.5 text-xs font-medium text-slate-200 disabled:opacity-50"
            >
              Pair (social)
            </button>
          </div>
          {pairs.social.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pairs (locked once created)
              </p>
              <ul className="space-y-1.5">
                {pairs.social.map(([a, b]) => (
                  <li
                    key={`${a}-${b}`}
                    className="rounded-lg border border-slate-600/60 bg-slate-800/50 px-2.5 py-1.5 text-sm text-slate-100"
                  >
                    {a} + {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={onViewCourts}
          className="w-full rounded-xl border border-amber-400/60 bg-amber-500/15 py-3 text-sm font-semibold text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.35)] transition hover:border-amber-300 hover:bg-amber-500/25"
        >
          Continue to the courts stage →
        </button>
      )}
    </div>
  );
}

function pairKey(pair: [string, string]): string {
  const [a, b] = pair.map((s) => String(s).trim()).filter(Boolean);
  return a && b ? [a, b].sort().join("|") : "";
}

function ScoresPageContent({
  pairs,
  scoresData,
  setScoresData,
  isAdmin,
}: {
  pairs: PairsData;
  scoresData: { points: Record<string, number>; matches: unknown[] };
  setScoresData: React.Dispatch<React.SetStateAction<{ points: Record<string, number>; matches: unknown[] }>>;
  isAdmin: boolean;
}) {
  const allPairs: { key: string; label: string; pair: [string, string] }[] = [
    ...pairs.tournament.map((p) => ({ key: pairKey(p), label: `${p[0]} & ${p[1]}`, pair: p })),
    ...pairs.social.map((p) => ({ key: pairKey(p), label: `${p[0]} & ${p[1]}`, pair: p })),
  ].filter((x) => x.key);
  const [yourPairKey, setYourPairKey] = useState("");
  const [opposingPairKey, setOpposingPairKey] = useState("");
  const [winner, setWinner] = useState<"yours" | "theirs">("yours");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const yourPair = allPairs.find((x) => x.key === yourPairKey);
  const opposingPair = allPairs.find((x) => x.key === opposingPairKey);

  async function handleSubmitResult(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!yourPair || !opposingPair || yourPairKey === opposingPairKey) {
      setSubmitError("Select two different pairs.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairA: yourPair.pair,
          pairB: opposingPair.pair,
          winner: winner === "yours" ? "A" : "B",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error || "Failed to save result.");
        return;
      }
      const data = await res.json();
      setScoresData({ points: data.points ?? {}, matches: data.matches ?? [] });
      setYourPairKey("");
      setOpposingPairKey("");
    } catch {
      setSubmitError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminReset() {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/scores", {
        method: "DELETE",
        headers: { "x-admin-reset": "lucella" },
      });
      if (res.ok) {
        setScoresData({ points: {}, matches: [] });
      }
    } catch {
      // ignore
    }
  }

  const tableRows = Object.entries(scoresData.points)
    .filter(([, pts]) => pts > 0)
    .map(([key, pts]) => ({ key, label: key.split("|").join(" & "), pts }))
    .sort((a, b) => b.pts - a.pts);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <form onSubmit={handleSubmitResult} className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-200">Enter result</p>
        <p className="mb-3 text-[11px] text-slate-400">Choose your pair, the pair you played against, and who won. The winning pair receives one point.</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-400">Your pair</label>
            <select
              value={yourPairKey}
              onChange={(e) => setYourPairKey(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Select pair</option>
              {allPairs.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-400">Opposing pair</label>
            <select
              value={opposingPairKey}
              onChange={(e) => setOpposingPairKey(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Select pair</option>
              {allPairs.filter((p) => p.key !== yourPairKey).map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-400">Who won?</label>
            <select
              value={winner}
              onChange={(e) => setWinner(e.target.value as "yours" | "theirs")}
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              <option value="yours">Your pair</option>
              <option value="theirs">Opposing pair</option>
            </select>
          </div>
          {submitError && <p className="text-xs text-red-400">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting || !yourPair || !opposingPair}
            className="w-full rounded-xl bg-cyan-500/20 py-3 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/40 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Submit result"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Points table</p>
          {isAdmin && (
            <button
              type="button"
              onClick={handleAdminReset}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/20"
            >
              Reset all (admin)
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Pair</th>
                <th className="py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr><td colSpan={2} className="py-4 text-center text-slate-500">No results yet. Submit a result above.</td></tr>
              ) : (
                tableRows.map(({ key, label, pts }) => (
                  <tr key={key} className="border-b border-slate-800/60">
                    <td className="py-2.5 pr-4 font-medium text-slate-100">{label}</td>
                    <td className="py-2.5 text-right font-semibold text-cyan-200">{pts}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [stage, setStage] = useState<Stage>("names");
  const [name, setName] = useState("");
  const [tournamentPlayers, setTournamentPlayers] = useState<string[]>([]);
  const [socialPlayers, setSocialPlayers] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [playMode, setPlayMode] = useState<"social" | "tournament" | null>(
    null,
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSportsSecModal, setShowSportsSecModal] = useState(false);
  const [sportsSecPassword, setSportsSecPassword] = useState("");
  const [sportsSecError, setSportsSecError] = useState("");
  const [pairs, setPairsState] = useState<PairsData>(() =>
    loadPairsFromStorage(),
  );
  const [stateVersion, setStateVersion] = useState(0);
  const [showPointsRuleModal, setShowPointsRuleModal] = useState(false);
  const [showScoresPage, setShowScoresPage] = useState(false);
  const [scoresData, setScoresData] = useState<{ points: Record<string, number>; matches: unknown[] }>({ points: {}, matches: [] });

  // Intro timing
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  function chooseMode(mode: "social" | "tournament") {
    setPlayMode(mode);
    setStep(2);
  }

  // Load saved state (players, play mode, stage). Admin is not persisted — re-enter password after reload.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedTournament = window.localStorage.getItem(
        "lawx-padel-tournament-players",
      );
      const storedSocial = window.localStorage.getItem(
        "lawx-padel-social-players",
      );
      const storedMode = window.localStorage.getItem("lawx-padel-play-mode");
      const storedStage = window.localStorage.getItem("lawx-padel-stage");
      if (storedTournament) {
        const parsed = JSON.parse(storedTournament);
        if (Array.isArray(parsed)) {
          setTournamentPlayers(parsed.filter((p) => typeof p === "string"));
        }
      }
      if (storedSocial) {
        const parsed = JSON.parse(storedSocial);
        if (Array.isArray(parsed)) {
          setSocialPlayers(parsed.filter((p) => typeof p === "string"));
        }
      }
      if (storedMode === "social" || storedMode === "tournament") {
        setPlayMode(storedMode);
      }
      if (storedStage === "courts" || storedStage === "pairing" || storedStage === "names") {
        setStage(storedStage);
        if (storedStage === "courts" || storedStage === "pairing") setStep(3);
      }
      const storedPairs = window.localStorage.getItem(PAIRS_STORAGE_KEY);
      if (storedPairs) {
        try {
          const parsed = JSON.parse(storedPairs);
          setPairsState({
            tournament: Array.isArray(parsed.tournament) ? parsed.tournament : [],
            social: Array.isArray(parsed.social) ? parsed.social : [],
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore bad storage data
    }
  }, []);

  // Persist players, mode, stage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "lawx-padel-tournament-players",
        JSON.stringify(tournamentPlayers),
      );
      window.localStorage.setItem(
        "lawx-padel-social-players",
        JSON.stringify(socialPlayers),
      );
      if (playMode) {
        window.localStorage.setItem("lawx-padel-play-mode", playMode);
      }
      window.localStorage.setItem("lawx-padel-stage", stage);
    } catch {
      // ignore storage errors
    }
  }, [tournamentPlayers, socialPlayers, playMode, stage]);

  // Sync pairs from server so all users see the same pairs
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pairs");
        if (res.ok) {
          const data = await res.json();
          if (data && (Array.isArray(data.tournament) || Array.isArray(data.social)))
            setPairsState({
              tournament: Array.isArray(data.tournament) ? data.tournament : [],
              social: Array.isArray(data.social) ? data.social : [],
            });
        }
      } catch {
        // keep localStorage state
      }
    })();
  }, []);

  // When on pairing view, poll so everyone sees updates
  useEffect(() => {
    if (stage !== "pairing") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/pairs");
        if (res.ok) {
          const data = await res.json();
          if (data && (Array.isArray(data.tournament) || Array.isArray(data.social)))
            setPairsState({
              tournament: Array.isArray(data.tournament) ? data.tournament : [],
              social: Array.isArray(data.social) ? data.social : [],
            });
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(t);
  }, [stage]);

  const setPairs = useCallback((next: PairsData) => {
    setPairsState(next);
    savePairsToStorage(next);
    fetch("/api/pairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }, []);

  // Push shared state to the server. Set includeStage true only when admin advances (pairing/courts); otherwise adding a name would overwrite stage and pull others back to name input.
  const syncStateToServer = useCallback(
    async (
      nextTournament: string[] = tournamentPlayers,
      nextSocial: string[] = socialPlayers,
      nextPlayMode: "tournament" | "social" | null = playMode,
      nextStage: Stage = stage,
      includeStage = false,
    ) => {
      try {
        const body: Record<string, unknown> = {
          tournamentPlayers: nextTournament,
          socialPlayers: nextSocial,
          playMode: nextPlayMode,
        };
        if (includeStage) body.stage = nextStage;
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.version === "number") {
            setStateVersion(data.version);
          }
        }
      } catch {
        // ignore network errors; local state still works
      }
    },
    [tournamentPlayers, socialPlayers, playMode, stage],
  );

  // Load shared state from server so everyone sees the same names + stage
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/state");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.version !== "number" || data.version <= 0) return;
        const nextTournament = Array.isArray(data.tournamentPlayers)
          ? data.tournamentPlayers.filter((p: unknown) => typeof p === "string")
          : [];
        const nextSocial = Array.isArray(data.socialPlayers)
          ? data.socialPlayers.filter((p: unknown) => typeof p === "string")
          : [];
        const nextPlayMode =
          data.playMode === "tournament" || data.playMode === "social"
            ? data.playMode
            : null;
        const nextStage: Stage =
          data.stage === "pairing" || data.stage === "courts"
            ? data.stage
            : "names";

        if (nextTournament.length || nextSocial.length || nextPlayMode || nextStage !== "names") {
          setTournamentPlayers(nextTournament);
          setSocialPlayers(nextSocial);
          setPlayMode(nextPlayMode);
          setStage(nextStage);
          if (nextStage === "pairing" || nextStage === "courts") {
            setStep(3);
          }
          setStateVersion(data.version);
        }
      } catch {
        // fall back to local state
      }
    })();
  }, []);

  // Poll shared state occasionally so everyone sees updates (names + stage)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/state");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.version !== "number" || data.version <= stateVersion)
          return;
        const nextTournament = Array.isArray(data.tournamentPlayers)
          ? data.tournamentPlayers.filter((p: unknown) => typeof p === "string")
          : [];
        const nextSocial = Array.isArray(data.socialPlayers)
          ? data.socialPlayers.filter((p: unknown) => typeof p === "string")
          : [];
        const nextStage: Stage =
          data.stage === "pairing" || data.stage === "courts"
            ? data.stage
            : "names";

        setTournamentPlayers(nextTournament);
        setSocialPlayers(nextSocial);
        setStage(nextStage);
        if (nextStage === "pairing" || nextStage === "courts") {
          setStep(3);
        } else if (nextStage === "names" && step > 2) {
          setStep(2);
        }
        setStateVersion(data.version);
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(id);
  }, [step]);

  function handleAddPlayer() {
    const trimmed = name.trim();
    if (!trimmed || !playMode) return;

    let nextTournament = tournamentPlayers;
    let nextSocial = socialPlayers;

    if (playMode === "tournament") {
      if (!tournamentPlayers.includes(trimmed)) {
        nextTournament = [...tournamentPlayers, trimmed];
        setTournamentPlayers(nextTournament);
      }
    } else {
      if (!socialPlayers.includes(trimmed)) {
        nextSocial = [...socialPlayers, trimmed];
        setSocialPlayers(nextSocial);
      }
    }

    setName("");
    syncStateToServer(nextTournament, nextSocial, playMode, stage, false);
  }

  function handleSportsSecSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSportsSecError("");
    if (sportsSecPassword.trim().toLowerCase() === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowSportsSecModal(false);
      setSportsSecPassword("");
    } else {
      setSportsSecError("Incorrect password. Try again.");
    }
  }

  function removePlayer(player: string, from: "tournament" | "social") {
    if (!isAdmin) return;
    let nextTournament = tournamentPlayers;
    let nextSocial = socialPlayers;
    if (from === "tournament") {
      nextTournament = tournamentPlayers.filter((p) => p !== player);
      setTournamentPlayers(nextTournament);
    } else {
      nextSocial = socialPlayers.filter((p) => p !== player);
      setSocialPlayers(nextSocial);
    }
    syncStateToServer(nextTournament, nextSocial, playMode, stage, false);
  }

  function movePlayer(
    player: string,
    from: "tournament" | "social",
    to: "tournament" | "social",
  ) {
    if (!isAdmin || from === to) return;
    let nextTournament = tournamentPlayers;
    let nextSocial = socialPlayers;
    if (from === "tournament") {
      nextTournament = tournamentPlayers.filter((p) => p !== player);
      if (!socialPlayers.includes(player)) {
        nextSocial = [...socialPlayers, player];
      }
    } else {
      nextSocial = socialPlayers.filter((p) => p !== player);
      if (!tournamentPlayers.includes(player)) {
        nextTournament = [...tournamentPlayers, player];
      }
    }
    setTournamentPlayers(nextTournament);
    setSocialPlayers(nextSocial);
    syncStateToServer(nextTournament, nextSocial, playMode, stage, false);
  }

  function continueToNextStage() {
    if (!isAdmin) return;
    setStage("pairing");
    setStep(3);
    syncStateToServer(tournamentPlayers, socialPlayers, playMode, "pairing", true);
  }

  function goToCourtsView() {
    setStage("courts");
    syncStateToServer(tournamentPlayers, socialPlayers, playMode, "courts", true);
  }

  // Court assignment by pairs: each court = 2 pairs (side A vs side B). Proportional split of 5 courts.
  function getCourtAssignment(): {
    tournamentCourts: [[string, string], [string, string]][];
    socialCourts: [[string, string], [string, string]][];
    tournamentWaiting: string[];
    socialWaiting: string[];
    tournamentCourtLabels: string[];
    socialCourtLabels: string[];
  } {
    const pairT = pairs.tournament;
    const pairS = pairs.social;
    const totalPairs = pairT.length + pairS.length;
    const pairedT = new Set(pairT.flat());
    const pairedS = new Set(pairS.flat());
    const tournamentWaiting = tournamentPlayers.filter((p) => !pairedT.has(p));
    const socialWaiting = socialPlayers.filter((p) => !pairedS.has(p));

    if (totalPairs === 0) {
      return {
        tournamentCourts: [],
        socialCourts: [],
        tournamentWaiting,
        socialWaiting,
        tournamentCourtLabels: [],
        socialCourtLabels: [],
      };
    }
    let courtCountT: number;
    let courtCountS: number;
    if (pairT.length === 0) {
      courtCountT = 0;
      courtCountS = Math.min(5, Math.ceil(pairS.length / 2));
    } else if (pairS.length === 0) {
      courtCountT = Math.min(5, Math.ceil(pairT.length / 2));
      courtCountS = 0;
    } else {
      courtCountT = Math.round((5 * pairT.length) / totalPairs);
      courtCountS = 5 - courtCountT;
      if (courtCountT === 0) courtCountT = 1;
      if (courtCountS === 0) courtCountS = 1;
      courtCountT = Math.min(courtCountT, Math.ceil(pairT.length / 2));
      courtCountS = Math.min(courtCountS, Math.ceil(pairS.length / 2));
    }
    const tournamentCourtLabels = COURT_NAMES.slice(0, courtCountT);
    const socialCourtLabels = COURT_NAMES.slice(courtCountT, courtCountT + courtCountS);
    const tournamentCourts: [[string, string], [string, string]][] = [];
    for (let i = 0; i < courtCountT; i++) {
      const p1 = pairT[i * 2];
      const p2 = pairT[i * 2 + 1];
      if (p1 && p2) tournamentCourts.push([p1, p2]);
    }
    const socialCourts: [[string, string], [string, string]][] = [];
    for (let i = 0; i < courtCountS; i++) {
      const p1 = pairS[i * 2];
      const p2 = pairS[i * 2 + 1];
      if (p1 && p2) socialCourts.push([p1, p2]);
    }
    return {
      tournamentCourts,
      socialCourts,
      tournamentWaiting,
      socialWaiting,
      tournamentCourtLabels,
      socialCourtLabels,
    };
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPlayer();
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Background gradients & glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        aria-hidden="true"
      >
        <div className="absolute -left-40 top-[-10rem] h-96 w-96 rounded-full bg-gradient-to-br from-emerald-500/40 via-cyan-400/20 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-blue-700/40 via-indigo-500/30 to-fuchsia-500/20 blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.28) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 md:px-8">
        {/* Neon frame */}
        <div className="relative w-full max-w-3xl rounded-[2rem] border border-slate-800/80 bg-slate-950/70 px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,1)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-28 bg-gradient-to-b from-emerald-400/30 via-cyan-400/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 bottom-0 h-24 bg-gradient-to-t from-indigo-500/35 via-fuchsia-500/10 to-transparent blur-3xl" />

          {/* Top pill / meta + rules */}
          <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowScoresPage(true);
                  fetch("/api/scores").then((r) => r.ok && r.json()).then((d) => d && setScoresData({ points: d.points ?? {}, matches: d.matches ?? [] })).catch(() => {});
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition hover:border-cyan-300 hover:bg-cyan-500/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="uppercase tracking-[0.18em]">Scores</span>
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 shadow-[0_0_22px_rgba(16,185,129,0.5)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                <span className="font-semibold tracking-[0.18em] uppercase text-emerald-100">
                  Live Bracket
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-slate-900/90 px-3 py-1.5 text-[11px] font-medium text-emerald-100 shadow-[0_0_24px_rgba(34,197,94,0.65)] transition hover:border-emerald-300 hover:bg-emerald-500/15"
              >
                <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-cyan-400 to-sky-400">
                  {/* Padel racket icon */}
                  <svg
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    className="h-4 w-4 text-slate-950"
                  >
                    <defs>
                      <pattern
                        id="padel-dots"
                        x="0"
                        y="0"
                        width="4"
                        height="4"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="1" cy="1" r="0.6" fill="currentColor" />
                      </pattern>
                    </defs>
                    {/* Head */}
                    <path
                      d="M20.5 4.5c-3-3-7.9-3-10.9 0-3 3-3 7.8 0 10.8 1.3 1.3 2.9 2.1 4.6 2.4l2.9 4.3c.3.4.9.5 1.3.2l1.8-1.3c.4-.3.5-.9.2-1.3l-2.8-4.2c.3-1.7 1.1-3.3 2.4-4.6 3-3 3-7.8 0-10.8Z"
                      fill="url(#padel-dots)"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    {/* Handle */}
                    <path
                      d="M15.7 18.6 12.8 22c-.4.5-.4 1.2.1 1.6l1.9 1.8c.5.5 1.3.4 1.7-.1l2.7-3.4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="uppercase tracking-[0.18em]">Padel Rules</span>
              </button>
            </div>
          </div>

          {/* Intro -> Form transition */}
          <div className="relative">
            {/* Intro title */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 text-center transition-all duration-700 ${
                showIntro
                  ? "opacity-100 translate-y-0 scale-100"
                  : "pointer-events-none translate-y-4 scale-95 opacity-0"
              }`}
            >
              <h1 className="bg-gradient-to-br from-emerald-300 via-cyan-200 to-sky-400 bg-clip-text text-4xl font-black leading-tight text-transparent drop-shadow-[0_0_25px_rgba(34,197,94,0.4)] md:text-5xl">
                Law X Padel Tournament
              </h1>
            </div>

            {/* Multi-step flow: 1 = mode, 2 = name input, 3 = list */}
            <div
              className={`relative min-h-[420px] transition-all duration-700 ${
                showIntro
                  ? "pointer-events-none -translate-y-4 opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
            >
              {/* Step 1: Choice of play only */}
              <div
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-out ${
                  step === 1
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-6 opacity-0"
                }`}
              >
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 md:p-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                      Choice of play today
                    </p>
                    <p className="text-[11px] text-slate-300/90">
                      Once the tournament has started, you cannot switch between.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => chooseMode("social")}
                      className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 text-left text-sm transition hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] md:text-base"
                    >
                      <span className="mt-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-slate-500" />
                      <span className="text-slate-100">
                        I am just here to play socially
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseMode("tournament")}
                      className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3.5 text-left text-sm transition hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] md:text-base"
                    >
                      <span className="mt-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-slate-500" />
                      <span className="text-slate-100">
                        I am here to play in the tournament
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Name input */}
              <div
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-out ${
                  step === 2
                    ? "translate-y-0 opacity-100"
                    : step < 2
                      ? "pointer-events-none translate-y-8 opacity-0"
                      : "pointer-events-none -translate-y-6 opacity-0"
                }`}
              >
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition hover:text-emerald-300"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Change play type
                  </button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                      Join the court
                    </p>
                    <p className="mt-1 text-sm text-slate-300/95">
                      Put your name in and once everyone is in, we will assign courts.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Playing as{" "}
                      <span className="font-semibold text-emerald-200/90">
                        {playMode === "tournament" ? "tournament" : "social"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/15 via-slate-900/90 to-cyan-500/10 px-4 py-3 shadow-[0_0_0_1px_rgba(74,222,128,0.35)]">
                        <div className="hidden h-8 items-center rounded-full border border-emerald-300/70 bg-emerald-500/15 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100 shadow-sm md:inline-flex">
                          Player
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your name and hit Add player…"
                          className="flex-1 bg-transparent text-sm text-slate-50 placeholder:text-emerald-100/70 focus:outline-none md:text-base"
                        />
                        <button
                          type="button"
                          onClick={handleAddPlayer}
                          disabled={!name.trim()}
                          className="flex h-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-400 to-sky-400 px-4 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.85)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:px-5"
                        >
                          Add player
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-emerald-100/85">
                        Press{" "}
                        <span className="rounded border border-emerald-200/70 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold">
                          Enter
                        </span>{" "}
                        to quickly add yourself.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full rounded-xl border border-emerald-400/60 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-100 shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:border-emerald-300 hover:bg-emerald-500/20"
                  >
                    See lineup →
                  </button>
                </div>
              </div>

              {/* Step 3: List of names by section OR Courts view */}
              <div
                className={`absolute inset-0 flex flex-col transition-all duration-500 ease-out ${
                  step === 3
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-8 opacity-0"
                } max-h-[78vh] scroll-smooth-area`}
              >
                {stage === "names" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition hover:text-emerald-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Add another player
                      </button>
                      <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400">
                        Total: {tournamentPlayers.length + socialPlayers.length}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={continueToNextStage}
                        className="w-full rounded-xl border border-amber-400/60 bg-amber-500/15 py-3 text-sm font-semibold text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.35)] transition hover:border-amber-300 hover:bg-amber-500/25"
                      >
                        Continue to the next stage →
                      </button>
                    )}
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Players by section
                      </p>
                      {tournamentPlayers.length === 0 && socialPlayers.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/70 px-4 py-4 text-center text-xs text-slate-400">
                          No players yet. Go back and add your name.
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/85">
                              Tournament
                            </p>
                            {tournamentPlayers.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-400">
                                No tournament names yet.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {tournamentPlayers.map((player, index) => (
                                  <li
                                    key={player}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 px-3 py-2 text-sm text-slate-100 shadow-[0_10px_35px_rgba(15,23,42,0.9)]"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/70 to-cyan-400/70 text-[11px] font-bold text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.9)]">
                                        {index + 1}
                                      </span>
                                      <span className="font-medium tracking-tight truncate">
                                        {player}
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      {isAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => movePlayer(player, "tournament", "social")}
                                            className="rounded px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-700/80 hover:text-slate-200"
                                            title="Move to social"
                                          >
                                            → Social
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removePlayer(player, "tournament")}
                                            className="rounded p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                                            title="Remove"
                                            aria-label={`Remove ${player}`}
                                          >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                      {!isAdmin && (
                                        <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
                                          Ready
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300/85">
                              Social play
                            </p>
                            {socialPlayers.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-400">
                                No social-play names yet.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {socialPlayers.map((player, index) => (
                                  <li
                                    key={player}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 px-3 py-2 text-sm text-slate-100 shadow-[0_10px_35px_rgba(15,23,42,0.9)]"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-500/80 to-slate-300/80 text-[11px] font-bold text-slate-950 shadow-[0_0_16px_rgba(148,163,184,0.9)]">
                                        {index + 1}
                                      </span>
                                      <span className="font-medium tracking-tight truncate">
                                        {player}
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      {isAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => movePlayer(player, "social", "tournament")}
                                            className="rounded px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-700/80 hover:text-slate-200"
                                            title="Move to tournament"
                                          >
                                            → Tournament
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removePlayer(player, "social")}
                                            className="rounded p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                                            title="Remove"
                                            aria-label={`Remove ${player}`}
                                          >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                      {!isAdmin && (
                                        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300/80">
                                          Social
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : stage === "pairing" ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setStage("names")}
                      className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition hover:text-emerald-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to lineup
                    </button>
                    <PairingView
                      tournamentPlayers={tournamentPlayers}
                      socialPlayers={socialPlayers}
                      pairs={pairs}
                      onPairsChange={setPairs}
                      onViewCourts={goToCourtsView}
                      isAdmin={isAdmin}
                    />
                  </div>
                ) : (
                  <CourtsView
                    tournamentPlayers={tournamentPlayers}
                    socialPlayers={socialPlayers}
                    getCourtAssignment={getCourtAssignment}
                    isAdmin={isAdmin}
                    removePlayer={removePlayer}
                    movePlayer={movePlayer}
                    onBackToLineup={() => setStage("names")}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScoresPage && (
        <div className="fixed inset-0 z-20 flex flex-col bg-slate-950 text-slate-100">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 px-4 py-3">
            <button
              type="button"
              onClick={() => setShowScoresPage(false)}
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 hover:text-cyan-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <h1 className="text-sm font-bold uppercase tracking-wider text-cyan-200">Scores</h1>
            <div className="w-14" />
          </div>
          <div className="scroll-smooth-area flex-1 overflow-y-auto px-4 py-5">
            <ScoresPageContent
              pairs={pairs}
              scoresData={scoresData}
              setScoresData={setScoresData}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      {/* Tournament Points Rule — bottom left, above Sports Sec */}
      <button
        type="button"
        onClick={() => setShowPointsRuleModal(true)}
        className="fixed bottom-20 left-5 z-10 flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/90 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300 shadow-lg backdrop-blur-sm transition hover:border-amber-500/50 hover:bg-slate-800/95 hover:text-amber-200"
        aria-label="Tournament Points Rule"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/80 text-slate-200">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        Points Rule
      </button>

      {/* Sports Sec — bottom left: click to open admin password; shows unlocked when admin */}
      <button
        type="button"
        onClick={() => {
          setShowSportsSecModal(true);
          setSportsSecError("");
          setSportsSecPassword("");
        }}
        className={`fixed bottom-5 left-5 z-10 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider shadow-lg backdrop-blur-sm transition ${
          isAdmin
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20"
            : "border-slate-600/80 bg-slate-900/90 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/95 hover:text-emerald-200"
        }`}
        aria-label={isAdmin ? "Sports Sec — admin (signed in)" : "Sports Sec — admin access"}
      >
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-200 ${isAdmin ? "bg-emerald-500/30" : "bg-slate-700/80"}`}>
          {isAdmin ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </span>
        Sports Sec
      </button>

      {showPointsRuleModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowPointsRuleModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200">
                Tournament Points Rule
              </h2>
              <button type="button" onClick={() => setShowPointsRuleModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-slate-200">
              Rounds will be made up of the first three games. Each game scores like a tennis game (15, 30, 40, game). After the round has finished, enter the result on the <button type="button" className="font-semibold text-cyan-300 underline hover:text-cyan-200" onClick={() => { setShowPointsRuleModal(false); setShowScoresPage(true); fetch("/api/scores").then((r) => r.ok && r.json()).then((d) => d && setScoresData({ points: d.points ?? {}, matches: d.matches ?? [] })).catch(() => {}); }}>Scores</button> page.
            </p>
          </div>
        </div>
      )}

      {showSportsSecModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Sports Sec
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowSportsSecModal(false);
                  setSportsSecPassword("");
                  setSportsSecError("");
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-400">
              Enter the password to access admin options. You’ll need to sign in again after each page reload.
            </p>
            <form onSubmit={handleSportsSecSubmit} className="space-y-4">
              <div>
                <label htmlFor="sports-sec-password" className="sr-only">
                  Password
                </label>
                <input
                  id="sports-sec-password"
                  type="password"
                  value={sportsSecPassword}
                  onChange={(e) => {
                    setSportsSecPassword(e.target.value);
                    setSportsSecError("");
                  }}
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  autoComplete="current-password"
                />
                {sportsSecError && (
                  <p className="mt-2 text-xs text-red-400">{sportsSecError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500/20 py-3 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/40 transition hover:bg-emerald-500/30"
              >
                Sign in as admin
              </button>
            </form>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/95 shadow-[0_30px_120px_rgba(15,23,42,1)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-300/90">
                  Padel Rules
                </p>
                <p className="text-xs text-slate-300/90">
                  Super simple, match-day friendly version.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-[11px] text-slate-200 hover:border-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="grid gap-6 px-5 py-5 text-sm text-slate-100 md:grid-cols-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                  Scoring points
                </h2>
                <ul className="mt-3 space-y-2 text-[13px] text-slate-200/90">
                  <li>· Same scoring as tennis: 15, 30, 40, game.</li>
                  <li>· First to 6 games, win by 2, wins the set.</li>
                  <li>· At 40–40 (deuce) you must win two points in a row.</li>
                  <li>· Match is usually best of 3 sets.</li>
                  <li>· You win a point when the ball bounces twice on the other side or they hit the net/wall first.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                  In‑play rules
                </h2>
                <ul className="mt-3 space-y-2 text-[13px] text-slate-200/90">
                  <li>· Ball must bounce once on the ground before it can hit any wall.</li>
                  <li>· You can hit the ball off your own glass wall, but not into your own fence.</li>
                  <li>· You may volley (hit in the air) on any shot after the return of serve.</li>
                  <li>· Ball is out if it hits the wall or fence on the opponent&apos;s side before the ground.</li>
                  <li>· Net touch or hitting the ball twice in one swing loses the point.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                  Serve rules
                </h2>
                <ul className="mt-3 space-y-2 text-[13px] text-slate-200/90">
                  <li>· Under‑arm serve only: drop the ball and hit it below waist height.</li>
                  <li>· Serve diagonally into the opposite service box.</li>
                  <li>· The ball may hit the side or back glass after landing in the box and still be in, but not the fence on the serve.</li>
                  <li>· If the ball hits the net and still lands in the correct box, repeat the serve (let).</li>
                  <li>· You get two serve attempts; miss both and you lose the point.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
