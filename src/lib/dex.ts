import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const INDEXER = "https://dev.smk.somnia.host/v1/graphql";

let cached: SomniaMarkets | undefined;

let registryAt = 0;

async function ensureRegistry(): Promise<void> {
  if (Date.now() - registryAt <= 5 * 60 * 1000) return;
  await exchange().loadMarkets(true);
  registryAt = Date.now();
}

export function exchange(): SomniaMarkets {
  if (cached) return cached;
  const key = process.env.TALLY_TEST_PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) throw new Error("TALLY_TEST_PRIVATE_KEY missing");
  cached = new SomniaMarkets({
    indexerUrl: INDEXER,
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: key,
  });
  return cached;
}

// is there a crossable ask right now? (lastPrice alone lies: a market can
// have traded before and have an empty book now)
export async function getAsk(marketId: string): Promise<number | null> {
  try {
    await ensureRegistry();
    const book = await exchange().fetchOrderBook(marketId, 1);
    const ask = book.asks[0]?.[0];
    return ask === undefined ? null : ask;
  } catch {
    return null;
  }
}

export type LiveMarket = {
  marketId: string;
  question: string;
  poolAddress: string;
  status: string;
  expiry: number;
  secsLeft: number;
  yesTokenId: string | null;
  noTokenId: string | null;
  quoteDecimals: number | null;
  price: number | null;
  ask: number | null;
};

export async function listLive(): Promise<LiveMarket[]> {
  const ex = exchange();
  const rows = await ex.client.listLiveBinaryMarkets({ limit: 30 });
  const now = Date.now() / 1000;
  return rows
    .map((m) => ({
      marketId: String(m.marketId),
      question: m.question || "(untitled)",
      poolAddress: String(m.poolAddress),
      status: String(m.status ?? ""),
      expiry: Number(m.expiry),
      secsLeft: Math.round(Number(m.expiry) - now),
      yesTokenId: m.yesTokenId ? String(m.yesTokenId) : null,
      noTokenId: m.noTokenId ? String(m.noTokenId) : null,
      quoteDecimals: m.quoteDecimals != null ? Number(m.quoteDecimals) : null,
      price:
        m.lastPrice != null && m.quoteDecimals != null
          ? Number(m.lastPrice) / 10 ** Number(m.quoteDecimals)
          : null,
    }))
    .filter((m) => m.secsLeft > 120)
    .sort((a, b) => a.secsLeft - b.secsLeft);
}

export type BetResult = {
  txHash: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  filled: number;
};

export async function placeBet(
  marketId: string,
  amount: number,
  outcome: "YES" | "NO" = "YES"
): Promise<BetResult> {
  const ex = exchange();
  await ensureRegistry();

  const onchain = await ex.client.getMarketOnchain(marketId as `0x${string}`);
  if (onchain.status !== 1) throw new Error(`market not Trading (status ${onchain.status})`);

  // resolve the outcome's canonical tradable symbol from the unified registry
  let ref = marketId;
  if (outcome === "NO") {
    const all = await ex.loadMarkets(true);
    for (const um of Object.values(all)) {
      const u = um as { id?: string; marketId?: string; outcomes?: Array<{ symbol?: string }> };
      if (String(u.id ?? u.marketId ?? "") !== marketId) continue;
      const noSymbol = u.outcomes?.[1]?.symbol;
      if (!noSymbol) throw new Error("market has no NO outcome symbol");
      ref = noSymbol;
      break;
    }
    if (ref === marketId) throw new Error("market not found in registry for NO outcome");
  }
  const book = await ex.fetchOrderBook(ref, 5);
  const ask = book.asks[0]?.[0];
  if (ask === undefined) throw new Error(`no resting ask on ${outcome} book`);
  const price = Math.min(0.97, ask + 0.02);

  const order = await ex.createOrder(ref, "limit", "buy", amount, price, {
    timeInForce: "IOC",
  });
  const info = (order as { info?: { receipt?: { transactionHash?: string }; orderId?: unknown } })
    .info;
  const txHash = info?.receipt?.transactionHash ?? (order as { txHash?: string }).txHash ?? "";
  if (!txHash) throw new Error("order returned no tx hash");
  return {
    txHash,
    orderId: String((order as { id?: string }).id ?? info?.orderId ?? ""),
    symbol: (order as { symbol?: string }).symbol ?? `${marketId}#${outcome}`,
    side: "buy",
    price,
    amount,
    filled: Number((order as { filled?: number }).filled ?? 0),
  };
}

export type Settlement = {
  marketId: string;
  question: string;
  winningOutcome: number | null;
  voided: boolean;
  finalized: boolean;
  resolvedAt: number | null;
};

const FIELDS = `
  marketId question winningOutcome payoutNumerators payoutDenominator
  voided finalized resolvedAtTimestamp clobStatus
`;

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

export async function lookupSettlement(marketId: string): Promise<Settlement | null> {
  const data = await gql<{ Market: Array<Record<string, unknown>> }>(
    `query M($id: String!) { Market(where: { marketId: { _eq: $id } }, limit: 1) { ${FIELDS} } }`,
    { id: marketId }
  );
  const row = data.Market?.[0];
  if (!row) return null;
  return {
    marketId,
    question: String(row.question ?? ""),
    winningOutcome:
      row.winningOutcome === null || row.winningOutcome === undefined
        ? null
        : Number(row.winningOutcome),
    voided: Boolean(row.voided),
    finalized: Boolean(row.finalized),
    resolvedAt: row.resolvedAtTimestamp ? Number(row.resolvedAtTimestamp) : null,
  };
}

export async function walletAddress(): Promise<string> {
  const { privateKeyToAccount } = await import("viem/accounts");
  return privateKeyToAccount(process.env.TALLY_TEST_PRIVATE_KEY as `0x${string}`).address;
}
