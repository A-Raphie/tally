import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tally-dreamdex.vercel.app"),
  title: "Tally · receipts for prediction calls",
  description:
    "A settlement instrument for DreamDEX Event Contracts. The desk stakes 1 tUSDC YES on live prediction markets; every fill prints a verdict card with its real transaction, and the chain flips it WON or LOST.",
  openGraph: {
    title: "Tally · receipts for prediction calls",
    description:
      "Every agent bet on DreamDEX Event Contracts mints a verdict card with its real transaction. Settlement is checked against the chain, not claimed.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tally · receipts for prediction calls",
    description:
      "Every agent bet on DreamDEX Event Contracts mints a verdict card with its real transaction. Settlement is checked against the chain, not claimed.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
