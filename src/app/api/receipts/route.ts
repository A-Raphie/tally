import { NextResponse } from "next/server";
import { readReceipts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const receipts = await readReceipts();
  return NextResponse.json({ receipts });
}
