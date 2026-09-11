import { exchange } from "./dex";

// Verdict cards are DERIVED from the indexer's fill tape for the agent wallet.
// There is no per-instance store: every visitor, on every instance, sees the
// same cards because the chain is the ledger. Settlement status is computed
// live from each market's onchain resolution.
export type CardReceipt = {
  id: string;
  txHash: string;
  orderId: string;
  marketId: string;
  question: string;
  symbol: string;
  outcome: "YES" | "NO";
  side: "buy";
  price: number;
  amount: number;
  filled: number;
  placedAt: number;
  wallet: string;
  status: "OPEN" | "WON" | "LOST" | "VOID";
  payout: number | null;
  settledAt: number | null;
};

const INDEXER = "https://dev.smk.somnia.host/v1/graphql";

export async function agentWallet(): Promise<string> {
  const { privateKeyToAccount } = await import("viem/accounts");
  return privateKeyToAccount(process.env.TALLY_TEST_PRIVATE_KEY as `0x${string}`).address;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(INDEXER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: unknown[] };
  if (json.errors) throw new Error("indexer: " + JSON.stringify(json.errors).slice(0, 300));
  return json.data as T;
}

type MarketMeta = {
  marketId: string;
  question: string;
  quoteDecimals: number;
  baseDecimals: number;
  winningOutcome: number | null;
  voided: boolean;
  finalized: boolean;
};

async function marketMeta(ids: string[]): Promise<Map<string, MarketMeta>> {
  if (ids.length === 0) return new Map();
  const data = await gql<{ Market: Array<Record<string, unknown>> }>(
    `query Ms($ids: [String!]) {
      Market(where: { marketId: { _in: $ids } }) {
        marketId question quoteDecimals baseDecimals
        winningOutcome voided finalized resolvedAtTimestamp
      }
    }`,
    { ids }
  );
  const map = new Map<string, MarketMeta>();
  for (const row of data.Market ?? []) {
    map.set(String(row.marketId), {
      marketId: String(row.marketId),
      question: String(row.question ?? ""),
      quoteDecimals: Number(row.quoteDecimals ?? 6),
      baseDecimals: Number(row.baseDecimals ?? 6),
      winningOutcome:
        row.winningOutcome === null || row.winningOutcome === undefined ? null : Number(row.winningOutcome),
      voided: Boolean(row.voided),
      finalized: Boolean(row.finalized),
    });
  }
  return map;
}

export async function deriveCards(): Promise<CardReceipt[]> {
  const wallet = (await agentWallet()).toLowerCase();
  const ex = exchange();
  // the indexer caps one read at 50 rows: page the tape
    const [page1, page2] = await Promise.all([
      ex.client.getUserFills(wallet, { limit: 50 }),
      ex.client.getUserFills(wallet, { limit: 50, offset: 50 }),
    ]);
    const fills = [...page1, ...page2];
  const ours = fills
    .filter((f) => (f.taker ?? "").toLowerCase() === wallet)
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, 200);

  const meta = await marketMeta(ours.map((f) => String(f.market)));
  const cards: CardReceipt[] = [];
  for (const f of ours) {
    const m = meta.get(String(f.market));
    const quoteDec = m?.quoteDecimals ?? 6;
    const baseDec = m?.baseDecimals ?? 6;
    const side: string | null = f.takerOrder?.side ?? f.takerSide ?? null;
    const outcome: "YES" | "NO" = side ? (side.startsWith("BUY_NO") || side === "NO" ? "NO" : "YES") : "YES";

    const price = Number(f.fillPrice) / 10 ** quoteDec;
    const filled = Number(f.quantity) / 10 ** baseDec;
    const staked = filled * price;

    let status: CardReceipt["status"] = "OPEN";
    let payout: number | null = null;
    if (m && (m.finalized || m.voided)) {
      if (m.voided) { status = "VOID"; payout = filled * 0.5; }
      else if (m.winningOutcome === null) { status = "OPEN"; }
      else if ((m.winningOutcome === 0) === (outcome === "YES")) { status = "WON"; payout = filled * 1; }
      else { status = "LOST"; payout = 0; }
    }

    cards.push({
      id: f.id,
      txHash: f.txHash,
      orderId: f.takerOrderId,
      marketId: String(f.market),
      question: m?.question ?? "",
      symbol: `${outcome}·${String(f.market).slice(0, 10)}`,
      outcome,
      side: "buy",
      price,
      amount: filled,
      filled,
      placedAt: Number(f.timestamp) * 1000,
      wallet,
      status,
      payout,
      settledAt: status === "OPEN" ? null : Date.now(),
    });
  }
  return cards;
}

// kept for the settle endpoint's response shape
export function countSettled(cards: CardReceipt[]): { checked: number; settled: number } {
  const open = cards.filter((c) => c.status === "OPEN").length;
  const done = cards.filter((c) => c.status !== "OPEN").length;
  return { checked: open, settled: done };
}
