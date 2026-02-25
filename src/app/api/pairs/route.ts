import { NextResponse } from "next/server";

export type PairsData = {
  tournament: [string, string][];
  social: [string, string][];
};

// In-memory store so all clients hitting this instance see the same pairs.
// For production multi-instance sync, use Firestore or Vercel KV instead.
let store: PairsData = { tournament: [], social: [] };

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    store = {
      tournament: Array.isArray(body.tournament) ? body.tournament : [],
      social: Array.isArray(body.social) ? body.social : [],
    };
    return NextResponse.json(store);
  } catch {
    return NextResponse.json(
      { error: "Failed to save pairs" },
      { status: 400 },
    );
  }
}
