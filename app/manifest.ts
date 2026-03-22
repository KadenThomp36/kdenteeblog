import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KdenTee",
    short_name: "KdenTee",
    description: "Stories, images, and ideas — a personal editorial.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a1a",
    theme_color: "#E8503A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
