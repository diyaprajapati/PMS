import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Reduce memory usage during build
  experimental: {
    // Reduce the number of workers if memory is an issue
    // You can adjust this based on your system's available memory
  },
  // Disable source maps in production to reduce memory usage
  productionBrowserSourceMaps: false,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
