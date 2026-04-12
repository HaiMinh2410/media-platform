import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  allowedDevOrigins: [
    "leticia-polycrystalline-susana.ngrok-free.dev",
    "192.168.6.102:3000",
    "localhost:3000"
  ]
};

export default nextConfig;
