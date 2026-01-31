export default function FlashCard() {
  return (
    <section className="px-6 md:px-12 lg:px-20 mt-24 mb-6 ">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-slate-950 from-[#050810] via-[#0B1120] to-[#050810]" />

      <div className="relative z-10 flex flex-rows lg:flex-row items-center justify-between gap-20">
        {/* LEFT CONTENT */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xl font-bold tracking-wider
            bg-pink-500/10 text-pink-400 border border-pink-500/20 uppercase mb-4"
          >
            <span className="material-symbols-outlined text-sm">style</span>
            Smart Flashcards
          </div>

          <h2 className="text-6xl md:text-6xl font-black leading-tight text-white mb-4">
            Ghi nhớ từ vựng <br />
            <span className="text-pink-400 drop-shadow-[0_0_55px_rgba(236,72,153,0.9)]">
              siêu tốc với AI
            </span>
          </h2>

          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            Trải nghiệm hệ thống Flashcards 3D sống động. Hình ảnh trực quan, ví
            dụ thực tế và thuật toán Spaced Repetition giúp bạn nhớ lâu hơn.
          </p>

          <button
            className="mt-4 inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white
            bg-slate-950 from-pink-500 to-purple-500
            shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50
            transition-all hover:-translate-y-0.5"
          >
            ✨ Tạo Flashcard bằng AI
          </button>
        </div>

        {/* RIGHT CARD */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative mt-8">
          {/* Glow layer */}
          <div
            className="absolute rounded-3xl bg-purple-500/15 blur-3xl"
            style={{ width: "380px", height: "520px" }}
          />

          {/* Card */}
          <div
            className="relative bg-[#1E293B]/80 border border-white/10
      backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.6)]
      flex flex-col items-center justify-center text-center
      rounded-3xl transition-transform duration-500 hover:-translate-y-2"
            style={{ width: "360px", height: "480px" }}
          >
            {/* Badge */}
            <div
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full
      bg-black/60 text-white border border-white/10 backdrop-blur"
            >
              N4 - Kanji
            </div>

            {/* Kanji */}
            <div className="text-8xl font-black text-white drop-shadow-[0_10px_40px_rgba(255,255,255,0.15)] mb-3">
              山
            </div>

            {/* Romaji */}
            <div className="text-slate-400 tracking-[0.3em] text-lg font-semibold ml-2">
              Y A M A
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
