import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ===== CƠ BẢN =====
  reactStrictMode: true,

  // ===== IMAGE OPTIMIZATION =====
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Cho phép mọi domain HTTPS - thu hẹp lại khi biết domain cụ thể
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ===== API PROXY (CHỈ TRONG DEVELOPMENT) =====
  async rewrites() {
    // Chỉ proxy trong development để avoid CORS
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8080/api/v1/:path*",
        },
      ];
    }
    return [];
  },

  // ===== SECURITY & PERFORMANCE =====
  poweredByHeader: false, // Ẩn header "X-Powered-By: Next.js"

  // ===== CACHE HEADERS =====
  async headers() {
    return [
      // Cache static images
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|gif|ico|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache fonts
      {
        source: "/:all*(woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache Next.js static files
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    // Tree-shaking cho icon libraries
    optimizePackageImports: ["lucide-react"],
  },

  // ===== COMPILER OPTIONS =====
  compiler: {
    // Xóa console.log trong production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

export default nextConfig;