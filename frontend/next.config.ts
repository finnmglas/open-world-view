import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Tells CesiumJS where to find its static workers/assets at runtime
    NEXT_PUBLIC_CESIUM_BASE_URL: "/cesium",
  },

  async headers() {
    return [
      {
        // COOP: prevents cross-origin windows from getting a reference to ours.
        // COEP (require-corp) is intentionally OMITTED — it would block cross-origin
        // tile requests (OSM, etc.) because those CDNs don't send CORP headers.
        // We don't use terrain or 3D tiles so SharedArrayBuffer is not needed.
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL}/:path*`,
      },
      {
        source: "/ws",
        destination: `${process.env.API_URL}/ws`,
      },
    ];
  },
};

export default nextConfig;
