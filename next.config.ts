import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/dropbox/thumbnail",
        // Omit search: allows any query string (e.g. ?path=...)
      },
    ],
  },
};

export default nextConfig;
