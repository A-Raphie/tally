import Link from "next/link";
import { readReceipts } from "@/lib/store";
import { listLive, type LiveMarket } from "@/lib/dex";
import { VerdictCard } from "./_components/verdict-card";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const receipts = await readReceipts();
  const won = receipts.filter((r) => r.status === "WON").length;
  const lost = receipts.filter((r) => r.status === "LOST").length;
  const returned = receipts.reduce((s, r) => s + (r.payout ?? 0), 0);
  const open = receipts.filter((r) => r.status === "OPEN").length;
  const settled = receipts.filter((r) => r.status !== "OPEN").slice(0, 3);

  let markets: LiveMarket[] | null = null;
  try {
    markets = (await listLive()).slice(0, 4);
  } catch {
    markets = null;
  }

  return (
    <main>
      {/* ── hero: badge → title → subhead → CTA + ghost → proof → visual ── */}
      <header className="mx-auto max-w-4xl px-5 pt-20 pb-16 text-center">
        <p className="font-data mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-xs text-[var(--text-2)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--prophecy)]" />
          DreamDEX Event Contracts · Somnia testnet
        </p>
        <h1 className="mx-auto mt-8 max-w-[24ch] text-balance text-5xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
          Every prediction call leaves a{" "}
          <span className="text-[var(--accent)]">receipt</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-[52ch] text-pretty text-lg leading-relaxed text-[var(--text-2)]">
          The desk stakes 1 tUSDC on live DreamDEX markets, YES or NO side. Every fill prints a verdict card with
          its real transaction, and the chain, not the desk, decides WON or LOST.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/desk"
            className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-150 hover:bg-white/85 active:scale-[0.97]"
          >
            Enter the desk →
          </Link>
          <a
            href="#mechanism"
            className="inline-flex h-12 items-center rounded-full border border-[var(--line-2)] bg-[var(--surface)] px-7 text-sm font-semibold text-[var(--text)] transition-colors duration-150 hover:bg-[var(--surface-2)]"
          >
            Read the mechanics
          </a>
        </div>
        <p className="font-data mt-7 text-xs text-[var(--text-2)]">
          {receipts.length} cards printed · {won}W {lost}L settled · {returned.toFixed(2)} tUSDC
          returned on this deployment
        </p>
      </header>

      {/* hero visual: live verdict cards, nothing is a screenshot */}
      <section className="mx-auto max-w-3xl px-5">
        {receipts.length === 0 ? (
          <div className="card px-6 py-10 text-center text-sm text-[var(--text-2)]">
            No cards yet. The desk prints the first one on its next stake; this panel renders it
            live.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {receipts.slice(0, 2).map((r, i) => (
              <VerdictCard key={r.id} r={r} big />
            ))}
          </div>
        )}
      </section>

      {/* ── problem stat cards ─────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 pt-24">
        <h2 className="text-2xl font-bold tracking-[-0.02em]">Agent P&L arrives as screenshots.</h2>
        <p className="mt-3 max-w-[60ch] text-pretty text-[var(--text-2)]">
          Screenshots settle nothing: no fill you can open, no resolution you can check, no way to
          tell a good trader from a good storyteller.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { n: "64", t: "BUIDLs in this hackathon, most of them agents. Judge time per entry: minutes." },
            { n: "25%", t: "of the score is technical implementation. A screenshot cannot carry it." },
            { n: "0", t: "verdicts marked by this desk. The chain resolves; the desk only reads." },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <p className="font-data text-4xl font-bold">{s.n}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── thesis moment ──────────────────────────────────────────── */}
      <section className="mt-24 border-y border-[var(--line)] bg-[var(--surface)] py-20 text-center">
        <p className="mx-auto max-w-[26ch] text-balance text-4xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Trust the <span className="text-[var(--accent)]">receipt</span>, not the storyteller.
        </p>
        <p className="mx-auto mt-5 max-w-[52ch] text-pretty text-[var(--text-2)]">
          One line of settlement math beats a page of claimed profits, because the chain signed it.
        </p>
      </section>

      {/* ── mechanism: numbered steps + mono flow line ─────────────── */}
      <section id="mechanism" className="mx-auto max-w-4xl px-5 pt-24">
        <h2 className="text-2xl font-bold tracking-[-0.02em]">How a bet becomes proof</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { n: "01", t: "Stake", d: "The desk crosses the YES book with an IOC limit, 1 tUSDC, on a live market." },
            { n: "02", t: "Print", d: "The fill prints a verdict card: serial, entry, size, price, and the fill transaction." },
            { n: "03", t: "Settle", d: "When the market finalizes onchain, the card flips WON or LOST with the payout computed." },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <p className="font-data text-xs text-[var(--accent)]">{s.n}</p>
              <p className="mt-2 text-lg font-semibold">{s.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="font-data mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center text-xs text-[var(--text-2)]">
          stake → fill → card → finalize → verdict → board
        </p>
      </section>

      {/* ── why-blocks ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 pt-24">
        <h2 className="text-2xl font-bold tracking-[-0.02em]">Why receipts change the game</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Settleable", d: "A receipt points at a real position on a real market, so it resolves to WON or LOST with no human opinion." },
            { t: "Provable", d: "Every card opens its provenance: the fill transaction, the market id, the wallet. Click through to the explorer." },
            { t: "Ranked", d: "The board only counts settled outcomes. Claims never enter the ranking; the chain's verdict does." },
          ].map((b) => (
            <div key={b.t} className="card p-5">
              <p className="text-lg font-semibold">{b.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── desk catalog: live board preview ───────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 pt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">The desk right now</h2>
          <Link href="/desk" className="text-sm font-semibold text-[var(--accent)] hover:underline">
            Open the desk →
          </Link>
        </div>
        <div className="card mt-6 divide-y divide-[var(--line)]">
          {markets === null ? (
            <p className="px-5 py-6 text-sm text-[var(--text-2)]">
              Live board unreachable from the landing. The desk retries on open.
            </p>
          ) : markets.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[var(--text-2)]">
              No markets past the 2 minute mark right now. The venue rolls new windows continuously.
            </p>
          ) : (
            markets.map((m) => (
              <div key={m.marketId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3.5">
                <p className="min-w-0 flex-1 basis-64 truncate text-sm">{m.question}</p>
                <p className="font-data text-xs text-[var(--text-2)]">
                  {m.price !== null ? (
                    <>
                      YES {m.price.toFixed(2)} <span className="text-[var(--text-3)]">· pays 1.00</span>
                    </>
                  ) : (
                    <span className="text-[var(--text-3)]">no book</span>
                  )}
                  <span className="text-[var(--text-3)]"> · closes {new Date(m.expiry * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── receipts / live proof ──────────────────────────────────── */}
      {settled.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 pt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Settled by the chain</h2>
            <span className="font-data text-xs text-[var(--text-2)]">
              {won}W {lost}L · {returned.toFixed(2)} tUSDC returned
            </span>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {settled.map((r) => (
              <VerdictCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── faq ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 pt-24">
        <h2 className="text-2xl font-bold tracking-[-0.02em]">Questions the desk expects</h2>
        <div className="mt-6 space-y-3">
          {[
            {
              q: "Is this real money?",
              a: "No. Somnia Shannon testnet: gas is faucet STT, collateral is testnet tUSDC, and no mainnet funds exist anywhere in the desk.",
            },
            {
              q: "Who decides WON or LOST?",
              a: "The market's onchain resolution, read through the indexer after it finalizes. The desk validates fills and reads results; it cannot flip a card by hand.",
            },
            {
              q: "Can winnings be withdrawn?",
              a: "Not yet. Cards settle the math against the chain's resolution; redeeming positions through the trader tier is the documented next step.",
            },
          ].map((f) => (
            <details key={f.q} className="card group px-5 py-4" open={f.q.startsWith("Is this") ? undefined : undefined}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold transition-colors duration-150 hover:text-[var(--text-2)]">
                {f.q}
                <span className="text-[var(--text-3)] group-open:hidden">+</span>
                <span className="hidden text-[var(--text-3)] group-open:inline">−</span>
              </summary>
              <p className="mt-3 max-w-[68ch] text-pretty text-sm leading-relaxed text-[var(--text-2)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── final CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 pt-24">
        <div className="card px-8 py-14 text-center">
          <p className="text-balance text-2xl font-bold tracking-[-0.02em]">
            The desk is live on Somnia Shannon testnet.
          </p>
          <Link
            href="/desk"
            className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-150 hover:bg-white/85 active:scale-[0.97]"
          >
            Enter the desk →
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-4xl px-5 py-14 text-sm text-[var(--text-2)]">
        <p className="max-w-[74ch] leading-relaxed">
          Testnet deployment: reads need no wallet; writes are the desk&apos;s own testnet agent.
          Built for the Somnia x DreamDEX Event Contracts Hackathon.
        </p>
        <p className="mt-3">
          Tally · built by{" "}
          <a
            href="https://x.com/a_raphie"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--text)] underline-offset-4 hover:underline"
          >
            Raphie
          </a>
        </p>
      </footer>
    </main>
  );
}
