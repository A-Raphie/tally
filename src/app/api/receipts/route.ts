import { NextResponse } from "next/server";
import { deriveCards } from "@/lib/cards";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const receipts = await deriveCards();
    return NextResponse.json({ receipts });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
