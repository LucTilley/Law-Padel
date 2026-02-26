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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    state = {
      tournamentPlayers: Array.isArray(body.tournamentPlayers)
        ? body.tournamentPlayers.filter((p: unknown) => typeof p === "string")
        : [],
      socialPlayers: Array.isArray(body.socialPlayers)
        ? body.socialPlayers.filter((p: unknown) => typeof p === "string")
        : [],
      playMode:
        body.playMode === "tournament" || body.playMode === "social"
          ? body.playMode
          : null,
      stage:
        body.stage === "names" ||
        body.stage === "pairing" ||
        body.stage === "courts"
          ? body.stage
          : "names",
      version: state.version + 1,
    };
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      { error: "Failed to save state" },
      { status: 400 },
    );
  }
}


