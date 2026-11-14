import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OOFY® — Wear Your Confidence | Contemporary Streetwear Dhaka";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #141714 0%, #0a0c0a 100%)",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
          border: "12px solid #242924",
        }}
      >
        {/* Top Header Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#1c211c",
              border: "1.5px solid #d2f83a",
              padding: "8px 20px",
              borderRadius: "9999px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#d2f83a",
              }}
            />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              DHAKA ATELIER · DROP 004
            </span>
          </div>

          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#8a948a",
              textTransform: "uppercase",
            }}
          >
            OOFY.STORE
          </span>
        </div>

        {/* Central Brand Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "136px",
                fontWeight: 900,
                letterSpacing: "-0.08em",
                lineHeight: 0.9,
                color: "#ffffff",
              }}
            >
              OOF
            </span>
            <span
              style={{
                fontSize: "136px",
                fontWeight: 900,
                letterSpacing: "-0.08em",
                lineHeight: 0.9,
                color: "#d2f83a",
              }}
            >
              Y
            </span>
            <span
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: "#d2f83a",
                border: "3px solid #d2f83a",
                borderRadius: "50%",
                width: "52px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "12px",
                marginBottom: "40px",
              }}
            >
              ®
            </span>
          </div>

          <h2
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "0.06em",
              color: "#d2f83a",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            WEAR YOUR CONFIDENCE
          </h2>

          <p
            style={{
              fontSize: "22px",
              color: "#c2cac2",
              margin: "8px 0 0",
              maxWidth: "850px",
              lineHeight: 1.4,
            }}
          >
            Contemporary Streetwear & Luxury Essentials — Heavyweight Tees, Relaxed Tailoring & Atelier Drops from Dhaka.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#1c211c",
              border: "1px solid #2e352e",
              borderRadius: "14px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.05em",
            }}
          >
            ✦ CASH ON DELIVERY NATIONWIDE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#1c211c",
              border: "1px solid #2e352e",
              borderRadius: "14px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.05em",
            }}
          >
            ✦ 100% PRE-SHRUNK FRENCH TERRY
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#1c211c",
              border: "1px solid #2e352e",
              borderRadius: "14px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 800,
              color: "#d2f83a",
              letterSpacing: "0.05em",
            }}
          >
            ✦ FAST BANGLADESH DISPATCH
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
