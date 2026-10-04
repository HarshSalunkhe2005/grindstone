import type { MetadataRoute } from "next";

// Makes the site installable to a phone's home screen, opening straight into Today.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grindstone",
    short_name: "Grindstone",
    description: "A DSA and web-dev roadmap that adapts to you.",
    start_url: "/today",
    display: "standalone",
    background_color: "#080a0e",
    theme_color: "#080a0e",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
