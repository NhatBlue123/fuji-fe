import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Disabled: Strict Mode double-mounts components in dev, which closes the
  // RTCPeerConnection while createOffer() is pending → Chrome hangs promise forever.
  reactStrictMode: false,

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
    qualities: [75, 100],
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
      // Cache public course API responses for 1 hour (ISR handles revalidation)
      {
        source: "/api/public/courses/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  // ===== TURBOPACK CONFIG =====
  // Fix: multiple lockfiles warning — chỉ scan trong project directory
  turbopack: {
    root: __dirname,
  },

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    // Tree-shake các package nặng — giảm lượng module Turbopack cần xử lý
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "recharts",
      "framer-motion",
      "date-fns",
      "react-day-picker",
    ],
  },

  // ===== COMPILER OPTIONS =====
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

export default nextConfig;
