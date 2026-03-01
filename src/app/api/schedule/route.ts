import { NextResponse } from "next/server";

export type ScheduleMatch = { pairA: [string, string]; pairB: [string, string] };
export type Schedule = { tournament: ScheduleMatch[]; social: ScheduleMatch[] };

let schedule: Schedule = { tournament: [], social: [] };

export async function GET() {
  return NextResponse.json(schedule);
}

function normPair(p: unknown): [string, string] | null {
  if (!Array.isArray(p) || p.length < 2) return null;
  const a = String(p[0]).trim();
  const b = String(p[1]).trim();
  return a && b ? [a, b] : null;
}

function normMatch(m: unknown): ScheduleMatch | null {
  if (!Array.isArray(m) || m.length !== 2) return null;
  const pairA = normPair(m[0]);
  const pairB = normPair(m[1]);
  if (!pairA || !pairB) return null;
  return { pairA, pairB };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tournament: ScheduleMatch[] = Array.isArray(body.tournament)
      ? body.tournament.map((m: unknown) => normMatch(m)).filter((m: ScheduleMatch | null): m is ScheduleMatch => m !== null)
      : [];
    const social: ScheduleMatch[] = Array.isArray(body.social)
      ? body.social.map((m: unknown) => normMatch(m)).filter((m: ScheduleMatch | null): m is ScheduleMatch => m !== null)
      : [];
    schedule = { tournament, social };
    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "Failed to save schedule" }, { status: 400 });
  }
}
