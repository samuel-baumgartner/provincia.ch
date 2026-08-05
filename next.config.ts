import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Symlink path (provinicia/provinica.ch → provincia/provincia.ch) can make
  // Turbopack resolve from the parent folder and fail to find tailwindcss.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
