import { ImageResponse } from "next/og";

export const alt = "Riderzpro: Car & Bike Accessories";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0d10",
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: "0.22em", color: "#ffffff" }}>
          <span>RIDERZ</span>
          <span style={{ color: "#f83030" }}>PRO</span>
        </div>
        <div style={{ width: 120, height: 6, background: "#f83030", marginTop: 36 }} />
        <div style={{ marginTop: 36, fontSize: 40, letterSpacing: "0.12em", color: "#b8bec7" }}>Car &amp; Bike Accessories</div>
      </div>
    ),
    { ...size },
  );
}
