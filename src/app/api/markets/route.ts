import { NextResponse } from "next/server";
import { listLive, getAsk, getNoAsk } from "@/lib/dex";

export const dynamic = "force-dynamic";

// chain reads + SDK init can exceed the 10s serverless default on cold starts
export const maxDuration = 60;

export async function GET() {
  try {
    const markets = await listLive();
    const top = markets.slice(0, 8);
    const [asks, noAsks] = await Promise.all([
      Promise.all(top.map((m) => getAsk(m.marketId))),
      Promise.all(top.map((m) => getNoAsk(m.marketId))),
    ]);
    const withAsk = markets.map((m, i) =>
      i < 8 ? { ...m, ask: asks[i], noAsk: noAsks[i] } : { ...m, ask: null, noAsk: null }
    );
    return NextResponse.json({ markets: withAsk });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
