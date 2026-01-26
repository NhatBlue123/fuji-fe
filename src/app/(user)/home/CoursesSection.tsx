
const CoursesSection = () => {
  const courses = [
    {
      title: 'Tiếng Nhật N5 Tổng Quát',
      description: 'Nắm vững bảng chữ cái Hiragana, Katakana và các mẫu câu giao tiếp cơ bản.',
      level: 'N5 - Sơ cấp',
      progress: 35,
      bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE',
    },
    {
      title: 'Luyện thi JLPT N4',
      description: 'Ôn tập ngữ pháp, từ vựng và Kanji cho kỳ thi năng lực tiếng Nhật N4.',
      level: 'N4 - Sơ trung cấp',
      progress: 12,
      bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04',
    },
  ]

  return (
    <section className="px-6 md:px-12 lg:px-20 mt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Khóa học của bạn</h2>
          <p className="text-slate-400 mt-1">Tiếp tục hành trình chinh phục tiếng Nhật nào!</p>
        </div>
        <a className="hidden md:flex items-center gap-1 text-blue-400 font-bold hover:text-blue-300 transition-colors" href="#">
          Xem tất cả
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.title}
            className="bg-card-bg rounded-2xl overflow-hidden shadow-lg border border-slate-700/50 hover:border-blue-500/30 transition-all hover:translate-y-[-4px] flex flex-col h-full group"
          >
            <div className="h-44 bg-slate-800 relative overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80"
                style={{ backgroundImage: `url('${course.bgImage}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-lg">
                {course.level}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed">{course.description}</p>
              <div className="mt-auto">
                <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>Tiến độ</span>
                  <span className="text-white">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-5">
                  <div
                    className="bg-gradient-to-r from-secondary to-pink-600 h-2 rounded-full shadow-[0_0_10px_#F472B6]"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <button className="w-full py-2.5 rounded-lg border border-slate-600 text-white font-bold hover:bg-blue-600 hover:border-blue-600 transition-all text-sm">
                  {course.progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* AI Course */}
        <div className="bg-gradient-to-b from-blue-900 to-[#101828] rounded-2xl overflow-hidden shadow-xl shadow-blue-900/20 border border-blue-500/30 flex flex-col h-full text-white relative group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[120px] leading-none text-blue-400">smart_toy</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 blur-[80px] opacity-20"></div>
          <div className="p-6 flex flex-col flex-1 relative z-10">
            <div className="size-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-glow">
              <span className="material-symbols-outlined text-secondary text-3xl">record_voice_over</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Kaiwa với AI Sensei <span className="align-top text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded ml-1 animate-pulse">NEW</span>
            </h3>
            <p className="text-sm text-blue-100 mb-6 opacity-80 leading-relaxed">
              Luyện nói tiếng Nhật tự nhiên với trợ lý ảo thông minh 24/7. Phản hồi tức thì về phát âm và ngữ điệu.
            </p>
            <div className="mt-auto">
              <button className="w-full py-3 rounded-xl bg-secondary hover:bg-pink-400 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30">
                <span className="material-symbols-outlined text-lg">mic</span>
                Luyện tập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CoursesSection