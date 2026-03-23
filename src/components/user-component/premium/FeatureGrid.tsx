import React from "react";
import { Infinity, GraduationCap, Bot, Zap } from "lucide-react";

export default function FeatureGrid() {
  const features = [
    {
      icon: <Infinity className="w-6 h-6 text-secondary" />,
      title: "Mở rộng số lượng tạo Flashcard",
      desc: "Học không giới hạn số lượng thẻ và bộ thẻ mỗi ngày."
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-secondary" />,
      title: "Khóa học VIP",
      desc: "Truy cập đặc quyền vào tất cả nội dung VIP."
    },
    {
      icon: <Bot className="w-6 h-6 text-secondary" />,
      title: "AI hỗ trợ",
      desc: "Trợ lý AI giúp giải đáp mọi thắc mắc của bạn tức thì."
    },
    {
      icon: <Zap className="w-6 h-6 text-secondary" />,
      title: "AI luyện kaiwa",
      desc: "Luyện tập giao tiếp tiếng Nhật với trợ lý AI thông minh."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {features.map((item, index) => (
        <div
          key={index}
          className="bg-card text-card-foreground p-6 rounded-2xl border border-border hover:border-secondary/50 transition-colors"
        >
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
            {item.icon}
          </div>

          <h4 className="font-bold mb-2">
            {item.title}
          </h4>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}