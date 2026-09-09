// Ship-rehearsal CLI QA: exercises Tally's real flows against a deployed URL.
// Usage: node scripts/qa.mjs https://tally-dreamdex.vercel.app [--bet]
const BASE = process.argv[2] || "http://localhost:3000";
const DO_BET = process.argv.includes("--bet");
let failures = 0;

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " · " + detail : ""}`);
  if (!ok) failures += 1;
}

const j = async (path, opts) => {
  const res = await fetch(BASE + path, opts);
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
};

// 1. markets: 200, array, required fields, price sanity
{
  const { status, body } = await j("/api/markets");
  check("markets.status=200", status === 200);
  const ms = body?.markets;
  check("markets.array", Array.isArray(ms));
  check("markets.fields", ms?.every((m) => m.marketId && m.question && typeof m.expiry === "number"));
  check("markets.price-sane", ms?.every((m) => m.price === null || (m.price > 0 && m.price < 1)));
}

// 2. receipts: 200, seed or live cards present with valid statuses
{
  const { status, body } = await j("/api/receipts");
  check("receipts.status=200", status === 200);
  const rs = body?.receipts;
  const okStatus = rs?.every((r) => ["OPEN", "WON", "LOST", "VOID"].includes(r.status));
  check("receipts.statuses-valid", okStatus);
  check("receipts.have-tx", rs?.every((r) => r.txHash?.startsWith("0x")));
}

// 3. board: 200, aggregates present
{
  const { status, body } = await j("/api/board");
  check("board.status=200", status === 200);
  check("board.rows", Array.isArray(body?.board));
}

// 4. settle: 200 and counted (idempotent, no open cards is fine)
{
  const { status, body } = await j("/api/settle", { method: "POST" });
  check("settle.status=200", status === 200);
  check("settle.counted", typeof body?.checked === "number");
}

// 5. bet: negative cases first (no spend)
{
  const { status, body } = await j("/api/bet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  check("bet.missing-marketId=400", status === 400 && !!body?.error);

  const bad = await j("/api/bet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ marketId: "0xdeadbeef", amount: 1, question: "x" }),
  });
  check("bet.bad-marketId=500-with-error", bad.status === 500 && !!bad.body?.error);
}

// 6. bet: the real flow (spends 1 testnet tUSDC per side) — only with --bet
if (DO_BET) {
  const { body: mb } = await j("/api/markets");
  const m = mb?.markets?.find((x) => x.price !== null);
  if (!m) {
    check("bet.real-flow", false, "no crossable market available");
  } else {
    for (const outcome of ["YES", "NO"]) {
      const res = await j("/api/bet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId: m.marketId, amount: 1, question: m.question, outcome }),
      });
      const r = res.body?.receipt;
      const sideOk = r ? r.symbol.toUpperCase().endsWith("#" + outcome) : false;
      check(`bet.${outcome}-flow`, res.status === 200 && !!r?.txHash && r.outcome === outcome && sideOk,
        r ? `${r.symbol} tx ${r.txHash.slice(0, 14)}` : (res.body?.error?.slice(0, 80) ?? ""));
    }
  }
}

// 7. pages: landing, desk, 404
for (const [path, want] of [["/", 200], ["/desk", 200], ["/nope-404", 404]]) {
  const res = await fetch(BASE + path);
  check(`page ${path}=${want}`, res.status === want);
}

console.log(failures === 0 ? "\nALL CLEAN" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
