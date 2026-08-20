import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/site/constants";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px 88px",
          background:
            "linear-gradient(125deg, #fffaf5 0%, #f6f1fa 56%, #eaf5ef 100%)",
          color: "#343143",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -80,
            display: "flex",
            width: 470,
            height: 470,
            borderRadius: "50%",
            background: "rgba(241, 214, 220, 0.72)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -100,
            display: "flex",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(217, 231, 239, 0.72)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: "Georgia, serif",
            fontSize: 64,
            letterSpacing: "-0.05em",
          }}
        >
          <span style={{ color: "#6d6388", fontSize: 88, fontStyle: "italic" }}>
            L
          </span>
          <span>{SITE_NAME.slice(1)}</span>
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 850,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              marginBottom: 22,
              color: "#6d6388",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Lecture immersive
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 76,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
            }}
          >
            Lisez. Écoutez. Rêvez.
          </div>
          <div style={{ marginTop: 26, fontSize: 27, lineHeight: 1.45 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
