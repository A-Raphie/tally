import type { Metadata, Viewport } from "next";
import { Source_Code_Pro, Inter } from "next/font/google";
import "./globals.css";

const scp = Source_Code_Pro({
  variable: "--font-scp",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const display = Inter({
  variable: "--font-display",
  subsets: ["latin"],
});

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
  themeColor: "#070707",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${scp.variable} ${display.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
