import { NextResponse } from "next/server";
import { listLive } from "@/lib/dex";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const markets = await listLive();
    return NextResponse.json({ markets });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
