import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  allowedDevOrigins: [
    "ivory-crunching-wasting.ngrok-free.dev",
    "192.168.6.102:3000",
    "localhost:3000"
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      }
    ],
  }
};

export default nextConfig;


