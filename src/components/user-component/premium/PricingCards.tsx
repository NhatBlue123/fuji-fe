import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      {/* ===== Thẻ Miễn Phí ===== */}
      <div className="bg-card text-card-foreground rounded-2xl p-8 border border-border flex flex-col relative transition-colors">
        <p className="text-muted-foreground text-sm font-semibold tracking-wider mb-2">
          TRẢI NGHIỆM
        </p>

        <h3 className="text-3xl font-bold mb-4">Free</h3>

        <div className="flex items-end mb-6">
          <span className="text-5xl font-bold">0đ</span>
          <span className="text-muted-foreground ml-2 mb-1">/ mãi mãi</span>
        </div>

        <button className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-xl transition mb-8">
          Khám phá ngay
        </button>

        <ul className="space-y-4 flex-1">
          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
            Truy cập kho Flashcard cộng đồng
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
            Tạo tối đa 3 bộ học tập cá nhân
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
            Thuật toán Spaced Repetition cơ bản
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
            Đồng bộ hóa trên 1 thiết bị
          </li>
        </ul>
      </div>

      {/* ===== Thẻ Premium ===== */}
      <div className="bg-card text-card-foreground rounded-2xl p-8 border-2 border-secondary flex flex-col relative shadow-lg shadow-secondary/20 transition-colors">
        {/* Badge */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 
            bg-secondary text-secondary-foreground 
            px-4 py-1 rounded-full text-xs font-bold tracking-wider"
        >
          TIẾT KIỆM NHẤT
        </div>

        <p className="text-secondary text-sm font-semibold tracking-wider mb-2 uppercase">
          Lộ trình bứt phá
        </p>

        <h3 className="text-3xl font-bold mb-4">Premium</h3>

        <div className="flex items-end mb-6 gap-3">
          <span className="text-5xl font-bold">199.000đ</span>

          <span className="px-2 py-1 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-bold">
            ~19 hoa
          </span>

          <span className="text-muted-foreground ml-1 mb-1">/ tháng</span>
        </div>

        <button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-3 rounded-xl transition mb-8 shadow-lg shadow-secondary/30">
          Nâng cấp Pro ngay
        </button>

        <ul className="space-y-4 flex-1">
          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            Không giới hạn số lượng Flashcard
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            AI thông minh tự tạo bộ thẻ từ PDF/Ảnh
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            Chế độ học ngoại tuyến (Offline)
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            Phân tích chuyên sâu tiến độ học tập
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            Ưu tiên hỗ trợ & Không quảng cáo
          </li>
        </ul>
      </div>
    </div>
  );
}