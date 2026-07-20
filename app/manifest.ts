import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chugli",
    short_name: "Chugli",
    description: "Chugli - A real-time chat application",
    start_url: "/",
    display: "standalone",
    background_color: "#ededed",
    theme_color: "#0aa38c",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
