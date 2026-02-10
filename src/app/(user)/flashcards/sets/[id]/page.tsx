import Link from "next/link";
import styles from "./page.module.css";

const cardStats = [
  {
    label: "Tiến độ",
    value: "Đang học",
    note: "Tiếp tục cố gắng nhé!",
    accentClass: "text-pink-300",
    iconType: "progress",
    progress: 65,
  },
  {
    label: "Đã nhớ",
    value: "45",
    note: "+5 thẻ hôm nay",
    accentClass: "text-blue-300",
    iconType: "brain",
    suffix: "/ 150 thẻ",
  },
  {
    label: "Ôn tập tiếp theo",
    value: "Ngày mai",
    note: "Lúc 09:00 sáng",
    accentClass: "text-purple-300",
    iconType: "calendar",
  },
];

const flashcards = [
  {
    status: "Đã thuộc",
    statusClass: "bg-green-500/10 text-green-400 border-green-500/20",
    starIcon: "star",
    kana: "私",
    romaji: "watashi",
    meaning: "Tôi",
    detail: "Đại từ nhân xưng ngôi 1",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE",
  },
  {
    status: "Chưa thuộc",
    statusClass: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    starIcon: "star_border",
    kana: "学生",
    romaji: "gakusei",
    meaning: "Học sinh",
    detail: "Sinh viên",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c",
  },
  {
    status: "Chưa thuộc",
    statusClass: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    starIcon: "star",
    starClass: "text-yellow-500",
    kana: "先生",
    romaji: "sensei",
    meaning: "Giáo viên",
    detail: "Thầy cô giáo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04",
  },
  {
    status: "Đã thuộc",
    statusClass: "bg-green-500/10 text-green-400 border-green-500/20",
    starIcon: "star_border",
    kana: "銀行員",
    romaji: "ginkouin",
    meaning: "Nhân viên ngân hàng",
    detail: "Người làm việc tại ngân hàng",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB-0H413QGHVmbebIlG1fj6OMnPzgFRDOaQZOq2DxLJMxtjK0P7VjCnCsjUlnAoun3J-acR1M3rSTXPDtqTNSTFUdFiJinhXaGf1nQNb1Gl8XA6gdYyijjozi-gJsg6V4tEB5xCpoCZaw1xb26qCFFYfLeCT64NwSSsPs-1Q64PHfLkuuvmdJdQpgUfIpcrb8S2jhDXazjs-F19uu8vR444_2S5hjtAWw1a5HOALkwVzUoBmbeLiuKC7CcBFfAbJ3IhdDZ4awJcN_c",
  },
  {
    status: "Chưa thuộc",
    statusClass: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    starIcon: "star_border",
    kana: "会社員",
    romaji: "kaishain",
    meaning: "Nhân viên công ty",
    detail: "Người làm công ăn lương",
  },
];

export default function FlashcardSetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex-1 overflow-y-auto relative scroll-smooth bg-background text-foreground">
      <div className="w-full relative">
        <section className="relative h-[450px] w-full overflow-hidden group bg-card">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear group-hover:scale-110"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFtrgYxIHrIC8LqsG9HSJRJi4ezZqXkxEH2gGQsH3olG72YrG6BtQqFbXhnI_PZUALjDZjyae-W9GgyY8v_pZPwDRPUrKcw6ivgEbXMzb8hl6Wagm2g5B9Hk5V87qAY0raZ2eNH-EmMakh8ymm42NaD06MLgJt-hX_tyWzZpOtmtCjQzYOy3_hlLnc9KfTBIkfK_o1FlsoZJvTyRM2Tg4x-m7B97Zuf9aA27SLZaEOObFxyvuAH4O6B0ZfEEtzvNUkAf5Z7Lf2pqE')",
            }}
          ></div>
          <div className={`absolute inset-0 ${styles.bannerGradient}`}></div>
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full bg-primary/10 mix-blend-overlay"></div>

          <div className="absolute top-6 left-6 md:left-10 z-10 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Link
              href="/flashcards"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Quay lại
            </Link>
            <span className="opacity-60">/</span>
            <Link
              href="/flashcards"
              className="hover:text-white transition-colors"
            >
              Flashsets
            </Link>
            <span className="opacity-60">/</span>
            <span className="text-foreground">Minna no Nihongo</span>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="bg-secondary/20 text-secondary-foreground border border-secondary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Level N5
                </span>
                <span className="bg-primary/20 text-primary-foreground border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Sơ cấp
                </span>
                <span className="bg-accent/40 text-accent-foreground border border-border/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Từ vựng
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight drop-shadow-lg tracking-tight">
                Từ vựng Minna no Nihongo <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                  Sơ cấp 1
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-medium text-sm md:text-base mt-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    style
                  </span>
                  <span>150 thẻ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    schedule
                  </span>
                  <span>45 phút học</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    update
                  </span>
                  <span>Cập nhật 2 ngày trước</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <img
                      alt="User"
                      className="w-6 h-6 rounded-full border border-white/20"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfFl_pOyFigGwfLtmeb6LniwUCm0yBud_fv-LOAt4SoJGaT1pzBnvbOgHz5kbgBJOB_ssp423Jkd3U7soqab37_QOtQjp5mQW96CfW95qvn9FSRNVuMMNXx7T7vxkuG7ZnHbevTkCEnYHd7eRQX_QSbjeoZteLQeY9ag0vm-wqmhxamd3eiryL-cOTWrKLJp4fETdKaaaZEcH--J8xyVwIDsYlZdYp_zX6qbEXJOIXInVkVVBxP_D4xyoF96BL9Zpu4P_AZlntpRY"
                    />
                    <img
                      alt="User"
                      className="w-6 h-6 rounded-full border border-white/20"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTyfbd-hnxHrIXJ1Sy5_LzcWGbNso2IRzDE8u7Ney3n-lLtyXDklyJSmjt_Apo6CkvtqT4SCwD5DRyuKYSHpPD9anvAN9NYmwVHzTbhQZpZChwHJdhcsYvy_yjA7m4vHEglPugU7e12CdtvLtnOevbiyOs4d6M9L-KmcnQ2NTd24cg0Wl_GYeBrvJotem__c2-28i9FpzraK6gQpJZ4uNRGdzEwSuhQAt-K4Wo56q-xYjnxenMeHSOxjtt7q5jGrqyRCIITNP1e9c"
                    />
                    <img
                      alt="User"
                      className="w-6 h-6 rounded-full border border-white/20"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD53X8X3vIHM6x4BdBWvXcxV0ZWZZbN6qNiyqaXSWW8V2Edb90Dn4wMoiUzbhq7FzLv54fNLw3w5FYSAy3FG41Vh8ND4aQb_5PRhiN_xRtEsB16gM65h2EQS10lFctFnpioUFnvoTG23tbdSIsWjRriHWmt6ouUMFWadHjNWNXU8ZTSxhGff_ecnBpgtJKbOgxO18VbWJGCjfBYg9uQy1TZokDW_3M05cj6_xiGpWym3q_X55FA2lySz_1ldI9lZIy8982TaSoLK04"
                    />
                  </div>
                  <span>+1.2k người học</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                href={`/flashcards/learn/${params.id}`}
                className="group relative px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-2xl shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 inline-flex"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-3 text-lg">
                  <span
                    className={`material-symbols-outlined filled ${styles.pulseSlow}`}
                  >
                    play_circle
                  </span>
                  Bắt đầu học ngay
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-[1600px] mx-auto w-full p-6 md:p-10 -mt-10 relative z-20 flex flex-col gap-10">
          <div
            className={`${styles.glassPanel} rounded-2xl p-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40 shadow-xl`}
          >
            {cardStats.map((stat) => (
              <div
                key={stat.label}
                className="flex-1 p-6 flex items-center gap-4"
              >
                {stat.iconType === "progress" ? (
                  <div className="relative size-16 shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      ></path>
                      <path
                        className="text-secondary drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${stat.progress}, 100`}
                        strokeWidth="3"
                      ></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                      {stat.progress}%
                    </div>
                  </div>
                ) : (
                  <div
                    className={`size-16 rounded-2xl border flex items-center justify-center shrink-0 ${
                      stat.iconType === "brain"
                        ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20"
                        : "bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-3xl ${
                        stat.iconType === "brain"
                          ? "text-primary"
                          : "text-secondary"
                      }`}
                    >
                      {stat.iconType === "brain"
                        ? "psychology"
                        : "event_upcoming"}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {stat.value}
                    {stat.suffix ? (
                      <span className="text-sm text-muted-foreground font-normal">
                        {stat.suffix}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-xs mt-1 ${stat.accentClass}`}>
                    {stat.note}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button className="px-5 py-3 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 text-foreground font-medium transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-foreground transition-colors">
                shuffle
              </span>
              Trộn thẻ
            </button>
            <button className="px-5 py-3 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 text-foreground font-medium transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-foreground transition-colors">
                quiz
              </span>
              Chế độ thi thử
            </button>
            <button className="px-5 py-3 rounded-xl bg-card/40 hover:bg-card/60 border border-border/40 text-foreground font-medium transition-all flex items-center gap-2 ml-auto group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-foreground transition-colors">
                tune
              </span>
              Cài đặt bộ thẻ
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="w-1 h-8 bg-secondary rounded-full"></span>
                Danh sách thẻ
              </h2>
              <div className="flex items-center gap-2 bg-card/40 rounded-lg p-1 border border-border/40">
                <button className="p-2 rounded bg-card/80 text-foreground shadow-sm">
                  <span className="material-symbols-outlined text-sm">
                    grid_view
                  </span>
                </button>
                <button className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors">
                  <span className="material-symbols-outlined text-sm">
                    view_list
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {flashcards.map((card) => (
                <article
                  key={`${card.kana}-${card.romaji}`}
                  className="group relative bg-card border border-border/40 rounded-2xl p-6 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border uppercase ${card.statusClass}`}
                    >
                      {card.status}
                    </span>
                    <button
                      className={`transition-colors ${
                        card.starClass
                          ? card.starClass
                          : "text-muted-foreground hover:text-secondary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {card.starIcon}
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-4">
                    <h3 className="text-4xl font-black text-foreground mb-2 group-hover:text-secondary transition-colors">
                      {card.kana}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {card.romaji}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-border/40 flex items-center gap-3">
                    {card.image ? (
                      <div
                        className="size-10 rounded-lg bg-muted bg-cover bg-center shrink-0 border border-border/40"
                        style={{ backgroundImage: `url('${card.image}')` }}
                      ></div>
                    ) : (
                      <div className="size-10 rounded-lg bg-muted border border-border/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-muted-foreground">
                          work
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {card.meaning}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {card.detail}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button className="px-6 py-3 rounded-xl bg-card/40 hover:bg-card/60 text-muted-foreground hover:text-foreground font-medium transition-all text-sm border border-border/40">
                Xem thêm 25 thẻ nữa
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="h-20"></div>
    </div>
  );
}
