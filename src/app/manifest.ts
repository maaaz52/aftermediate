import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "aftermediate — your post-FSc compass",
    short_name: "aftermediate",
    description:
      "AI-driven career counseling and university planning for Pakistani FSc, ICS, I.Com and A-Level students.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080d",
    theme_color: "#08080d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}