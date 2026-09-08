import { promises as fs } from "node:fs";
import path from "node:path";

export type Receipt = {
  id: string;
  txHash: string;
  orderId: string;
  marketId: string;
  question: string;
  symbol: string;
  outcome: "YES";
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

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "receipts.json");

export async function readReceipts(): Promise<Receipt[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Receipt[];
  } catch {
    return [];
  }
}

export async function writeReceipts(receipts: Receipt[]): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(receipts, null, 2));
}

export async function addReceipt(r: Receipt): Promise<void> {
  const all = await readReceipts();
  all.unshift(r);
  await writeReceipts(all.slice(0, 500));
}
