"use client";

export function FlashcardsSection() {
  return (
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
            Trải nghiệm hệ thống Flashcards 3D sống động. Hình ảnh trực quan, ví
            dụ thực tế và thuật toán Spaced Repetition giúp bạn nhớ lâu hơn.
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
  );
}
