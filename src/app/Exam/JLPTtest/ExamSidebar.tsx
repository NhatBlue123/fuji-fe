"use client";
import  { useState } from "react"; 

interface SidebarProps {
  currentQ: number;
  answers: Record<number, string>;
  onSelect: (n: number) => void;
}

export default function ExamSidebar({ currentQ, answers, onSelect }: SidebarProps) {
  
  
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);

  const toggleFlag = () => {
    if (flaggedQuestions.includes(currentQ)) {
      setFlaggedQuestions(flaggedQuestions.filter(q => q !== currentQ));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQ]);
    }
  };
  const isCurrentFlagged = flaggedQuestions.includes(currentQ);

  const renderGrid = (start: number, end: number, title: string) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">{title}</p>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: end - start + 1 }, (_, i) => {
          const n = start + i;
          const isCurrent = currentQ === n;
          const isAnswered = !!answers[n];
          
          const isFlagged = flaggedQuestions.includes(n);
          
          return (
            <button
              key={n}
              onClick={() => onSelect(n)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 relative overflow-hidden
                ${isCurrent ? 'z-10 font-bold text-white scale-110 shadow-lg' : 'text-slate-300 hover:opacity-100 hover:bg-slate-700'}`}
              style={{
                backgroundColor: isAnswered ? '#ee2b5b' : '#334155',
                border: isCurrent ? '2px solid #3b82f6' : '2px solid transparent',
                boxShadow: isCurrent ? '0 0 10px rgba(59, 130, 246, 0.5)' : (isAnswered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none')
              }}
            >
              {n}
              {isCurrent && (
                 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                 </span>
              )}
              {isFlagged && (
                <span className="absolute top-0.5 right-0.5 z-10">
                   <span 
                     className="material-symbols-outlined text-[10px] text-yellow-400 drop-shadow-md"
                     style={{ fontVariationSettings: "'FILL' 1" }}
                   >
                     flag
                   </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-80 shrink-0 border-l border-slate-700 bg-[#1E293B] hidden xl:flex flex-col z-30 h-full shadow-xl">
      <div className="p-5 border-b border-slate-700 flex justify-between items-center text-white font-bold bg-[#162032]">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ee2b5b]">grid_view</span>
          Danh sách câu hỏi
        </span>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
          {Object.keys(answers).length}/77
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
         <div className="flex items-center justify-between gap-2 mb-6 text-[10px] font-medium text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
           <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-[#334155]"></div><span>Chưa làm</span></div>
           <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-[#ee2b5b]"></div><span>Đã làm</span></div>
           <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full border-2 border-[#3b82f6]"></div><span>Hiện tại</span></div>
        </div>
        {renderGrid(1, 28, " Từ Vựng & Kanji ")}
        {renderGrid(29, 46, " Ngữ Pháp ")}
        {renderGrid(47, 49, " Đọc Hiểu ")}
        {renderGrid(50, 77, "Nghe Hiểu ")}
      </div>
       <div className="p-4 border-t border-slate-700 bg-[#162032]">
        <button 
          onClick={toggleFlag} 
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 font-medium group active:scale-95"
          style={{
            borderColor: isCurrentFlagged ? '#facc15' : '#475569',    
            backgroundColor: isCurrentFlagged ? 'rgba(250, 204, 21, 0.1)' : 'transparent', 
            color: isCurrentFlagged ? '#facc15' : '#cbd5e1',          
          }}
          onMouseOver={(e) => !isCurrentFlagged && (e.currentTarget.style.backgroundColor = '#334155')}
          onMouseOut={(e) => !isCurrentFlagged && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            <span 
               className={`material-symbols-outlined text-[20px] transition-colors ${isCurrentFlagged ? 'text-yellow-400' : 'group-hover:text-yellow-400'}`}
               style={{ fontVariationSettings: isCurrentFlagged ? "'FILL' 1" : "'FILL' 0" }}
            >
                flag
            </span>
            <span>{isCurrentFlagged ? "Bỏ đánh dấu" : "Đánh dấu câu hỏi"}</span>
        </button>
        </div>
    </aside>
  );
}