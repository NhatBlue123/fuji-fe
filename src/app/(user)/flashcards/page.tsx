"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateFlashcardModal from "@/components/user-component/flashcard/CreateFlashcardModal";
import styles from "./page.module.css";

const flashcardSets = [
  {
    title: "Từ vựng Minna no Nihongo 1",
    description:
      "Tổng hợp từ vựng bài 1-25 giáo trình Minna no Nihongo sơ cấp 1.",
    owner: "Của tôi",
    level: "N5",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE",
    stats: [
      { icon: "content_copy", label: "150 cards" },
      { icon: "schedule", label: "~45 phút" },
    ],
  },
  {
    title: "Kanji N4 - Động vật",
    description:
      "Bộ flashcard học Kanji chủ đề động vật thường gặp trong đề thi JLPT N4.",
    owner: "Của tôi",
    level: "N4",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c",
    stats: [
      { icon: "content_copy", label: "45 cards" },
      { icon: "schedule", label: "~20 phút" },
    ],
  },
  {
    title: "Ngữ pháp N3 Mimi Kara Oboeru",
    description: "Ôn tập các mẫu ngữ pháp trọng điểm, có ví dụ audio đi kèm.",
    owner: "Của tôi",
    level: "N3",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04",
    stats: [
      { icon: "content_copy", label: "112 cards" },
      { icon: "star", label: "4.8" },
    ],
  },
  {
    title: "Katakana Cơ bản",
    description: "Bảng chữ cái Katakana đầy đủ với hình ảnh minh họa dễ nhớ.",
    owner: "Của tôi",
    level: "N5",
    fallbackIcon: "school",
    fallbackClass: "bg-slate-900",
    stats: [
      { icon: "content_copy", label: "46 cards" },
      { icon: "schedule", label: "~15 phút" },
    ],
  },
  {
    title: "Từ vựng Shinkanzen N2",
    description:
      "Danh sách từ vựng chuyên sâu cho kỳ thi JLPT N2, phân loại theo chủ đề.",
    owner: "Của tôi",
    level: "N2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c",
    stats: [
      { icon: "content_copy", label: "200 cards" },
      { icon: "schedule", label: "~60 phút" },
    ],
  },
  {
    title: "Thành ngữ tiếng Nhật",
    description:
      "Các câu thành ngữ, quán dụng ngữ thông dụng trong giao tiếp hàng ngày.",
    owner: "Của tôi",
    level: "N3",
    fallbackIcon: "auto_stories",
    fallbackClass: "bg-gradient-to-br from-pink-900/40 to-slate-900",
    stats: [
      { icon: "content_copy", label: "30 cards" },
      { icon: "star", label: "5.0" },
    ],
  },
];

export default function FlashcardsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background dark:bg-[#0f172a]">
      <div className="max-w-[1600px] mx-auto w-full p-6 md:p-10">
        <section className="relative w-full rounded-3xl overflow-hidden mb-12 bg-[#0B1120] border border-white/5 shadow-2xl group">
          <div className="absolute inset-0 bg-slate-900"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-full w-full pointer-events-none opacity-40">
            <svg
              className="absolute bottom-0 w-full h-auto"
              preserveAspectRatio="none"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#be185d" stopOpacity="1"></stop>
                  <stop
                    offset="100%"
                    stopColor="#4338ca"
                    stopOpacity="1"
                  ></stop>
                </linearGradient>
              </defs>
              <path
                d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="url(#grad1)"
                fillOpacity="0.1"
              ></path>
              <path
                d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="url(#grad1)"
                fillOpacity="0.2"
              ></path>
            </svg>
          </div>
          <div className="relative z-10 p-6 md:p-12 flex flex-col gap-8">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-pink-200 to-white drop-shadow-sm leading-tight">
                  Luyện tập từ vựng với Flashcard
                </span>
              </h1>
              <p className="text-blue-100/70 text-lg font-medium max-w-2xl leading-relaxed hidden sm:block">
                Nâng cao trình độ tiếng Nhật mỗi ngày với hệ thống thẻ ghi nhớ
                thông minh và kho bài học phong phú.
              </p>
            </div>
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full pt-4 border-t border-white/5">
              <div className="relative w-full xl:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-pink-200/50 group-focus-within:text-pink-400 transition-colors">
                    search
                  </span>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-2xl leading-5 bg-white/5 backdrop-blur-md text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50 focus:bg-white/10 transition-all shadow-lg shadow-black/20"
                  placeholder="Tìm kiếm bộ thẻ..."
                  type="search"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Select>
                    <SelectTrigger className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-100 py-3.5 pl-5 pr-12 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors focus:ring-pink-500/30 focus:border-pink-500/50">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-gray-300 border-white/10">
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="learned">Đã học</SelectItem>
                      <SelectItem value="new">Chưa học</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <Select>
                    <SelectTrigger className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-100 py-3.5 pl-5 pr-12 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors focus:ring-pink-500/30 focus:border-pink-500/50">
                      <SelectValue placeholder="Cấp độ" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-gray-300 border-white/10">
                      <SelectItem value="n5">N5</SelectItem>
                      <SelectItem value="n4">N4</SelectItem>
                      <SelectItem value="n3">N3</SelectItem>
                      <SelectItem value="n2">N2</SelectItem>
                      <SelectItem value="n1">N1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="xl:ml-auto w-full xl:w-auto mt-2 xl:mt-0">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="relative w-full xl:w-auto group overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-[1px] shadow-xl shadow-pink-500/10 hover:shadow-pink-500/20 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-center gap-2 bg-[#0B1120]/60 backdrop-blur-xl hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl transition-all duration-300 h-full w-full">
                    <span className="material-symbols-outlined text-pink-400 group-hover:text-pink-200 transition-colors">
                      add_circle
                    </span>
                    <span className="font-bold tracking-wide">Tạo mới</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {flashcardSets.map((set) => (
            <article
              key={set.title}
              className="glass-card rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="relative h-48 bg-slate-800 overflow-hidden flex items-center justify-center">
                {set.image ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${set.image}')` }}
                  ></div>
                ) : (
                  <div
                    className={`absolute inset-0 ${set.fallbackClass}`}
                  ></div>
                )}
                {!set.image && set.fallbackIcon ? (
                  <span className="material-symbols-outlined text-8xl text-slate-700 group-hover:text-slate-600 transition-colors">
                    {set.fallbackIcon}
                  </span>
                ) : null}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-pink-400 border border-pink-500/30 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                  {set.owner}
                </div>
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white border border-white/20 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                  {set.level}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-400 transition-colors truncate">
                  {set.title}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {set.description}
                </p>
                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4 text-xs text-slate-500 font-medium">
                    {set.stats.map((stat) => (
                      <div key={stat.label} className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          {stat.icon}
                        </span>
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-secondary hover:bg-pink-400 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40">
                    <span className="material-symbols-outlined text-lg">
                      play_arrow
                    </span>
                    Học ngay
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end pr-0">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-l-2xl border-y border-l border-gray-200 dark:border-gray-700/50 overflow-hidden flex flex-col">
          <button
            className={`${styles.writingVertical} py-4 px-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest border-b border-gray-200 dark:border-gray-700/50`}
          >
            CARD
          </button>
          <button
            className={`${styles.writingVertical} py-4 px-3 bg-secondary text-white text-xs font-bold tracking-widest shadow-inner`}
          >
            SETS
          </button>
        </div>
      </div>

      <CreateFlashcardModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
