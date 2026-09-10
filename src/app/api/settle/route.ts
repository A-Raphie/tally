import { NextResponse } from "next/server";
import { deriveCards, countSettled } from "@/lib/cards";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cards are derived live from the indexer, so settlement status is always
// current; this endpoint exists for the desk's "check the chain" action.
export async function POST() {
  try {
    const cards = await deriveCards();
    const { checked, settled } = countSettled(cards);
    return NextResponse.json({ checked, settled, settledCards: settled });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
