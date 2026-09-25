import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AM4 desk",
    short_name: "AM4 desk",
    description: "Personal route, fleet, fare, and departure companion for Airline Manager 4.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#142820",
    theme_color: "#142820",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
