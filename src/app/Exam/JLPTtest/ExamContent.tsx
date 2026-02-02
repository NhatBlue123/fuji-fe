"use client";
import React from "react";

interface ContentProps {
  currentQ: number;
  selectedAnswer?: string;
  onSelectOption: (opt: string) => void;
}

export default function ExamContent({ currentQ, selectedAnswer, onSelectOption }: ContentProps) {
  const options = [
    { id: "A", text: "にぎやかすぎて、あまり好きではない。" },
    { id: "B", text: "いつまでもきれいであってほしいと願っている。" },
    { id: "C", text: "遊具が少ないので、もっと増やしてほしい。" },
    { id: "D", text: "花見の客がうるさいので、困っている。" },
  ];

  return (
   
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background-dark ">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-6">
        
        
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wider mb-1 text-[#ee2b5b]">
            Mondai 3: Reading Comprehension
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Question {currentQ}</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-240px)] min-h-[500px]">
          
          
          <div className="lg:w-1/2 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex justify-between items-center text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">description</span> Passage Text
              </span>
              <div className="flex gap-2">
                <span className="text-xs border border-border px-2 py-0.5 rounded cursor-pointer hover:bg-muted">A+</span>
                <span className="text-xs border border-border px-2 py-0.5 rounded cursor-pointer hover:bg-muted">A-</span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto font-display text-lg leading-loose text-card-foreground">
              <p className="mb-4">私は東京に住んでいます。東京はとてもにぎやかな町です。でも、静かな場所もあります。例えば、私の家の近くに公園があります。その公園はとても広くて、木がたくさんあります。</p>
              <p className="mb-4">週末には、家族連れやカップルがたくさん来ます。子供たちは遊具で遊んだり、ボールを蹴ったりしています。大人たちはベンチに座って本を読んだり、散歩をしたりしています。</p>
              <p className="mb-4">春には桜が咲きます。たくさんの人が花見に来ます。みんなでお酒を飲んだり、お弁当を食べたりして、とても楽しそうです。夏にはお祭りがあります。盆踊りを踊ったり、花火を見たりします。秋には紅葉がきれいです。赤や黄色の葉っぱがとても美しいです。</p>
              <p className="mb-4">冬には雪が降ることもあります。雪だるまを作ったり、雪合戦をしたりします。私はこの公園が大好きです。いつまでもきれいな公園であってほしいと思います。</p>
            </div>
          </div>

        
          <div className="lg:w-1/2 flex flex-col gap-3">
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-4">
              <div className="flex items-start gap-3 mb-6">
                 <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-bold uppercase">Question</span>
                 <h3 className="text-lg font-medium text-card-foreground font-display leading-relaxed">
                  この文章の筆者は、公園についてどう思っていますか。
                </h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {options.map((opt) => {
                  const isSelected = selectedAnswer === opt.id;
                  return (
                    <label 
                      key={opt.id} 
                      className="group relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/50"
                      style={{
                        borderColor: isSelected ? '#ee2b5b' : 'var(--color-border)', 
                        backgroundColor: isSelected ? 'rgba(49, 35, 39, 0.1)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center h-6">
                        <input 
                          type="radio" 
                          name="exam-option"
                          checked={isSelected}
                          onChange={() => onSelectOption(opt.id)}
                          className="hidden" 
                        />
                        
                        <div 
                           className="size-5 rounded-full border-2 flex items-center justify-center transition-all"
                           style={{
                             borderColor: isSelected ? '#ee2b5b' : 'var(--color-muted-foreground)',
                             backgroundColor: isSelected ? '#ee2b5b' : 'transparent',
                           }}
                        >
                          {isSelected && <div className="size-2 bg-white rounded-full shadow-sm"></div>}
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span 
                          className="font-bold mb-1 text-xs uppercase transition-colors"
                          style={{ color: isSelected ? '#ee2b5b' : 'var(--color-muted-foreground)' }}
                        >
                          Option {opt.id}
                        </span>
                        <span className={`font-display text-base font-medium transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {opt.text}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}