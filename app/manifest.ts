import type { MetadataRoute } from "next";

// PWA manifest. Lets a player "Add to Home Screen" so the meal plan opens
// full-screen like an app. Next.js serves this at /manifest.webmanifest and
// links it automatically from every page's <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taqa — Athlete Nutrition",
    short_name: "Taqa",
    description: "AI-generated 7-day meal plans for academy athletes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1410",
    theme_color: "#0b1410",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
