import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
      {/* ===== Thẻ Miễn Phí ===== */}
      <div className="bg-card text-card-foreground rounded-2xl p-8 border border-border flex flex-col relative transition-colors">
        <p className="text-muted-foreground text-sm font-semibold tracking-wider mb-2">
          CƠ BẢN
        </p>

        <h3 className="text-3xl font-bold mb-4">Miễn phí</h3>

        <div className="flex items-end mb-6">
          <span className="text-5xl font-bold">0đ</span>
          <span className="text-muted-foreground ml-2 mb-1">/ vĩnh viễn</span>
        </div>

        <button className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-xl transition mb-8">
          Bắt đầu ngay
        </button>

        <ul className="space-y-4 flex-1">
          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
            10 flashcard mỗi bộ
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />3 khóa học cơ
            bản
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
            Ôn tập hàng ngày
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
          PHỔ BIẾN NHẤT
        </div>

        <p className="text-secondary text-sm font-semibold tracking-wider mb-2 uppercase">
          Học tập đỉnh cao
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
          Nâng cấp ngay
        </button>

        <ul className="space-y-4 flex-1">
          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            50 flashcard mỗi bộ
          </li>

          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            Toàn bộ khóa học VIP
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-secondary mr-3" />
            AI hỗ trợ học tập 24/7
          </li>
        </ul>
      </div>
    </div>
  );
}
