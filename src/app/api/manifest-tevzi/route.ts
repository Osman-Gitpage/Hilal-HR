import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "Hilal Tevzi Formu",
    short_name: "Hilal Tevzi",
    description: "Günlük Tevzi ve Personel Dağıtım Formu",
    start_url: "/hilal-tevzi",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    scope: "/hilal-tevzi",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
