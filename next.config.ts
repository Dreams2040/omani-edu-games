import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off for now: almost every teacher page reads the
  // Supabase session cookie, so pages render per request.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
