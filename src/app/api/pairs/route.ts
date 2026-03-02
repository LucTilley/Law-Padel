import { NextResponse } from "next/server";

export type PairsData = {
  tournament: [string, string][];
  social: [string, string][];
};

const MAX_PAIRS_PER_LIST = 100;

function normalizePair(entry: unknown): [string, string] | null {
  if (!Array.isArray(entry) || entry.length < 2) return null;
  const [e0, e1] = entry;
  if (e0 == null || e1 == null) return null;
  const a = String(e0).trim();
  const b = String(e1).trim();
  if (!a || !b) return null;
  return [a, b];
}

function normalizePairsList(arr: unknown): [string, string][] {
  if (!Array.isArray(arr)) return [];
  const out: [string, string][] = [];
  for (const entry of arr.slice(0, MAX_PAIRS_PER_LIST)) {
    const pair = normalizePair(entry);
    if (pair) out.push(pair);
  }
  return out;
}

// In-memory store so all clients hitting this instance see the same pairs.
// For production multi-instance sync, use Firestore or Vercel KV instead.
let store: PairsData = { tournament: [], social: [] };

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    store = {
      tournament: normalizePairsList(body.tournament),
      social: normalizePairsList(body.social),
    };
    return NextResponse.json(store);
  } catch {
    return NextResponse.json(
      { error: "Failed to save pairs" },
      { status: 400 },
    );
  }
}
