"use client";
import type { JlptQuestion } from "@/types/jlpt";

interface ContentProps {
  currentQ: number;
  question?: JlptQuestion;
  selectedAnswer?: number;
  onSelectOption: (opt: number) => void;
}

// Simple view for vocabulary and grammar questions
const StandardView = ({ question, qNum, selected, onSelect }: any) => (
  <div className="max-w-4xl mx-auto w-full pt-4 md:pt-10 px-4">
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-[#ee2b5b] mb-1 uppercase tracking-wide">
        {question.type} QUESTION
      </h2>
      <p className="text-slate-400 text-sm">Chọn đáp án thích hợp</p>
    </div>

    <div className="bg-[#151c2c] border border-slate-700/50 rounded-xl p-6 md:p-8 shadow-2xl">
      <div className="mb-8">
        <span className="text-white font-bold text-lg mb-4 block">Câu hỏi {qNum + 1}</span>
        <h3 className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed font-display whitespace-pre-wrap">
          {question.questionText || question.content}
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {question.options.map((opt: string, index: number) => {
          const isSelected = selected === index;
          return (
            <div
              key={index}
              onClick={() => onSelect(index)}
              className={`group flex items-center gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer
                ${
                  isSelected
                    ? "bg-slate-800 border-[#ee2b5b] shadow-[0_0_15px_rgba(238,43,91,0.15)]"
                    : "bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-500"
                }`}
            >
              <div
                className={`size-10 rounded flex items-center justify-center font-bold text-sm transition-colors shrink-0
                 ${isSelected ? "bg-[#ee2b5b] text-white" : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"}`}
              >
                {index + 1}
              </div>
              <span className={`text-lg font-medium ${isSelected ? "text-white" : "text-slate-300"}`}>
                {opt}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default function ExamContent({
  currentQ,
  question,
  selectedAnswer,
  onSelectOption,
}: ContentProps) {
  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B1120] text-slate-400">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl mb-4">quiz</span>
          <p>Không có câu hỏi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B1120] text-slate-200">
      <StandardView 
        question={question} 
        qNum={currentQ} 
        selected={selectedAnswer} 
        onSelect={onSelectOption} 
      />
      <div className="h-10"></div>
    </div>
  );
}