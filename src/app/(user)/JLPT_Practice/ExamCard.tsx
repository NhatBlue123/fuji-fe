"use client";
import Link from "next/link"; 

interface ExamCardProps {
  testId: number;
  status: "new" | "doing" | "done" | "locked";
  title: string;
  image: string;
  tag: string;
  info: string;
  colorTheme?: string; 
}

export default function ExamCard({ 
  testId, status, title, image, tag, info, colorTheme = "accent-pink" 
}: ExamCardProps) {

  const renderBadge = () => {
    switch (status) {
      case "new": return <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] font-bold border border-slate-700">Chưa làm</span>;
      case "doing": return <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-blue-500/20 backdrop-blur-sm text-blue-400 text-[10px] font-bold border border-blue-500/20">Đang làm</span>;
      case "done": return <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check</span> Đã xong</span>;
      case "locked": return <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-yellow-500/10 backdrop-blur-sm text-yellow-300 text-[10px] font-bold border border-yellow-500/20 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">lock</span> Premium</span>;
    }
  };

  const renderButton = () => {
    if (status === "locked") {
      return (
        <button className="w-full py-2 rounded-lg bg-slate-800 text-slate-500 text-sm font-bold border border-slate-700 cursor-not-allowed">
          Đã khóa
        </button>
      );
    }
    let btnClass = "";
    let btnText = "";

    if (status === "new") {
      btnClass = `bg-${colorTheme} hover:bg-white text-slate-900 hover:text-slate-900 shadow-pink-500/10`;
      btnText = "Bắt đầu làm bài";
    } else if (status === "doing") {
      btnClass = "bg-slate-700 hover:bg-blue-600 text-white border-slate-600 hover:border-blue-500";
      btnText = "Tiếp tục";
    } else if (status === "done") {
      btnClass = "bg-slate-700 hover:bg-blue-600 text-white border-slate-600 hover:border-blue-500";
      btnText = "Xem kết quả";
    }

    return (
      <Link href={`/Exam/JLPTtest?testId=${testId}`} className={`block w-full py-2 rounded-lg text-center text-sm font-bold transition-all border border-transparent shadow-lg ${btnClass}`}>
        {btnText}
      </Link>
    );
  };

  return (
    <article className={`glass-card rounded-2xl flex flex-col group hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full ${status === 'done' ? 'border-t-4 border-t-emerald-500' : ''}`}>
      
      {/* Lớp phủ khóa Premium */}
      {status === "locked" && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-4xl text-yellow-400 mb-2">lock</span>
          <p className="text-white font-bold text-sm mb-3">Thành viên Premium</p>
          <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-lg text-xs shadow-lg shadow-yellow-500/20">Nâng cấp</button>
        </div>
      )}

      {/* Ảnh bìa */}
      <div className={`relative h-40 bg-slate-800 overflow-hidden ${status === 'locked' ? 'grayscale group-hover:grayscale-0' : ''}`}>
        <img alt={title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" src={image} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent"></div>
        {renderBadge()}
        {status === "doing" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
            <div className="bg-blue-500 h-full w-[45%] shadow-[0_0_10px_#3b82f6]"></div>
          </div>
        )}
      </div>

      {/* Nội dung text */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${colorTheme} text-slate-900`}>{tag}</span>
          <span className="text-xs text-slate-400 font-medium">• {info}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-4 group-hover:text-white/80 transition-colors line-clamp-2">
          {title}
        </h3>
        <div className="mt-auto pt-4 border-t border-white/5">
          {renderButton()}
        </div>
      </div>
    </article>
  );
}