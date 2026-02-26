import { NextResponse } from "next/server";

function pairKey(pair: [string, string]): string {
  const [a, b] = pair.map((s) => String(s).trim()).filter(Boolean);
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

type Match = { pairA: string; pairB: string; winner: "A" | "B" };

let points: Record<string, number> = {};
let matches: Match[] = [];

export async function GET() {
  return NextResponse.json({ points: { ...points }, matches: [...matches] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pairA = Array.isArray(body.pairA) && body.pairA.length === 2
      ? [String(body.pairA[0]).trim(), String(body.pairA[1]).trim()]
      : null;
    const pairB = Array.isArray(body.pairB) && body.pairB.length === 2
      ? [String(body.pairB[0]).trim(), String(body.pairB[1]).trim()]
      : null;
    const winner = body.winner === "A" || body.winner === "B" ? body.winner : null;

    if (!pairA || !pairB || !winner || pairKey(pairA) === pairKey(pairB)) {
      return NextResponse.json({ error: "Invalid pair or winner" }, { status: 400 });
    }

    const keyA = pairKey(pairA);
    const keyB = pairKey(pairB);
    if (!points[keyA]) points[keyA] = 0;
    if (!points[keyB]) points[keyB] = 0;
    if (winner === "A") points[keyA] += 1;
    else points[keyB] += 1;
    matches.push({ pairA: keyA, pairB: keyB, winner });
    return NextResponse.json({ points: { ...points }, matches: [...matches] });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = request.headers.get("x-admin-reset");
  if (auth !== "lucella") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  points = {};
  matches = [];
  return NextResponse.json({ points: {}, matches: [] });
}
