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
};

export default nextConfig;
