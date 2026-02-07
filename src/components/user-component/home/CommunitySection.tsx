export function CommunitySection() {
  return (
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
                Mọi người ơi, mình đang học N3 mà thấy hai cấu trúc này hơi dễ
                nhầm lẫn. Có ai có mẹo nhớ không ạ? Mình cảm ơn nhiều!
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
                Phần đọc hiểu năm nay khá dài nhưng từ vựng không quá khó. Mọi
                người chú ý phần ngữ pháp câu 23 nhé, bẫy đấy...
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
  );
}
