"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VerdictCard, clock, short, type CardReceipt as Receipt } from "../_components/verdict-card";
import { EXPLORER } from "../_components/links";

type Market = {
  marketId: string;
  question: string;
  secsLeft: number;
  expiry: number;
  price: number | null;
  ask: number | null;
  poolAddress: string;
};

type BoardRow = {
  wallet: string;
  bets: number;
  staked: number;
  won: number;
  lost: number;
  returned: number;
};

type Conn = "up" | "down";


function fmtSecs(s: number): string {
  const t = Math.max(0, Math.floor(s));
  if (t <= 0) return "closing";
  if (t < 3600) return `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, "0")}s`;
  if (t < 86400) return `${Math.floor(t / 3600)}h ${Math.floor((t % 3600) / 60)}m`;
  return `${Math.floor(t / 86400)}d ${Math.floor((t % 86400) / 3600)}h`;
}

function assetOf(q: string): string {
  const m = q.match(/^(BTC|ETH|SOL|SOMI)\b/i);
  return m ? m[1].toUpperCase() : "EV";
}

function PriceTag({ price }: { price: number | null }) {
  if (price === null || Number.isNaN(price)) return <span className="text-[var(--text-3)]">no book</span>;
  const no = Math.max(0, 1 - price);
  return (
    <span className="tabular-nums">
      <span className="text-[var(--text)]">YES {price.toFixed(2)}</span>
      <span className="text-[var(--text-3)]"> · </span>
      <span className="text-[var(--text)]">NO {no.toFixed(2)}</span>
      <span className="text-[var(--text-3)]"> · pays 1.00</span>
    </span>
  );
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [betting, setBetting] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tx: string } | null>(null);
  const [conn, setConn] = useState<Conn>("up");
  const [now, setNow] = useState(() => Date.now());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // the desk ticks locally between polls; nothing freezes for 15s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [m, r, b] = await Promise.all([
        fetch("/api/markets").then((x) => x.json()),
        fetch("/api/receipts").then((x) => x.json()),
        fetch("/api/board").then((x) => x.json()),
      ]);
      // partial outage: keep the last good state, never wipe history with {error}
      if (m.error && r.error && b.error) {
        setConn("down");
        setPollError("tally server unreachable · showing last known state");
        return;
      }
      if (!m.error) setMarkets(m.markets ?? []);
      if (!r.error) setReceipts(r.receipts ?? []);
      if (!b.error) setBoard(b.board ?? []);
      setConn("up");
      setPollError(null);
    } catch {
      setConn("down");
      setPollError("tally server unreachable · showing last known state");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  async function bet(m: Market, outcome: "YES" | "NO") {
    setBetting(m.marketId + outcome);
    setError(null);
    setPollError(null);
    try {
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId: m.marketId, amount: 1, question: m.question, outcome }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setFlash({ tx: json.receipt?.txHash ?? "" });
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 6000);
      await refresh();
      // bring the fresh card to your eyes: the click happened at the desk row,
      // the proof prints in the hero band
      requestAnimationFrame(() => {
        const el = document.querySelector("[data-latest-card]");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("print-ring");
          setTimeout(() => el.classList.remove("print-ring"), 5000);
        }
      });
    } catch (e) {
      setError(String((e as Error).message ?? e));
      requestAnimationFrame(() => {
        document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } finally {
      setBetting(null);
    }
  }

  async function settle() {
    setSettling(true);
    setError(null);
    setPollError(null);
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
  const returned = receipts.reduce((s, r) => s + (r.payout ?? 0), 0);
  const staked = receipts.reduce((s, r) => s + r.filled * r.price, 0);
  const heldIds = new Set(receipts.map((r) => r.marketId));
  const latest = receipts[0];
  const desk = markets === null ? null : markets.slice(0, 5);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pb-16">
        {/* ── masthead + status strip: chrome never lies ────────────── */}
        <header className="pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <a href="/" className="text-3xl font-bold tracking-[0.08em] hover:text-[var(--text-2)]">
              TALLY<span className="text-[var(--text-3)]">_</span>
            </a>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-3)]">
              Settlement instrument
            </p>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-[var(--line)] py-2 text-[10px] uppercase tracking-[0.22em]"
          >
            <span className="flex items-center gap-2">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${conn === "up" ? "bg-[var(--prophecy)]" : "bg-[var(--text-3)]"}`}
              />
              <span className={conn === "up" ? "text-[var(--prophecy)]" : "text-[var(--text-2)]"}>
                {conn === "up" ? "Connected" : "Reconnecting"}
              </span>
            </span>
            <span className="text-[var(--text-3)]">·</span>
            <span className="text-[var(--text-2)]">Somnia Shannon 50312</span>
            <span className="text-[var(--text-3)]">·</span>
            <span className="text-[var(--text-2)]">DreamDEX Event Contracts</span>
            <span className="text-[var(--text-3)]">·</span>
            <span className="text-[var(--text-3)]">Testnet</span>
          </div>
          <p className="mt-5 max-w-[68ch] text-sm leading-relaxed text-[var(--text-2)] text-pretty">
            The desk stakes 1 tUSDC YES on live prediction markets. Every fill prints a verdict
            card carrying its real transaction; when the market finalizes, the chain, not the desk,
            flips it to WON or LOST. Every number shows its source.
          </p>
        </header>

        {/* how staking works: the click directs a funded agent, no wallet */}
        <p className="mt-4 border border-[var(--line)] bg-[var(--surface)] rounded-lg px-4 py-3 text-sm leading-relaxed text-[var(--text-2)]">
          <span className="font-semibold text-[var(--text)]">How staking works:</span> there is no
          wallet to connect. Every click directs this desk&apos;s funded testnet agent to stake 1
          tUSDC from its own balance and prints the card here. Nothing of yours is ever at stake.
        </p>

        {(betting || settling) && (
          <p className="font-data mt-4 text-xs text-[var(--prophecy)]" role="status" aria-live="polite">
            {settling
              ? "Reading each open card against the market's onchain resolution…"
              : "Crossing the book on Somnia and printing the card… can take a few seconds."}
          </p>
        )}

        {/* alerts */}
        <div aria-live="polite">
          {error && (
            <div
              role="alert"
              className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-[var(--line-2)] bg-[var(--surface)] px-4 py-3 text-sm"
            >
              <span>{error}</span>
              <button onClick={refresh} className="underline underline-offset-4 hover:text-[var(--text)]">
                Retry
              </button>
            </div>
          )}
          {flash && (
            <p className="mt-5 text-xs text-[var(--text-2)]">
              Fill confirmed · verdict card printed ·{" "}
              <a
                href={EXPLORER + flash.tx}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-[var(--text)]"
              >
                tx {short(flash.tx, 10, 6)}
              </a>
            </p>
          )}
        </div>

        {/* ── hero band: proof before actions ───────────────────────── */}
        <section className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Latest verdict card
              </h2>
              <span className="text-[10px] text-[var(--text-3)]">the product is the card</span>
            </div>
            {latest ? (
              <div data-latest-card>
                <VerdictCard r={latest} big />
              </div>
            ) : (
              <div className="mt-4 border border-dashed border-[var(--line)] px-4 py-8 text-sm text-[var(--text-2)]">
                No verdict cards yet. Stake on the desk below and the first one prints here with its
                real transaction.
              </div>
            )}
          </div>
          <div className="flex flex-col gap-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Settled truth
              </h2>
              <p className="mt-3 text-5xl font-bold tracking-tight">
                {wonCount}
                <span className="text-[var(--text-3)]">W</span>{" "}
                <span className="text-[var(--loss)]">{lostCount}</span>
                <span className="text-[var(--text-3)]">L</span>
              </p>
              <dl className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between border-t border-[var(--line)] pt-1.5">
                  <dt className="text-[var(--text-2)]">staked</dt>
                  <dd>{staked.toFixed(2)} tUSDC</dd>
                </div>
                <div className="flex justify-between border-t border-[var(--line)] pt-1.5">
                  <dt className="text-[var(--text-2)]">returned</dt>
                  <dd>{returned.toFixed(2)} tUSDC</dd>
                </div>
                <div className="flex justify-between border-t border-[var(--line)] pt-1.5">
                  <dt className="text-[var(--text-2)]">open</dt>
                  <dd>{openCount}</dd>
                </div>
              </dl>
              <button
                onClick={settle}
                disabled={settling || openCount === 0}
                className="font-data mt-5 h-11 w-full rounded-full border border-[var(--line-2)] text-xs font-semibold transition-colors duration-150 hover:bg-[var(--surface-2)] disabled:opacity-40"
              >
                {settling ? "Checking the chain…" : `Settle ${openCount} open`}
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-2)]">
                Checks each open card against the market&apos;s onchain resolution and flips it.
              </p>
            </div>
          </div>
        </section>

        {/* ── live desk: price before you stake ─────────────────────── */}
        <section className="mt-12">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              01 / Live desk
            </h2>
            <span className="text-[11px] text-[var(--text-2)]">
              soonest expiry first · YES side · 1 tUSDC · IOC
            </span>
          </div>

          {desk === null && conn === "up" && (
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                  <div className="skeleton h-11 w-28" />
                </li>
              ))}
            </ul>
          )}

          {desk !== null && desk.length === 0 && (
            <div className="border-y border-[var(--line)] py-6 text-sm text-[var(--text-2)]">
              No markets past the 2 minute mark right now. The venue rolls new windows continuously.
            </div>
          )}

          {desk !== null && desk.length > 0 && (
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {desk.map((m) => {
                const secsLeft = Math.max(0, m.expiry - now / 1000);
                const closing = secsLeft < 300;
                const held = heldIds.has(m.marketId);
                return (
                  <li
                    key={m.marketId}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 transition-colors duration-150 hover:bg-[var(--surface)] sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="flex items-center gap-2 truncate text-sm">
                        {held && (
                          <span
                            title="you hold a receipt on this market"
                            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--win)]"
                          />
                        )}
                        <span className="truncate">{m.question}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-2)]">
                        <PriceTag price={m.price} />
                        <span className="text-[var(--text-3)]"> · </span>
                        <span>
                          {assetOf(m.question)} · closes {clock(m.expiry * 1000)}
                        </span>
                        <span className={closing ? "text-[var(--text)]" : "text-[var(--text-3)]"}>
                          {" · "}
                          {closing ? "CLOSING " : ""}
                          {fmtSecs(secsLeft)}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => bet(m, "YES")}
                        disabled={betting !== null || m.ask === null}
                        title={m.ask === null ? "No ask on the book yet: nothing to cross" : undefined}
                        aria-label={`Stake 1 tUSDC on YES: ${m.question}`}
                        className="font-data h-10 rounded-full bg-[var(--accent)] px-5 text-xs font-semibold text-white transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.96] disabled:opacity-40"
                      >
                        {betting === m.marketId + "YES" ? "Staking…" : "YES"}
                      </button>
                      <button
                        onClick={() => bet(m, "NO")}
                        disabled={betting !== null || m.ask === null}
                        title={m.ask === null ? "No ask on the book yet: nothing to cross" : "Stake 1 tUSDC on NO"}
                        aria-label={`Stake 1 tUSDC on NO: ${m.question}`}
                        className="font-data h-10 rounded-full border border-[var(--line-2)] px-5 text-xs font-semibold text-[var(--text)] transition-all duration-150 hover:bg-[var(--surface-2)] active:scale-[0.96] disabled:opacity-40"
                      >
                        {betting === m.marketId + "NO" ? "Staking…" : "NO"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── verdict cards ─────────────────────────────────────────── */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              02 / Verdict cards
            </h2>
            <span className="text-[11px] text-[var(--text-2)]">
              {receipts.length} printed · every line carries its source
            </span>
          </div>

          {receipts.length === 0 ? (
            <div className="border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--text-2)]">
              Nothing printed yet. One stake above and the first card lands in the hero band.
            </div>
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2">
                {receipts.slice(1, 13).map((r, i) => (
                  <li key={r.id} className="enter" style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
                    <VerdictCard r={r} />
                  </li>
                ))}
              </ul>
              {receipts.length > 13 && (
                <p className="mt-3 text-xs text-[var(--text-2)]">
                  {receipts.length - 13} earlier cards in the desk log.
                </p>
              )}
            </>
          )}
        </section>

        {/* ── board ─────────────────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">
            03 / Board · settled truth only
          </h2>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {board.length === 0 && (
              <li className="py-6 text-sm text-[var(--text-2)]">
                Nothing settled yet. Settle an open card to enter the board.
              </li>
            )}
            {board.map((row, i) => (
              <li key={row.wallet} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 py-3.5 text-sm">
                <span>
                  <span className={`mr-3 text-xs ${i === 0 ? "text-[var(--text)]" : "text-[var(--text-3)]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {short(row.wallet, 10, 6)}
                </span>
                <span className="text-xs text-[var(--text-2)]">
                  {row.bets} calls ·{" "}
                  <span className="text-[var(--win)]">{row.won}W</span>{" "}
                  <span className="text-[var(--loss)]">{row.lost}L</span> · {row.returned.toFixed(2)} returned
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-14 border-t border-[var(--line)] pt-6 text-xs text-[var(--text-2)]">
          <p className="max-w-[74ch] leading-relaxed">
            Somnia Shannon testnet · chain 50312. Orders are IOC limit crosses of the YES book,
            sized 1 tUSDC. Verdict cards live in the desk&apos;s own log; the chain is the source of
            truth for every verdict.
          </p>
          <p className="mt-2">
            Tally · built by{" "}
            <a
              href="https://x.com/a_raphie"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 transition-colors duration-150 hover:text-[var(--text)]"
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

