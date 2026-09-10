import { NextResponse } from "next/server";
import { placeBet, walletAddress } from "@/lib/dex";

export const dynamic = "force-dynamic";

// chain reads + SDK init can exceed the 10s serverless default on cold starts
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { marketId?: string; amount?: number; question?: string; outcome?: string };
    const marketId = body.marketId;
    const amount = Math.max(1, Math.min(50, Math.floor(Number(body.amount ?? 1))));
    if (!marketId) return NextResponse.json({ error: "marketId required" }, { status: 400 });

    const outcome: "YES" | "NO" = body.outcome === "NO" ? "NO" : "YES";
    const result = await placeBet(marketId, amount, outcome);
    const wallet = await walletAddress();
    const receipt = {
      id: `${result.txHash.slice(0, 18)}-${Date.now()}`,
      txHash: result.txHash,
      orderId: result.orderId,
      marketId,
      question: String(body.question ?? "").slice(0, 200),
      symbol: result.symbol,
      outcome,
      side: "buy" as const,
      price: result.price,
      amount: result.amount,
      filled: result.filled,
      placedAt: Date.now(),
      wallet,
      status: "OPEN" as const,
      payout: null,
      settledAt: null,
    };
    // no store write: cards derive from the indexer fill tape, which lands a
    // few seconds after the tx confirms
    return NextResponse.json({ receipt });
  } catch (e) {
    const message = String((e as Error).message ?? e);
    return NextResponse.json({ error: message, action: "retry-stake-or-next-market" }, { status: 500 });
  }
}
