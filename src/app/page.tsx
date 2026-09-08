"use client";

import { useCallback, useEffect, useState } from "react";

type Market = {
  marketId: string;
  question: string;
  secsLeft: number;
  status: string;
  poolAddress: string;
};

type Receipt = {
  id: string;
  txHash: string;
  marketId: string;
  question: string;
  symbol: string;
  price: number;
  filled: number;
  placedAt: number;
  wallet: string;
  status: "OPEN" | "WON" | "LOST" | "VOID";
  payout: number | null;
  settledAt: number | null;
};

type BoardRow = {
  wallet: string;
  bets: number;
  staked: number;
  won: number;
  lost: number;
  returned: number;
};

const EXPLORER = "https://shannon-explorer.somnia.network/tx/";

function fmtSecs(s: number): string {
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

function short(a: string): string {
  return a.length > 12 ? `${a.slice(0, 8)}..${a.slice(-4)}` : a;
}

const STATUS_COLOR: Record<Receipt["status"], string> = {
  OPEN: "text-amber-300 border-amber-300/40 bg-amber-300/10",
  WON: "text-emerald-300 border-emerald-300/40 bg-emerald-300/10",
  LOST: "text-rose-300 border-rose-300/40 bg-rose-300/10",
  VOID: "text-zinc-300 border-zinc-300/40 bg-zinc-300/10",
};

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [m, r, b] = await Promise.all([
        fetch("/api/markets").then((x) => x.json()),
        fetch("/api/receipts").then((x) => x.json()),
        fetch("/api/board").then((x) => x.json()),
      ]);
      setMarkets(m.markets ?? []);
      setReceipts(r.receipts ?? []);
      setBoard(b.board ?? []);
    } catch {
      setError("could not reach the tally server");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  async function bet(m: Market) {
    setBusy(m.marketId);
    setError(null);
    try {
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId: m.marketId, amount: 1, question: m.question }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setLastTx(json.receipt?.txHash ?? null);
      await refresh();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function settle() {
    setBusy("settle");
    setError(null);
    try {
      const res = await fetch("/api/settle", { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await refresh();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(null);
    }
  }

  const openCount = receipts.filter((r) => r.status === "OPEN").length;
  const wonCount = receipts.filter((r) => r.status === "WON").length;
  const totalStaked = receipts.reduce((s, r) => s + r.filled * r.price, 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Tally</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Receipts for prediction calls. Every bet the agent places mints a receipt with its real
            transaction. Settlement is checked against the chain, not claimed. Ranked by settled
            truth.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
            <span>{receipts.length} receipts</span>
            <span>{openCount} open</span>
            <span>{wonCount} won</span>
            <span>{totalStaked.toFixed(2)} tUSDC staked</span>
            <span>Somnia Shannon testnet</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="mb-12">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Live markets
            </h2>
            <span className="text-xs text-zinc-600">tap to stake 1 tUSDC on YES</span>
          </div>
          <ul className="divide-y divide-zinc-800 border border-zinc-800">
            {markets.length === 0 && (
              <li className="px-4 py-6 text-sm text-zinc-500">
                No live markets past the 2 minute mark right now. Refresh shortly.
              </li>
            )}
            {markets.slice(0, 8).map((m) => (
              <li key={m.marketId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">{m.question}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    closes in {fmtSecs(m.secsLeft)} · {short(m.marketId)}
                  </p>
                </div>
                <button
                  onClick={() => bet(m)}
                  disabled={busy === m.marketId}
                  className="shrink-0 border border-amber-300/50 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-300/20 disabled:opacity-40"
                >
                  {busy === m.marketId ? "placing..." : "Bet YES"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Receipts
            </h2>
            <button
              onClick={settle}
              disabled={busy === "settle"}
              className="border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              {busy === "settle" ? "checking..." : "Settle against chain"}
            </button>
          </div>
          <ul className="space-y-2">
            {receipts.length === 0 && (
              <li className="border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
                No receipts yet. Place the first call above.
              </li>
            )}
            {receipts.slice(0, 12).map((r) => (
              <li key={r.id} className="border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">#{r.id}</span>
                  <span className={`border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm text-zinc-200">{r.question || r.symbol}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500">
                  <span>
                    {r.filled} YES @ {r.price.toFixed(3)}
                  </span>
                  <span>staked {(r.filled * r.price).toFixed(2)} tUSDC</span>
                  {r.payout !== null && <span>returned {r.payout.toFixed(2)}</span>}
                  <a
                    href={EXPLORER + r.txHash}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    tx {short(r.txHash)}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Board · settled truth
          </h2>
          <ul className="divide-y divide-zinc-800 border border-zinc-800">
            {board.length === 0 && (
              <li className="px-4 py-6 text-sm text-zinc-500">Nothing settled yet.</li>
            )}
            {board.map((row, i) => (
              <li key={row.wallet} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-zinc-300">
                  <span className="mr-2 text-zinc-600">#{i + 1}</span>
                  {short(row.wallet)}
                </span>
                <span className="text-xs text-zinc-500">
                  {row.bets} calls · {row.won}W {row.lost}L · {row.returned.toFixed(2)} returned
                </span>
              </li>
            ))}
          </ul>
        </section>

        {lastTx && (
          <p className="mb-6 text-xs text-zinc-500">
            last receipt tx:{" "}
            <a href={EXPLORER + lastTx} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              {lastTx}
            </a>
          </p>
        )}

        <footer className="border-t border-zinc-800 pt-6 text-xs text-zinc-600">
          <p>
            Testnet only. Orders are IOC, YES side, sized 1 tUSDC. Receipts live in the runner's own
            store; the chain is the source of truth.
          </p>
          <p className="mt-2">
            built by{" "}
            <a
              href="https://x.com/a_raphie"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:underline"
            >
              Raphie
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
