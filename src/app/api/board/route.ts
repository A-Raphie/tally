import { NextResponse } from "next/server";
import { readReceipts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const receipts = await readReceipts();
  const byWallet = new Map<string, { wallet: string; bets: number; staked: number; won: number; lost: number; returned: number }>();
  for (const r of receipts) {
    const w = byWallet.get(r.wallet) ?? { wallet: r.wallet, bets: 0, staked: 0, won: 0, lost: 0, returned: 0 };
    w.bets += 1;
    w.staked += r.filled * r.price;
    if (r.status === "WON") { w.won += 1; w.returned += r.payout ?? 0; }
    if (r.status === "LOST") w.lost += 1;
    if (r.status === "VOID") w.returned += r.payout ?? 0;
    byWallet.set(r.wallet, w);
  }
  const rows = [...byWallet.values()].sort((a, b) => b.returned - a.returned || b.bets - a.bets);
  return NextResponse.json({ board: rows });
}
