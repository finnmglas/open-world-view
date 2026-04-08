import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
