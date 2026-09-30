import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // x402 paid APIs retired 4 Sep 2026, removed 30 Sep 2026.
      // /services was renamed to /offerings on 2026-04-25; both now go home.
      { source: "/services", destination: "/", permanent: true },
      { source: "/services/:path*", destination: "/", permanent: true },
      { source: "/offerings", destination: "/", permanent: true },
      { source: "/offerings/:path*", destination: "/", permanent: true },
      { source: "/.well-known/x402", destination: "/", permanent: true },
      { source: "/api/discovery", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
