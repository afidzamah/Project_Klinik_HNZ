import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.20.10.2", "localhost:3001", "172.20.10.2:3001"]
};

export default nextConfig;
