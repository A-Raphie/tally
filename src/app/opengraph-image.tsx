import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tally: receipts for prediction calls";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0d0e",
          color: "#e3e9e6",
          padding: 72,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "0.08em" }}>TALLY_</div>
          <div style={{ fontSize: 20, letterSpacing: "0.28em", color: "#667373" }}>
            SETTLEMENT INSTRUMENT
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 44, lineHeight: 1.2, maxWidth: 900 }}>
            Every prediction call prints a verdict card with its real transaction.
          </div>
          <div style={{ fontSize: 26, color: "#9aa7a1" }}>
            The chain flips it WON or LOST · not the desk
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            border: "2px solid #46d68f",
            color: "#46d68f",
            padding: "6px 18px",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.18em",
          }}>
            WON · 2.00 tUSDC
          </div>
          <div style={{
            border: "2px solid #ff7264",
            color: "#ff7264",
            padding: "6px 18px",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.18em",
          }}>
            LOST · 0.00
          </div>
          <div style={{ fontSize: 20, color: "#667373", marginLeft: 8 }}>
            Somnia Shannon · DreamDEX Event Contracts · testnet
          </div>
        </div>
      </div>
    ),
    size
  );
}
