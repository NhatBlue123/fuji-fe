import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ===== CƠ BẢN =====
  reactStrictMode: true,

  // ===== IMAGE OPTIMIZATION =====
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Tối ưu hóa ảnh bị lỗi trên một số môi trường Windows với Turbopack -> tắt formats tạm thời hoặc giữ nguyên nếu không phải nguyên nhân
    formats: ["image/avif", "image/webp"],
  },

  // ===== API PROXY (CHỈ TRONG DEVELOPMENT) =====
  async rewrites() {
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
  poweredByHeader: false,

  // ===== CACHE HEADERS (Giữ nguyên từ Hanabi/Fuji cũ) =====
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|gif|ico|avif)",
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
  // Tạm tắt experimental để tránh lỗi Turbopack cache (SST file error)
  // experimental: {
  //   optimizePackageImports: ["lucide-react"],
  // },

  // ===== COMPILER OPTIONS =====
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

export default nextConfig;