import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1218", borderRadius: 8 }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, border: "3px solid #ff8a3d", display: "flex" }} />
      </div>
    ),
    size,
  );
}
