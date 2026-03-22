import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#1a1a1a",
          borderRadius: "28px",
        }}
      >
        {/* Stem */}
        <div
          style={{
            position: "absolute",
            left: 39,
            top: 28,
            width: 20,
            height: 124,
            backgroundColor: "#FAF7F2",
            borderRadius: 2,
          }}
        />
        {/* Upper arm — vermillion */}
        <div
          style={{
            position: "absolute",
            left: 59,
            top: 79,
            width: 88,
            height: 22,
            backgroundColor: "#E8503A",
            borderRadius: 2,
            transform: "rotate(-34deg)",
            transformOrigin: "left center",
          }}
        />
        {/* Lower arm */}
        <div
          style={{
            position: "absolute",
            left: 59,
            top: 79,
            width: 88,
            height: 22,
            backgroundColor: "#FAF7F2",
            borderRadius: 2,
            transform: "rotate(34deg)",
            transformOrigin: "left center",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
