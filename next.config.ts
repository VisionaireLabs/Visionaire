import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Renamed 2026-04-25: services → offerings
      {
        source: "/services",
        destination: "/offerings",
        permanent: true,
      },
      {
        source: "/services/:path*",
        destination: "/offerings/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
