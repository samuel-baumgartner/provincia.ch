import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep the clone folder named provincia.ch (not provinica / provinciia).
  // Opening via a typo symlink/parent path can make Turbopack resolve from the
  // wrong root and fail to find tailwindcss.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
