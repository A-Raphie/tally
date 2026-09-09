import { EXPLORER } from "./links";

export type CardReceipt = {
  id: string;
  txHash: string;
  marketId: string;
  question: string;
  symbol: string;
  outcome: "YES" | "NO";
  price: number;
  filled: number;
  placedAt: number;
  wallet: string;
  status: "OPEN" | "WON" | "LOST" | "VOID";
  payout: number | null;
  settledAt: number | null;
};

export const CHIP: Record<CardReceipt["status"], string> = {
  OPEN: "chip-open",
  WON: "chip-won",
  LOST: "chip-loss",
  VOID: "chip-void",
};

export const CARD_BORDER: Record<CardReceipt["status"], string> = {
  OPEN: "border-l-[var(--line-2)]",
  WON: "border-l-[var(--win)]",
  LOST: "border-l-[var(--loss-deep)]",
  VOID: "border-l-[var(--void)]",
};

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function short(a: string, head = 8, tail = 4): string {
  return a.length > head + tail + 2 ? `${a.slice(0, head)}···${a.slice(-tail)}` : a;
}

/* The verdict card is the product: shared by the landing hero (server-rendered
   live cards) and the desk. The provenance panel is the signature. */
export function VerdictCard({ r, big = false }: { r: CardReceipt; big?: boolean }) {
  const staked = r.filled * r.price;
  return (
    <article
      className={`enter card border-l-[3px] ${CARD_BORDER[r.status]} ${big ? "p-5" : "p-4"}`}
    >
      <div className="font-data flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[var(--text-3)]">
        <span>RCPT {r.id.slice(2, 14).toUpperCase()}</span>
        <span className={`chip ${CHIP[r.status]}`}>{r.status}</span>
        <span>{clock(r.placedAt)}</span>
      </div>
      <h3 className={`mt-2.5 font-semibold leading-snug text-balance ${big ? "text-base" : "text-sm"}`}>
        {r.question || r.symbol}
      </h3>
      <dl className="font-data mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between pt-1.5">
          <dt className="text-[var(--text-2)]">Entry</dt>
          <dd>
            {r.filled} {r.outcome} @ {r.price.toFixed(3)}
          </dd>
        </div>
        <div className="flex justify-between pt-1.5">
          <dt className="text-[var(--text-2)]">Staked</dt>
          <dd>{staked.toFixed(2)} tUSDC</dd>
        </div>
        {r.payout !== null && (
          <div className="flex justify-between pt-1.5">
            <dt className="text-[var(--text-2)]">Returned</dt>
            <dd className={r.status === "WON" ? "font-semibold text-[var(--win)]" : r.status === "LOST" ? "text-[var(--loss)]" : ""}>
              {r.payout.toFixed(2)} tUSDC
            </dd>
          </div>
        )}
      </dl>
      <details className="group mt-3 border-t border-[var(--line)] pt-2">
        <summary className="font-data cursor-pointer list-none text-[11px] text-[var(--text-3)] transition-colors duration-150 hover:text-[var(--text)]">
          Provenance <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">-</span>
        </summary>
        <div className="font-data mt-2 space-y-1 text-[11px] text-[var(--text-2)]">
          <p className="flex justify-between gap-3">
            <span className="text-[var(--text-3)]">fill tx</span>
            <a
              href={EXPLORER + r.txHash}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
            >
              {short(r.txHash, 12, 8)}
            </a>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-[var(--text-3)]">market</span>
            <span className="truncate">{short(r.marketId, 12, 6)}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-[var(--text-3)]">wallet</span>
            <span>{short(r.wallet, 10, 6)}</span>
          </p>
          <p className="pt-1 text-[11px] text-[var(--text-3)]">
            Verdict set by chain resolution, not by this desk.
          </p>
        </div>
      </details>
    </article>
  );
}
