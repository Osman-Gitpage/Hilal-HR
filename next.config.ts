import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  allowedDevOrigins: [
    "192.168.1.103",
    "192.168.1.103:3000",
    "192.168.1.101",
    "192.168.1.101:3000",
    "192.168.*",
    "*.local",
    "localhost:3000"
  ],

  async redirects() {
    return [
      {
        source: "/login",
        destination: "/giris",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
