import Link from "next/link";
import { readReceipts } from "@/lib/store";
import { VerdictCard } from "./_components/verdict-card";

export const dynamic = "force-dynamic";

function Section({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <h2 className="mb-5 flex items-baseline gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-3)]">
        <span className="text-[var(--text-2)]">{n} /</span> {label}
      </h2>
      {children}
    </section>
  );
}

export default async function Landing() {
  const receipts = await readReceipts();
  const won = receipts.filter((r) => r.status === "WON").length;
  const lost = receipts.filter((r) => r.status === "LOST").length;
  const returned = receipts.reduce((s, r) => s + (r.payout ?? 0), 0);
  const open = receipts.filter((r) => r.status === "OPEN").length;
  const proof = receipts.slice(0, 2);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <header className="pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-3)]">
            Somnia Shannon · DreamDEX Event Contracts · Testnet
          </p>
          <Link
            href="/desk"
            className="border border-[var(--line-2)] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--text-2)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            Desk →
          </Link>
        </div>
        <h1 className="mt-10 max-w-[20ch] text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl">
          Every prediction call leaves a receipt.
        </h1>
        <p className="mt-6 max-w-[62ch] text-sm leading-relaxed text-[var(--text-2)] text-pretty">
          Tally is a settlement instrument for DreamDEX Event Contracts. The desk stakes 1 tUSDC
          YES on live markets. Every fill prints a verdict card carrying its real transaction.
          When the market finalizes onchain, the card flips to WON or LOST with the payout math
          attached. The desk never marks its own homework.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/desk"
            className="h-12 border border-[var(--line-2)] bg-[var(--text)] px-6 text-xs font-bold uppercase tracking-[0.18em] leading-[3rem] text-[var(--bg)] transition-all duration-150 hover:bg-[var(--text-2)] active:scale-[0.98]"
          >
            Enter the desk
          </Link>
          <a
            href="#mechanism"
            className="text-xs uppercase tracking-[0.18em] text-[var(--text-2)] underline decoration-dotted underline-offset-4 transition-colors duration-150 hover:text-[var(--text)]"
          >
            Read the mechanics
          </a>
        </div>
        <p className="mt-6 text-xs tabular-nums text-[var(--text-2)]">
          live on this deployment: {receipts.length} cards printed · {won}W {lost}L settled ·{" "}
          {returned.toFixed(2)} tUSDC returned · {open} open
        </p>
      </header>

      {/* ── hero visual: the live cards, not screenshots ─────────────── */}
      <section className="mt-10 border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-3)]">
            Latest verdict cards
          </h2>
          <span className="text-[10px] text-[var(--text-3)]">rendered live from the desk log</span>
        </div>
        {proof.length === 0 ? (
          <div className="mt-4 border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--text-2)]">
            No cards yet. The desk prints the first one on its next stake; this panel renders it
            live.
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {proof.map((r) => (
              <VerdictCard key={r.id} r={r} big />
            ))}
          </div>
        )}
      </section>

      {/* ── problem ──────────────────────────────────────────────────── */}
      <Section n="01" label="The problem">
        <p className="max-w-[64ch] text-lg leading-snug text-[var(--text)] text-balance">
          Agent track records arrive as screenshots. Screenshots settle nothing: no fill you can
          open, no resolution you can check, no way to tell a good trader from a good storyteller.
        </p>
        <div className="mt-6 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
          <div className="bg-[var(--surface)] p-5">
            <p className="text-3xl font-bold tabular-nums">64</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">
              BUIDLs in this hackathon, most of them agents. Judge time per entry: minutes.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-5">
            <p className="text-3xl font-bold tabular-nums">25%</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">
              of the score is technical implementation. A screenshot cannot carry it.
            </p>
          </div>
          <div className="bg-[var(--surface)] p-5">
            <p className="text-3xl font-bold tabular-nums">0</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">
              verdicts marked by this desk. The chain resolves; the desk only reads.
            </p>
          </div>
        </div>
      </Section>

      {/* ── thesis moment ────────────────────────────────────────────── */}
      <section className="mt-20 border-y border-[var(--line)] py-14 text-center">
        <p className="text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
          Trust the receipt,
          <br />
          not the storyteller.
        </p>
        <p className="mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--text-2)] text-pretty">
          One line of settlement math beats a page of claimed profits, because the chain signed it.
        </p>
      </section>

      {/* ── mechanism ────────────────────────────────────────────────── */}
      <Section n="02" label="Mechanism">
        <ol className="grid gap-5 sm:grid-cols-3">
          {[
            {
              n: "STAKE",
              t: "The desk crosses the YES book with an IOC limit, 1 tUSDC, on a live DreamDEX market.",
            },
            {
              n: "PRINT",
              t: "The fill prints a verdict card: serial, entry, size, price, and the fill transaction.",
            },
            {
              n: "SETTLE",
              t: "When the market finalizes onchain, the card flips WON or LOST with the payout computed.",
            },
          ].map((s) => (
            <li key={s.n} className="border border-[var(--line)] bg-[var(--surface)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-2)]">
                {s.n}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{s.t}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-xs text-[var(--text-2)]">
          stake → fill → card → finalize → verdict → board
        </p>
      </Section>

      {/* ── can / cannot ─────────────────────────────────────────────── */}
      <Section n="03" label="What it does and does not do">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          <ul className="space-y-3 bg-[var(--surface)] p-5 text-sm">
            {[
              "Every card carries its real fill transaction, linked to the explorer",
              "Settlement is read from the market's onchain resolution",
              "Provenance opens on every card: tx, market, wallet",
              "The board ranks by settled outcomes only",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="text-[var(--win)]">✓</span>
                <span className="text-[var(--text-2)]">{t}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-3 bg-[var(--surface)] p-5 text-sm">
            {[
              "No claimed P&L anywhere: only settled math",
              "No manual verdicts: the desk cannot flip a card by hand",
              "No mainnet funds: testnet STT and tUSDC only",
              "No redemption yet: cards settle the math; onchain redeem is next",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="text-[var(--loss)]">✗</span>
                <span className="text-[var(--text-2)]">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── faq ──────────────────────────────────────────────────────── */}
      <Section n="04" label="Questions the desk expects">
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
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
            <details key={f.q} className="group px-1 py-4">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 text-sm text-[var(--text)] transition-colors duration-150 hover:text-[var(--text-2)]">
                {f.q}
                <span className="text-[var(--text-3)] group-open:hidden">+</span>
                <span className="hidden text-[var(--text-3)] group-open:inline">-</span>
              </summary>
              <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-[var(--text-2)] text-pretty">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* ── final cta ────────────────────────────────────────────────── */}
      <section className="mt-20 border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
        <p className="text-lg text-balance">The desk is live on Somnia Shannon testnet.</p>
        <Link
          href="/desk"
          className="mt-5 inline-block h-12 border border-[var(--line-2)] bg-[var(--text)] px-6 text-xs font-bold uppercase tracking-[0.18em] leading-[3rem] text-[var(--bg)] transition-all duration-150 hover:bg-[var(--text-2)] active:scale-[0.98]"
        >
          Enter the desk
        </Link>
      </section>

      <footer className="mt-14 border-t border-[var(--line)] pt-6 text-xs text-[var(--text-2)]">
        <p className="max-w-[74ch] leading-relaxed">
          Testnet deployment: reads need no wallet; writes are the desk&apos;s own testnet agent.
          Prize context: Somnia x DreamDEX Event Contracts Hackathon.
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
        </p>
      </footer>
    </main>
  );
}
