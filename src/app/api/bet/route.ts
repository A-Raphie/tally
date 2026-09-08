import { NextResponse } from "next/server";
import { placeBet, walletAddress } from "@/lib/dex";
import { addReceipt } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { marketId?: string; amount?: number; question?: string };
    const marketId = body.marketId;
    const amount = Math.max(1, Math.min(50, Math.floor(Number(body.amount ?? 1))));
    if (!marketId) return NextResponse.json({ error: "marketId required" }, { status: 400 });

    const result = await placeBet(marketId, amount);
    const wallet = await walletAddress();
    const receipt = {
      id: `${result.txHash.slice(0, 18)}-${Date.now()}`,
      txHash: result.txHash,
      orderId: result.orderId,
      marketId,
      question: String(body.question ?? "").slice(0, 200),
      symbol: result.symbol,
      outcome: "YES" as const,
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
    await addReceipt(receipt);
    return NextResponse.json({ receipt });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
