"use client";

import React from "react";

export default function Home() {
  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background dark:bg-[#0f172a]">
      {/* Mobile Header (Hidden on Desktop) - Layout handles this usually, but keeping for structure if needed
          Using hidden md:hidden to ensure it doesn't conflict if layout has one
      */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-white text-3xl">
            landscape
          </span>
          <span className="font-black text-slate-900 dark:text-white text-lg">
            FUJI
          </span>
        </div>
        <button className="p-2 text-gray-600 dark:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        {/* HERO SECTION */}
        <div className="relative w-full min-h-[680px] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20 pb-72 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-blue-900/20">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center transform scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-blue-900/40 mix-blend-multiply dark:from-[#0B1120] dark:via-[#0B1120]/80"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent dark:from-[#0f172a]"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 max-w-2xl text-white pt-10">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6 shadow-glow">
              <span className="size-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#F472B6]"></span>
              <span className="text-xs font-bold tracking-wide uppercase text-secondary">
                Nền tảng học tiếng Nhật số 1
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 tracking-tight drop-shadow-lg">
              Học Tiếng Nhật <br />
              <span className="text-secondary text-glow">Dễ Dàng Hơn.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 font-light max-w-lg leading-relaxed drop-shadow-md">
              Chinh phục tiếng Nhật cùng FUJI. Lộ trình cá nhân hóa dành riêng
              cho người Việt với sự hỗ trợ từ AI.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-secondary hover:bg-pink-400 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all transform hover:translate-y-[-2px] shadow-lg shadow-pink-500/40 flex items-center gap-2">
                Bắt đầu ngay
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
              <button className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold text-base transition-all flex items-center gap-2 hover:border-white/40">
                <span className="material-symbols-outlined">play_circle</span>
                Xem demo
              </button>
            </div>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="px-6 md:px-12 lg:px-20 -mt-24 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: "groups",
                value: "10K+",
                label: "Học viên",
                color: "blue",
              },
              {
                icon: "school",
                value: "500+",
                label: "Khóa học",
                color: "pink",
              },
              {
                icon: "verified",
                value: "95%",
                label: "Tỷ lệ đỗ JLPT",
                color: "emerald",
              },
              {
                icon: "cast_for_education",
                value: "50+",
                label: "Giảng viên",
                color: "purple",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:bg-slate-100 hover:dark:bg-slate-800/60 transition-colors"
              >
                <div
                  className={`size-12 rounded-full bg-${stat.color}-500/20 text-${stat.color}-600 dark:text-${stat.color}-300 flex items-center justify-center border border-${stat.color}-500/20`}
                >
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COURSES SECTION */}
        <section className="px-6 md:px-12 lg:px-20 mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight">
                Khóa học của bạn
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 mt-1">
                Tiếp tục hành trình chinh phục tiếng Nhật nào!
              </p>
            </div>
            <a
              className="hidden md:flex items-center gap-1 text-primary dark:text-blue-400 font-bold hover:text-blue-300 transition-colors"
              href="#"
            >
              Xem tất cả{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Course Card 1 */}
            <div className="bg-card dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-lg border border-border dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-blue-500/30 transition-all hover:translate-y-[-4px] flex flex-col h-full group">
              <div className="h-44 bg-slate-800 relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE')",
                  }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-lg">
                  N5 - Sơ cấp
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                  Tiếng Nhật N5 Tổng Quát
                </h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">
                  Nắm vững bảng chữ cái Hiragana, Katakana và các mẫu câu giao
                  tiếp cơ bản.
                </p>
                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground dark:text-slate-400 mb-2">
                    <span>Tiến độ</span>
                    <span className="text-foreground dark:text-white">35%</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-700 rounded-full h-2 mb-5">
                    <div
                      className="bg-gradient-to-r from-secondary to-pink-600 h-2 rounded-full shadow-[0_0_10px_#F472B6]"
                      style={{ width: "35%" }}
                    ></div>
                  </div>
                  <button className="w-full py-2.5 rounded-lg border border-border dark:border-slate-600 text-foreground dark:text-white font-bold hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all text-sm">
                    Tiếp tục học
                  </button>
                </div>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="bg-card dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-lg border border-border dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-blue-500/30 transition-all hover:translate-y-[-4px] flex flex-col h-full group">
              <div className="h-44 bg-slate-800 relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04')",
                  }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-lg">
                  N4 - Sơ trung cấp
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                  Luyện thi JLPT N4
                </h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">
                  Ôn tập ngữ pháp, từ vựng và Kanji cho kỳ thi năng lực tiếng
                  Nhật N4.
                </p>
                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground dark:text-slate-400 mb-2">
                    <span>Tiến độ</span>
                    <span className="text-foreground dark:text-white">12%</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-700 rounded-full h-2 mb-5">
                    <div
                      className="bg-gradient-to-r from-secondary to-pink-600 h-2 rounded-full shadow-[0_0_10px_#F472B6]"
                      style={{ width: "12%" }}
                    ></div>
                  </div>
                  <button className="w-full py-2.5 rounded-lg border border-border dark:border-slate-600 text-muted-foreground dark:text-slate-300 font-bold hover:border-primary hover:text-white hover:bg-primary/90 dark:hover:border-blue-500 dark:hover:text-white dark:hover:bg-blue-600/10 transition-all text-sm">
                    Bắt đầu học
                  </button>
                </div>
              </div>
            </div>

            {/* AI Call Card */}
            <div className="bg-gradient-to-b from-blue-600 to-indigo-900 dark:from-blue-900 dark:to-[#101828] rounded-2xl overflow-hidden shadow-xl shadow-blue-900/20 border border-blue-500/30 flex flex-col h-full text-white relative group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[120px] leading-none text-blue-400">
                  smart_toy
                </span>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 blur-[80px] opacity-20"></div>
              <div className="p-6 flex flex-col flex-1 relative z-10">
                <div className="size-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                  <span className="material-symbols-outlined text-secondary text-3xl">
                    record_voice_over
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Kaiwa với AI Sensei{" "}
                  <span className="align-top text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded ml-1 animate-pulse">
                    NEW
                  </span>
                </h3>
                <p className="text-sm text-blue-100 mb-6 opacity-80 leading-relaxed">
                  Luyện nói tiếng Nhật tự nhiên với trợ lý ảo thông minh 24/7.
                  Phản hồi tức thì về phát âm và ngữ điệu.
                </p>
                <div className="mt-auto">
                  <button className="w-full py-3 rounded-xl bg-secondary hover:bg-pink-400 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30">
                    <span className="material-symbols-outlined text-lg">
                      mic
                    </span>
                    Luyện tập ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FLASHCARDS SECTION */}
        <section className="px-6 md:px-12 lg:px-20 mt-24 mb-16 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 text-pink-400 font-bold mb-2 uppercase tracking-wider text-xs bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                <span className="material-symbols-outlined text-sm">style</span>
                <span>Smart Flashcards</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground dark:text-white leading-tight">
                Ghi nhớ từ vựng <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 text-glow">
                  siêu tốc với AI
                </span>
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-lg leading-relaxed max-w-xl">
                Trải nghiệm hệ thống Flashcards 3D sống động. Hình ảnh trực
                quan, ví dụ thực tế và thuật toán Spaced Repetition giúp bạn nhớ
                lâu hơn.
              </p>
              <button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:-translate-y-1">
                <span className="material-symbols-outlined">auto_awesome</span>
                Tạo Flashcard bằng AI
              </button>
            </div>
            <div className="flex-1 flex justify-center w-full relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[460px] bg-blue-200/50 dark:bg-blue-900/20 rounded-3xl rotate-6 border border-blue-500/20 -z-10 blur-sm"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[460px] bg-purple-200/50 dark:bg-purple-900/10 rounded-3xl -rotate-6 border border-purple-500/10 -z-20 blur-sm"></div>
              <div className="relative perspective-1000 group w-[320px] h-[440px] cursor-pointer">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180">
                  <div className="absolute inset-0 w-full h-full bg-card dark:bg-[#1E293B] rounded-3xl border border-border dark:border-slate-700/50 shadow-2xl overflow-hidden backface-hidden">
                    <div
                      className="h-3/5 bg-cover bg-center"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c')",
                      }}
                    >
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur rounded-lg px-2.5 py-1 text-white text-xs font-bold border border-white/10">
                        N4 - Kanji
                      </div>
                    </div>
                    <div className="h-2/5 p-6 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm text-foreground dark:text-white">
                      <h3 className="text-6xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
                        山
                      </h3>
                      <p className="text-lg text-slate-500 dark:text-slate-400 font-medium tracking-widest mt-2">
                        YAMA
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-950 to-slate-900 rounded-3xl border border-pink-500/30 shadow-2xl overflow-hidden rotate-y-180 backface-hidden p-8 flex flex-col justify-center text-center">
                    <div className="size-14 rounded-full bg-pink-500/20 text-pink-400 mx-auto flex items-center justify-center mb-6 ring-1 ring-pink-500/30">
                      <span className="material-symbols-outlined text-2xl">
                        translate
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Núi</h3>
                    <p className="text-slate-300 text-base mb-6 font-light">
                      Ngọn núi, đồi núi
                    </p>
                    <div className="bg-black/30 rounded-xl p-4 text-sm text-slate-300 border border-white/5 relative">
                      <span className="absolute -top-2 left-4 text-2xl text-pink-500/50 leading-none">
                        &quot;
                      </span>
                      <p className="italic mb-1 text-white">
                        富士山は日本で一番高い山です。
                      </p>
                      <p className="text-xs text-slate-500">
                        Núi Phú Sĩ là ngọn núi cao nhất Nhật Bản.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* JLPT PRACTICE */}
        <section className="px-6 md:px-12 lg:px-20 mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">
                  flag
                </span>
                Luyện thi JLPT thực chiến
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 mt-1">
                Bộ đề thi sát với thực tế từ N5 đến N1
              </p>
            </div>
            <a
              className="hidden md:flex items-center gap-1 text-primary dark:text-blue-400 font-bold hover:text-blue-300 transition-colors"
              href="#"
            >
              Kho đề thi{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { level: "N5", color: "blue", time: "105" },
              { level: "N4", color: "emerald", time: "125" },
              { level: "N3", color: "purple", time: "140" },
              { level: "N2", color: "red", time: "155" },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`group relative bg-card dark:bg-[#1E293B] border border-border dark:border-slate-700/50 rounded-2xl p-6 hover:border-${item.color}-500/50 transition-all hover:-translate-y-1 overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span
                    className={`material-symbols-outlined text-6xl text-${item.color}-500`}
                  >
                    {idx === 0
                      ? "timer"
                      : idx === 1
                        ? "assignment"
                        : idx === 2
                          ? "psychology"
                          : "workspace_premium"}
                  </span>
                </div>
                <div
                  className={`size-10 rounded-lg bg-${item.color}-500/20 text-${item.color}-600 dark:text-${item.color}-400 flex items-center justify-center mb-4`}
                >
                  <span className="font-bold">{item.level}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-1">
                  Đề thi thử {item.level}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
                  {idx * 2 + 3} đề • {item.time} phút/đề
                </p>
                <button
                  className={`w-full py-2 rounded-lg bg-muted dark:bg-slate-800 hover:bg-${item.color}-600 hover:text-white text-foreground dark:text-white text-sm font-medium transition-colors border border-border dark:border-slate-700 hover:border-${item.color}-600`}
                >
                  Làm bài ngay
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* VOICE CHAT SECTION */}
        <section className="px-6 md:px-12 lg:px-20 mt-20 mb-16">
          <div className="relative w-full min-h-[560px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[#0B1120]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-purple-900/10"></div>
            </div>
            <div
              className="absolute top-12 left-12 w-6 h-6 bg-pink-400/20 sakura-petal animate-float"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="absolute bottom-24 right-16 w-5 h-5 bg-pink-400/20 sakura-petal animate-float"
              style={{ animationDelay: "1.5s" }}
            ></div>
            <div
              className="absolute top-1/4 right-1/3 w-4 h-4 bg-pink-400/10 sakura-petal animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-1/3 left-1/4 w-7 h-7 bg-pink-400/10 sakura-petal animate-float"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="absolute top-20 right-20 w-3 h-3 bg-pink-400/20 sakura-petal rotate-45"></div>
            <div className="relative z-10 flex flex-col items-center max-w-3xl w-full px-4 text-center">
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                  <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Random Voice Chat
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-lg">
                  Fuji Match - Kết nối &amp; Luyện nói
                </h2>
                <p className="text-xl text-slate-300 font-medium font-light">
                  Tìm bạn luyện nói tiếng Nhật ngẫu nhiên
                </p>
              </div>
              <div className="w-full max-w-md mb-12">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                  Chọn trình độ của bạn
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["N5", "N4", "N3", "N2", "N1"].map((level) => (
                    <label key={level} className="cursor-pointer group">
                      <input
                        className="peer sr-only"
                        name="level"
                        type="radio"
                        defaultChecked={level === "N3"}
                      />
                      <span className="block px-5 py-2 rounded-full bg-slate-800/50 border border-slate-600 text-slate-400 font-bold transition-all peer-checked:bg-blue-600 peer-checked:border-blue-500 peer-checked:text-white peer-checked:shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:bg-slate-700">
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="group relative inline-flex items-center justify-center gap-3 bg-[#F472B6] hover:bg-pink-400 text-white text-lg font-bold px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(244,114,182,0.4)] hover:shadow-[0_0_50px_rgba(244,114,182,0.6)] transition-all transform hover:-translate-y-1">
                <span className="absolute -inset-1 rounded-2xl border border-pink-400 opacity-50 animate-ping"></span>
                <span className="material-symbols-outlined text-3xl">mic</span>
                <span>Bắt đầu ghép cặp</span>
              </button>
              <div className="mt-8 flex items-center gap-2 text-slate-500 text-sm">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>124 người đang online</span>
              </div>
            </div>
          </div>
        </section>

        {/* LEARNING PATH */}
        <section className="px-6 md:px-12 lg:px-20 mt-20">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500">
                timeline
              </span>
              Lộ trình học cá nhân hóa
            </h2>
            <p className="text-muted-foreground dark:text-slate-400 mt-2">
              Dựa trên mục tiêu JLPT N3 tháng 12/2024 của bạn
            </p>
          </div>
          <div className="bg-card dark:bg-[#1E293B] border border-border dark:border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 z-10">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-muted dark:bg-slate-700 -z-10 transform -translate-y-1/2 rounded-full"></div>
              <div
                className="hidden md:block absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 -z-10 transform -translate-y-1/2 rounded-full shadow-[0_0_15px_#3b82f6]"
                style={{ width: "40%" }}
              ></div>
              {/* Step 1 */}
              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto">
                <div className="relative">
                  <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/50 z-20">
                    <span className="material-symbols-outlined text-sm">
                      check
                    </span>
                  </div>
                  <div className="md:hidden absolute top-10 left-1/2 w-0.5 h-full bg-blue-600 -ml-[1px]"></div>
                </div>
                <div className="text-left md:text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">
                    Đã hoàn thành
                  </p>
                  <p className="text-foreground dark:text-white font-bold text-sm">
                    Bảng chữ cái &amp; Chào hỏi
                  </p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto">
                <div className="relative">
                  <div className="size-12 rounded-full bg-background dark:bg-[#1E293B] border-4 border-blue-500 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-[0_0_20px_#3b82f6] z-20">
                    <span className="material-symbols-outlined">
                      play_arrow
                    </span>
                  </div>
                  <div className="md:hidden absolute top-12 left-1/2 w-0.5 h-full bg-muted dark:bg-slate-700 -ml-[1px]"></div>
                </div>
                <div className="text-left md:text-center">
                  <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1 animate-pulse">
                    Đang học
                  </p>
                  <p className="text-foreground dark:text-white font-bold text-lg">
                    Ngữ pháp N5 - Bài 12
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                    Hạn hoàn thành: Hôm nay
                  </p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto opacity-60">
                <div className="relative">
                  <div className="size-10 rounded-full bg-muted dark:bg-slate-800 border-2 border-border dark:border-slate-600 flex items-center justify-center text-muted-foreground dark:text-slate-400 z-20">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <div className="md:hidden absolute top-10 left-1/2 w-0.5 h-full bg-muted dark:bg-slate-700 -ml-[1px]"></div>
                </div>
                <div className="text-left md:text-center">
                  <p className="text-xs text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Tiếp theo
                  </p>
                  <p className="text-foreground dark:text-slate-200 font-medium text-sm">
                    Kanji N5: Số đếm
                  </p>
                </div>
              </div>
              {/* Step 4 */}
              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto opacity-40">
                <div className="size-10 rounded-full bg-muted dark:bg-slate-800 border-2 border-border dark:border-slate-600 flex items-center justify-center text-muted-foreground dark:text-slate-400 z-20">
                  <span className="text-xs font-bold">4</span>
                </div>
                <div className="text-left md:text-center">
                  <p className="text-xs text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Sắp tới
                  </p>
                  <p className="text-foreground dark:text-slate-200 font-medium text-sm">
                    Hội thoại tại nhà hàng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMMUNITY SECTION */}
        <section className="px-6 md:px-12 lg:px-20 mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-400">
                  forum
                </span>
                Cộng đồng học viên
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 mt-1">
                Thảo luận sôi nổi nhất hôm nay
              </p>
            </div>
            <button className="text-sm font-bold text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white transition-colors border border-border dark:border-slate-700 px-4 py-2 rounded-lg hover:border-input dark:hover:border-slate-500 hover:bg-muted dark:hover:bg-slate-800">
              Tham gia thảo luận
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card dark:bg-[#1E293B] p-6 rounded-2xl border border-border dark:border-slate-700/50 hover:border-purple-500/30 transition-colors group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    question_mark
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20">
                      Hỏi đáp N3
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-slate-500">
                      • 2 giờ trước
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground dark:text-white mb-2 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                    Phân biệt ngữ pháp N3: について và に対して?
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2 mb-4">
                    Mọi người ơi, mình đang học N3 mà thấy hai cấu trúc này hơi
                    dễ nhầm lẫn. Có ai có mẹo nhớ không ạ? Mình cảm ơn nhiều!
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground dark:text-slate-500 font-medium">
                    <div className="flex items-center gap-1 hover:text-purple-500 dark:hover:text-purple-300 transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        thumb_up
                      </span>{" "}
                      24
                    </div>
                    <div className="flex items-center gap-1 hover:text-purple-500 dark:hover:text-purple-300 transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        chat_bubble
                      </span>{" "}
                      8 trả lời
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="flex -space-x-2">
                        <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-600 border border-card dark:border-[#1E293B]"></div>
                        <div className="size-5 rounded-full bg-slate-300 dark:bg-slate-500 border border-card dark:border-[#1E293B]"></div>
                        <div className="size-5 rounded-full bg-slate-400 dark:bg-slate-400 border border-card dark:border-[#1E293B]"></div>
                      </div>
                      <span className="ml-2">3 người đang thảo luận</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Thread 2 */}
            <div className="bg-card dark:bg-[#1E293B] p-6 rounded-2xl border border-border dark:border-slate-700/50 hover:border-emerald-500/30 transition-colors group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    tips_and_updates
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      Kinh nghiệm thi
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-slate-500">
                      • 5 giờ trước
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground dark:text-white mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    Review đề thi JLPT N2 tháng 7/2024
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2 mb-4">
                    Phần đọc hiểu năm nay khá dài nhưng từ vựng không quá khó.
                    Mọi người chú ý phần ngữ pháp câu 23 nhé, bẫy đấy...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground dark:text-slate-500 font-medium">
                    <div className="flex items-center gap-1 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        thumb_up
                      </span>{" "}
                      156
                    </div>
                    <div className="flex items-center gap-1 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        chat_bubble
                      </span>{" "}
                      42 trả lời
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="px-6 md:px-12 lg:px-20 mt-20 mb-20">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden border border-slate-700 shadow-2xl">
            <div className="absolute -right-20 -top-20 opacity-5 rotate-12 pointer-events-none">
              <span className="material-symbols-outlined text-[300px] text-white">
                filter_vintage
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Bạn đã sẵn sàng chinh phục JLPT?
              </h2>
              <p className="text-slate-300">
                Đăng ký ngay hôm nay để nhận ưu đãi 30% cho khóa học Premium đầu
                tiên.
              </p>
            </div>
            <div className="relative z-10 flex gap-4 w-full md:w-auto">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all w-full md:w-auto whitespace-nowrap shadow-lg shadow-blue-500/30">
                Đăng ký tư vấn
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
