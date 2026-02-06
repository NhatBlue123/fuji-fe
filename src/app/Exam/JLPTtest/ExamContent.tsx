"use client";
interface ContentProps {
  currentQ: number;
  selectedAnswer?: string;
  onSelectOption: (opt: string) => void;
}

// làm data ảo để test hiển thị
const getQuestionData = (q: number) => {
  if (q <= 28) {
    return {
      type: "vocab",
      title: "MONDAI 1: TỪ VỰNG",
      subtitle: "Chọn từ thích hợp để điền vào chỗ trống",
      question: "彼は_______な性格で、誰とでもすぐに仲良くなれる。",
      options: [
        { id: "A", text: "明るい" },
        { id: "B", text: "暗い" },
        { id: "C", text: "重い" },
        { id: "D", text: "軽い" },
      ]
    };
  } else if (q <= 46) {
    return {
      type: "grammar",
      title: "MONDAI 2: NGỮ PHÁP",
      subtitle: "Chọn ngữ pháp thích hợp để điền vào chỗ trống",
      question: "雨が降っている_______、試合は中止になりません。",
      options: [
        { id: "A", text: "のに" },
        { id: "B", text: "けど" },
        { id: "C", text: "から" },
        { id: "D", text: "ので" },
      ]
    };
  } else if (q <= 49) {
    return {
      type: "reading",
      title: "MONDAI 3: ĐỌC HIỂU",
      passage: "私は東京に住んでいます。東京はとてもにぎやかな町です。でも、静かな場所もあります... (Đoạn văn dài)...",
      question: `Question ${q}: この文章の筆者は、公園についてどう思っていますか。`,
      options: [
        { id: "A", text: "にぎやかすぎて、あまり好きではない。" },
        { id: "B", text: "いつまでもきれいであってほしいと願っている。" },
        { id: "C", text: "遊具が少ないので、もっと増やしてほしい。" },
        { id: "D", text: "花見の客がうるさいので、困っている。" },
      ]
    };
  } else {
    if (50 <= q && q <= 68) {
      return {
        type: "listening",
        title: "MONDAI 4: NGHE HIỂU (CÓ TRANH)",
        subtitle: "Nhìn tranh và chọn đáp án đúng",
        imageSrc: "https://i.pinimg.com/736x/29/90/18/299018c641cc9a62939b4b7264887373.jpg", // Link ảnh để demo
        question: "これは何ですか。",
        options: [
          { id: "1", text: "にぎやかすぎて、あまり好きではない。" },
          { id: "2", text: "静かな場所を求める。" },
          { id: "3", text: "花見の客がうるさいので、困っている。" },
          { id: "4", text: "花見の客が多すぎて、うるさい。" },
        ]
      };
    } 
    
   
    return {
      type: "listening",
      title: "MONDAI 4: NGHE HIỂU",
      subtitle: "Nghe đoạn hội thoại và chọn câu trả lời đúng",
      imageSrc: null, 
      question: "男の人は何をしますか。",
      options: [
        { id: "A", text: "資料をコピーする" },
        { id: "B", text: "会議室を予約する" },
        { id: "C", text: "お茶を入れる" },
        { id: "D", text: "部長に電話する" },
      ]
    };
  }
};


const StandardView = ({ data, qNum, selected, onSelect }: any) => (
  <div className="max-w-4xl mx-auto w-full pt-4 md:pt-10 px-4">
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-[#ee2b5b] mb-1 uppercase tracking-wide">
        {data.title}
      </h2>
      <p className="text-slate-400 text-sm">{data.subtitle}</p>
    </div>

    <div className="bg-[#151c2c] border border-slate-700/50 rounded-xl p-6 md:p-8 shadow-2xl">
      <div className="mb-8">
        <span className="text-white font-bold text-lg mb-4 block">Câu hỏi {qNum}</span>
        <h3 className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed font-display">
          {data.question}
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {data.options.map((opt: any) => {
           const isSelected = selected === opt.id;
           return (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`group flex items-center gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer
                ${isSelected 
                  ? 'bg-slate-800 border-[#ee2b5b] shadow-[0_0_15px_rgba(238,43,91,0.15)]' 
                  : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}`}
            >
              <div className={`size-10 rounded flex items-center justify-center font-bold text-sm transition-colors shrink-0
                 ${isSelected ? 'bg-[#ee2b5b] text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                {opt.id}
              </div>
              <span className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {opt.text}
              </span>
            </div>
           );
        })}
      </div>
    </div>
  </div>
);

const ListeningView = ({ data, qNum, selected, onSelect }: any) => {
  const hasImage = !!data.imageSrc;
  const AudioPlayerCard = () => (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden h-fit">
       <div className="absolute top-4 left-4">
         <span className="text-[10px] font-bold bg-[#ee2b5b]/10 text-[#ee2b5b] px-3 py-1 rounded-full border border-[#ee2b5b]/20">
            {hasImage ? "Nghe và chọn tranh" : "Nghe tình huống"}
         </span>
       </div>

       <div className="mt-8 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button className="size-14 rounded-full bg-[#ee2b5b] hover:bg-[#d61f4b] flex items-center justify-center text-white shadow-lg shadow-pink-500/40 transition-all active:scale-95">
               <span className="material-symbols-outlined text-4xl ml-1">play_arrow</span>
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1">
               <div className="flex justify-between text-xs text-slate-400 font-mono">
                 <span>0:14</span>
                 <span>2:45</span>
               </div>
               <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden w-full cursor-pointer group">
                 <div className="h-full w-[10%] bg-[#ee2b5b] rounded-full group-hover:bg-[#ff4d7d] relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 </div>
               </div>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors">
               <span className="material-symbols-outlined">replay</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-700/50">
             <div className="flex items-center gap-2 text-slate-400">
               <span className="material-symbols-outlined text-lg">volume_up</span>
               <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full w-3/4 bg-[#ee2b5b]"></div>
               </div>
             </div>
             <span className="text-xs text-slate-400 font-medium">Số lần nghe còn lại: <b className="text-[#ee2b5b] text-sm">2</b></span>
          </div>
       </div>
       
       <div className="mt-6 p-4 bg-[#0f1521] rounded-lg border border-slate-700/50 text-sm text-slate-400">
          <p className="font-bold text-slate-300 mb-2 text-xs uppercase opacity-70">Lưu ý:</p>
          <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
            <li>Bạn có thể nghe tối đa 2 lần</li>
            <li>Hãy tập trung lắng nghe trước khi chọn đáp án</li>
          </ul>
       </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto w-full pt-4 md:pt-10 px-4">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#ee2b5b] mb-1 uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined">headphones</span>
          {data.title}
        </h2>
        <p className="text-slate-400 text-sm">{data.subtitle}</p>
      </div>

      {hasImage ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cột trái: Ảnh tình huống minh họa */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden shadow-lg sticky top-6">
              <div className="p-3 border-b border-slate-700 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase">
                 Ảnh tình huống 
              </div>
              <div className="relative aspect-video w-full bg-black/50 flex items-center justify-center">
                 <img 
                   src={data.imageSrc} 
                   alt="Question Illustration" 
                   className="w-full h-full object-contain"
                 />
              </div>
            </div>
          </div>
          
          {/* Cột phải: Audio & Câu hỏi */}
          <div className="lg:w-1/2 flex flex-col gap-6">
             <AudioPlayerCard />
             <div className="bg-[#151c2c] border border-slate-700/50 rounded-xl p-6">
                <div className="mb-4">
                  <span className="text-white font-bold text-lg block">Câu hỏi {qNum}</span>
                  <p className="text-slate-300 mt-2 text-lg">{data.question}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {data.options.map((opt: any) => {
                    const isSelected = selected === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-slate-800 border-[#ee2b5b] shadow-[0_0_15px_rgba(238,43,91,0.15)]' 
                            : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800'}`}
                      >
                        <div className={`size-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0
                          ${isSelected ? 'bg-[#ee2b5b] border-[#ee2b5b] text-white' : 'border-slate-600 text-slate-400'}`}>
                          {opt.id}
                        </div>
                        <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>
      ) : (
        //nếu không có ảnh thì đẩy giao diện ra giữa
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
           <AudioPlayerCard />
           <div className="bg-[#151c2c] border border-slate-700/50 rounded-xl p-6 md:p-8">
              <div className="mb-6">
                <span className="text-white font-bold text-lg mb-2 block">Câu hỏi {qNum}</span>
                <h3 className="text-xl font-medium text-slate-200">{data.question}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {data.options.map((opt: any) => {
                  const isSelected = selected === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => onSelect(opt.id)}
                      className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer
                        ${isSelected 
                          ? 'bg-slate-800 border-[#ee2b5b] shadow-[0_0_15px_rgba(238,43,91,0.15)]' 
                          : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800'}`}
                    >
                      <div className={`size-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0
                        ${isSelected ? 'bg-[#ee2b5b] border-[#ee2b5b] text-white' : 'border-slate-600 text-slate-400'}`}>
                        {opt.id}
                      </div>
                      <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ReadingView = ({ data, qNum, selected, onSelect }: any) => (
  <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col pt-4 px-4 md:px-6">
    <div className="mb-4 shrink-0">
      <span className="text-sm font-bold uppercase tracking-wider text-[#ee2b5b]">
        {data.title}
      </span>
    </div>

    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-6">
      
      <div className="lg:w-1/2 flex flex-col bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center text-sm font-medium text-slate-400">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="material-symbols-outlined text-lg text-[#ee2b5b]">description</span> Passage Text
          </span>
          <div className="flex gap-2">
             <button className="text-xs border border-slate-600 px-2 py-0.5 rounded hover:bg-slate-700 hover:text-white transition-colors">A+</button>
             <button className="text-xs border border-slate-600 px-2 py-0.5 rounded hover:bg-slate-700 hover:text-white transition-colors">A-</button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto text-lg leading-loose text-slate-200 font-serif">
          {data.passage}
        </div>
      </div>

      {/* Cột Phải: Câu hỏi */}
      <div className="lg:w-1/2 flex flex-col overflow-y-auto">
        <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-start gap-3 mb-6">
              <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded font-bold uppercase shrink-0 mt-1 tracking-wider">Question {qNum}</span>
              <h3 className="text-lg font-medium text-white leading-relaxed">
                 {data.question.split(":")[1] || data.question}
              </h3>
          </div>
          <div className="flex flex-col gap-3">
            {data.options.map((opt: any) => {
               const isSelected = selected === opt.id;
               return (
                <div 
                  key={opt.id} 
                  onClick={() => onSelect(opt.id)}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
                    ${isSelected 
                      ? 'border-[#ee2b5b] bg-[#ee2b5b]/5' 
                      : 'border-slate-700 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center h-6">
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all
                       ${isSelected ? 'border-[#ee2b5b] bg-[#ee2b5b]' : 'border-slate-500 group-hover:border-slate-400'}`}>
                       {isSelected && <div className="size-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold mb-1 text-xs uppercase transition-colors ${isSelected ? 'text-[#ee2b5b]' : 'text-slate-500'}`}>
                      Option {opt.id}
                    </span>
                    <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {opt.text}
                    </span>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ExamContent({ currentQ, selectedAnswer, onSelectOption }: ContentProps) {
  
  const data = getQuestionData(currentQ);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B1120] text-slate-200">
      
      {(data.type === "vocab" || data.type === "grammar") && (
        <StandardView data={data} qNum={currentQ} selected={selectedAnswer} onSelect={onSelectOption} />
      )}

      {data.type === "reading" && (
        <ReadingView data={data} qNum={currentQ} selected={selectedAnswer} onSelect={onSelectOption} />
      )}

      {data.type === "listening" && (
        <ListeningView data={data} qNum={currentQ} selected={selectedAnswer} onSelect={onSelectOption} />
      )}
      
      <div className="h-10"></div>
    </div>
  );
}