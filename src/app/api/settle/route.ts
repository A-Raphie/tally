import { NextResponse } from "next/server";
import { lookupSettlement } from "@/lib/dex";
import { readReceipts, writeReceipts, type Receipt } from "@/lib/store";

export const dynamic = "force-dynamic";

// chain reads + SDK init can exceed the 10s serverless default on cold starts
export const maxDuration = 60;

// Scan OPEN receipts against the indexer; resolve to WON / LOST / VOID with payout math.
export async function POST() {
  try {
    const receipts = await readReceipts();
    const open = receipts.filter((r) => r.status === "OPEN");
    let settled = 0;
    let checked = 0;

    const byMarket = new Map<string, Awaited<ReturnType<typeof lookupSettlement>>>();
    for (const r of open) {
      if (!byMarket.has(r.marketId)) byMarket.set(r.marketId, await lookupSettlement(r.marketId));
      const s = byMarket.get(r.marketId);
      checked += 1;
      if (!s) continue;
      if (!s.finalized && !s.voided) continue;

      let status: Receipt["status"];
      let payout: number;
      if (s.voided) {
        status = "VOID";
        payout = r.filled * 0.5;
      } else if (s.winningOutcome === 0) {
        status = "WON";
        payout = r.filled * 1;
      } else {
        status = "LOST";
        payout = 0;
      }
      r.status = status;
      r.payout = payout;
      r.settledAt = Date.now();
      settled += 1;
    }

    await writeReceipts(receipts);
    return NextResponse.json({ checked, settled });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
