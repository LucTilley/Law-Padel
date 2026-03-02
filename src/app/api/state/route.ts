import { NextResponse } from "next/server";

export type GlobalState = {
  tournamentPlayers: string[];
  socialPlayers: string[];
  playMode: "tournament" | "social" | null;
  stage: "names" | "pairing" | "courts";
  version: number;
};

let state: GlobalState = {
  tournamentPlayers: [],
  socialPlayers: [],
  playMode: null,
  stage: "names",
  version: 0,
};

export async function GET() {
  return NextResponse.json(state);
}

const MAX_PLAYERS_PER_LIST = 200;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    // Only update fields that are explicitly sent. Omitting stage keeps current stage (so adding a name doesn't pull others back to name input).
    if (Array.isArray(body.tournamentPlayers)) {
      state.tournamentPlayers = body.tournamentPlayers
        .slice(0, MAX_PLAYERS_PER_LIST)
        .filter((p: unknown) => typeof p === "string");
    }
    if (Array.isArray(body.socialPlayers)) {
      state.socialPlayers = body.socialPlayers
        .slice(0, MAX_PLAYERS_PER_LIST)
        .filter((p: unknown) => typeof p === "string");
    }
    if (body.playMode === "tournament" || body.playMode === "social") {
      state.playMode = body.playMode;
    }
    if (body.stage === "names" || body.stage === "pairing" || body.stage === "courts") {
      state.stage = body.stage;
    }
    state.version += 1;
    return NextResponse.json({ ...state });
  } catch {
    return NextResponse.json(
      { error: "Failed to save state" },
      { status: 400 },
    );
  }
}


