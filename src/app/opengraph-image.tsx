import { ImageResponse } from "next/og";

export const alt = "THRENODY: an atlas of sounds that no longer exist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social preview card. Built with next/og, which is bundled with Next, so no
 * extra dependency and no binary asset in the repository. Deliberately typeset
 * in system sans so nothing has to be fetched at build time.
 */
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
          background: "#0a0a0b",
          color: "#f2efe9",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#c8b088" }}>
          ACOUSTIC ARCHAEOLOGY
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 128, letterSpacing: -4, lineHeight: 1 }}>
            THRENODY
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              color: "#a3a09a",
              marginTop: 24,
              lineHeight: 1.3,
            }}
          >
            An atlas of sounds that no longer exist
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#6f6c66",
            borderTop: "1px solid #2a2a2d",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex" }}>Field recording / Restored / Reconstructed / Speculative</div>
          <div style={{ display: "flex" }}>12 entries</div>
        </div>
      </div>
    ),
    size,
  );
}
