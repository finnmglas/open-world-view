import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Tells CesiumJS where to find its static workers/assets at runtime
    NEXT_PUBLIC_CESIUM_BASE_URL: "/cesium",
  },

  async headers() {
    return [
      {
        // Required for Cesium's SharedArrayBuffer-based parallel workers
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy",  value: "require-corp" },
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
