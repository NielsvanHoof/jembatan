import type { MetadataRoute } from "next";

/** Web app manifest — enables Add to Home Screen on phones. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jembatan",
    short_name: "Jembatan",
    description:
      "Indonesian ↔ Dutch flashcards for daily life in the Netherlands.",
    start_url: "/id/study",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f7f9",
    theme_color: "#1b3a4b",
    lang: "id",
    categories: ["education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
