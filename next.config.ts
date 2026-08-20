import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  allowedDevOrigins: ["192.168.1.101"],
};

export default nextConfig;