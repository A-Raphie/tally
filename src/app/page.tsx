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

const STAMP_STYLE: Record<Receipt["status"], string> = {
  OPEN: "text-[var(--stamp-open)]",
  WON: "text-[var(--stamp-win)]",
  LOST: "text-[var(--stamp-loss)]",
  VOID: "text-[var(--stamp-void)]",
};

function fmtSecs(s: number): string {
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function short(a: string, head = 8, tail = 4): string {
  return a.length > head + tail + 2 ? `${a.slice(0, head)}···${a.slice(-tail)}` : a;
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [betting, setBetting] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tx: string; ok: boolean } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [m, r, b] = await Promise.all([
        fetch("/api/markets").then((x) => x.json()),
        fetch("/api/receipts").then((x) => x.json()),
        fetch("/api/board").then((x) => x.json()),
      ]);
      if (m.error) setMarketsError(m.error);
      else { setMarkets(m.markets ?? []); setMarketsError(null); }
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
    setBetting(m.marketId);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId: m.marketId, amount: 1, question: m.question }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setFlash({ tx: json.receipt?.txHash ?? "", ok: true });
      await refresh();
    } catch (e) {
      setError(String((e as Error).message ?? e));
      setFlash(null);
    } finally {
      setBetting(null);
    }
  }

  async function settle() {
    setSettling(true);
    setError(null);
    try {
      const res = await fetch("/api/settle", { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await refresh();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setSettling(false);
    }
  }

  const openCount = receipts.filter((r) => r.status === "OPEN").length;
  const wonCount = receipts.filter((r) => r.status === "WON").length;
  const lostCount = receipts.filter((r) => r.status === "LOST").length;
  const totalStaked = receipts.reduce((s, r) => s + r.filled * r.price, 0);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 pb-16">
        {/* ── Masthead ─────────────────────────────────────────────── */}
        <header className="pt-12 pb-8 border-b border-[var(--ink-line)]">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-[0.08em] text-[var(--ink-text)]">
              TALLY<span className="text-[var(--brass)]">.</span>
            </h1>
            <p className="text-xs text-[var(--ink-faint)] tracking-widest uppercase">Settlement ledger</p>
          </div>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-muted)] text-pretty">
            Receipts for prediction calls. The desk stakes testnet tUSDC on live DreamDEX markets;
            every fill prints a receipt with its real transaction, and the chain, not the desk,
            decides WON or LOST.
          </p>
          {/* live ticker */}
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brass)]" />
            <span className="text-[var(--brass)]">LIVE</span>
            <span className="text-[var(--ink-faint)]">·</span>
            <span className="text-[var(--ink-muted)]">{receipts.length} receipts</span>
            <span className="text-[var(--ink-faint)]">·</span>
            <span className="text-[var(--ink-muted)]">{openCount} open</span>
            <span className="text-[var(--ink-faint)]">·</span>
            <span className="text-[var(--stamp-win)]">{wonCount} won</span>
            <span className="text-[var(--ink-faint)]">·</span>
            <span className="text-[var(--stamp-loss)]">{lostCount} lost</span>
            <span className="text-[var(--ink-faint)]">·</span>
            <span className="text-[var(--ink-muted)]">{totalStaked.toFixed(2)} tUSDC staked</span>
          </div>
        </header>

        {error && (
          <div className="mt-6 flex items-center justify-between border border-[var(--stamp-loss)] bg-[#2a1512] px-4 py-3 text-sm text-[var(--ink-text)]">
            <span>{error}</span>
            <button onClick={refresh} className="ml-4 shrink-0 underline underline-offset-4 hover:text-[var(--brass)]">
              Retry
            </button>
          </div>
        )}

        {flash?.ok && (
          <p className="mt-6 text-xs text-[var(--ink-muted)]">
            Fill confirmed · receipt printed ·{" "}
            <a href={EXPLORER + flash.tx} target="_blank" rel="noreferrer" className="text-[var(--brass)] underline underline-offset-4">
              view tx {short(flash.tx, 10, 6)}
            </a>
          </p>
        )}

        {/* ── Live desk ────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Live desk</h2>
            <span className="text-[11px] text-[var(--ink-faint)]">soonest expiry first · YES side · 1 tUSDC</span>
          </div>

          {markets === null && !marketsError && (
            <ul className="divide-y divide-[var(--ink-line)] border-y border-[var(--ink-line)]">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                  <div className="skeleton h-8 w-32" />
                </li>
              ))}
            </ul>
          )}

          {marketsError && (
            <div className="border-y border-[var(--ink-line)] py-6 text-sm text-[var(--ink-muted)]">
              {marketsError} ·{" "}
              <button onClick={refresh} className="text-[var(--brass)] underline underline-offset-4">Retry</button>
            </div>
          )}

          {markets !== null && markets.length === 0 && !marketsError && (
            <div className="border-y border-[var(--ink-line)] py-6 text-sm text-[var(--ink-muted)]">
              No markets past the 2 minute mark right now. The venue rolls new windows continuously.
            </div>
          )}

          {markets !== null && markets.length > 0 && (
            <ul className="divide-y divide-[var(--ink-line)] border-y border-[var(--ink-line)]">
              {markets.slice(0, 8).map((m) => (
                <li
                  key={m.marketId}
                  className="group flex items-center justify-between gap-4 py-3.5 transition-colors duration-150 hover:bg-[var(--ink-800)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--ink-text)]">{m.question}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-faint)]">
                      closes in <span className={m.secsLeft < 300 ? "text-[var(--stamp-loss)]" : "text-[var(--ink-muted)]"}>{fmtSecs(m.secsLeft)}</span>
                      {" · "}
                      {short(m.marketId, 10, 4)}
                    </p>
                  </div>
                  <button
                    onClick={() => bet(m)}
                    disabled={betting !== null}
                    className="h-11 shrink-0 border border-[var(--brass-deep)] bg-[var(--brass)] px-4 text-xs font-bold uppercase tracking-wider text-[var(--ink-900)] transition-all duration-150 hover:brightness-110 active:scale-[0.96] disabled:opacity-40"
                  >
                    {betting === m.marketId ? "Staking…" : "Stake 1 · YES"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Receipts ─────────────────────────────────────────────── */}
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Receipts</h2>
            <button
              onClick={settle}
              disabled={settling || openCount === 0}
              className="h-9 border border-[var(--ink-line)] px-3 text-xs text-[var(--ink-muted)] transition-colors duration-150 hover:border-[var(--ink-faint)] hover:text-[var(--ink-text)] disabled:opacity-40 disabled:hover:border-[var(--ink-line)] disabled:hover:text-[var(--ink-muted)]"
              title={openCount === 0 ? "Nothing open to settle" : "Check each OPEN receipt against the chain"}
            >
              {settling ? "Checking the chain…" : "Settle against chain"}
            </button>
          </div>

          {receipts.length === 0 ? (
            <div className="border border-dashed border-[var(--ink-line)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
              No receipts yet. Stake on a live market above and the first one prints here.
            </div>
          ) : (
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
              {receipts.slice(0, 6).map((r, i) => (
                <li key={r.id} className="enter" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <article className="receipt px-5 pt-4">
                    {/* serial + clock */}
                    <div className="flex items-baseline justify-between text-[10px] tracking-wider text-[var(--paper-muted)]">
                      <span>RCPT {r.id.slice(2, 14).toUpperCase()}</span>
                      <span>{clock(r.placedAt)}</span>
                    </div>
                    {/* stamp sits on its own line, never over text */}
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <h3 className="text-[13px] font-bold leading-snug text-[var(--paper-ink)] text-balance">
                        {r.question || r.symbol}
                      </h3>
                      <span className={`stamp shrink-0 text-[11px] ${STAMP_STYLE[r.status]}`}>{r.status}</span>
                    </div>
                    {/* ledger lines */}
                    <dl className="mt-3 space-y-1 text-[11px] tabular-nums">
                      <div className="flex justify-between border-b border-dotted border-[var(--paper-edge)] pb-1">
                        <dt className="text-[var(--paper-muted)]">ENTRY</dt>
                        <dd className="text-[var(--paper-ink)]">{r.filled} YES @ {r.price.toFixed(3)}</dd>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-[var(--paper-edge)] pb-1">
                        <dt className="text-[var(--paper-muted)]">STAKED</dt>
                        <dd className="text-[var(--paper-ink)]">{(r.filled * r.price).toFixed(2)} tUSDC</dd>
                      </div>
                      {r.payout !== null && (
                        <div className="flex justify-between border-b border-dotted border-[var(--paper-edge)] pb-1">
                          <dt className="text-[var(--paper-muted)]">RETURNED</dt>
                          <dd className="text-[var(--paper-ink)]">{r.payout.toFixed(2)} tUSDC</dd>
                        </div>
                      )}
                      <div className="flex justify-between pt-1">
                        <dt className="text-[var(--paper-muted)]">TX</dt>
                        <dd>
                          <a
                            href={EXPLORER + r.txHash}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--paper-ink)] underline decoration-dotted underline-offset-2 hover:text-[var(--brass-deep)]"
                          >
                            {short(r.txHash, 10, 6)}
                          </a>
                        </dd>
                      </div>
                    </dl>
                    <div className="barcode mt-3" />
                    <p className="mt-1.5 text-center text-[9px] tracking-[0.3em] text-[var(--paper-muted)]">
                      SETTLED BY THE CHAIN · NOT THE DESK
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Board ────────────────────────────────────────────────── */}
        <section className="mt-16">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            Board · settled truth
          </h2>
          <ul className="divide-y divide-[var(--ink-line)] border-y border-[var(--ink-line)]">
            {board.length === 0 && (
              <li className="py-6 text-sm text-[var(--ink-muted)]">
                Nothing settled yet. Settle an open receipt to enter the board.
              </li>
            )}
            {board.map((row, i) => (
              <li key={row.wallet} className="flex items-center justify-between px-1 py-3.5 text-sm tabular-nums">
                <span className="text-[var(--ink-text)]">
                  <span className={`mr-3 text-xs ${i === 0 ? "text-[var(--brass)]" : "text-[var(--ink-faint)]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {short(row.wallet, 10, 6)}
                </span>
                <span className="text-xs">
                  <span className="text-[var(--ink-muted)]">{row.bets} calls</span>
                  <span className="text-[var(--ink-faint)]"> · </span>
                  <span className="text-[var(--stamp-win)]">{row.won}W</span>
                  <span className="text-[var(--ink-faint)]"> </span>
                  <span className="text-[var(--stamp-loss)]">{row.lost}L</span>
                  <span className="text-[var(--ink-faint)]"> · </span>
                  <span className="text-[var(--ink-muted)]">{row.returned.toFixed(2)} returned</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="mt-16 border-t border-[var(--ink-line)] pt-6 text-xs text-[var(--ink-faint)]">
          <p className="max-w-[70ch] leading-relaxed">
            Somnia Shannon testnet · chain 50312. Orders are IOC on the YES book. Receipts live in
            the desk's own log; the chain is the source of truth.
          </p>
          <p className="mt-2">
            Tally · built by{" "}
            <a
              href="https://x.com/a_raphie"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--ink-muted)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--brass)]"
            >
              Raphie
            </a>
            {" "}for the Somnia x DreamDEX Event Contracts Hackathon
          </p>
        </footer>
      </div>
    </main>
  );
}
