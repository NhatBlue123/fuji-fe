"use client";
import { useEffect, useState } from "react";
import type { JlptQuestion } from "@/types/jlpt";
import { renderJlptText } from "@/lib/renderJlptText";

interface ContentProps {
  currentQ: number;
  question?: JlptQuestion;
  answers: Record<number, number>;
  scrollTrigger?: number;          // increments only on sidebar click → triggers scroll
  onSelectOption: (questionId: number, opt: number) => void;
}

// ─── Audio Player ──────────────────────────────────────────────────────────────
const AudioPlayer = ({ url }: { url: string }) => (
  <div className="mb-6 bg-slate-800 border border-violet-500/30 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-violet-400 text-sm">volume_up</span>
      </div>
      <span className="text-violet-300 text-sm font-medium">Audio — nghe và chọn đáp án</span>
    </div>
    <audio controls className="w-full" src={url} style={{ colorScheme: "dark" }}>
      Trình duyệt không hỗ trợ audio.
    </audio>
  </div>
);

// ─── Options list ──────────────────────────────────────────────────────────────
const OptionList = ({
  options,
  selected,
  onSelect,
  large = false,
}: {
  options: string[];
  selected?: number;
  onSelect: (i: number) => void;
  large?: boolean;
}) => (
  <div className="flex flex-col gap-2.5">
    {options.map((opt, index) => {
      const isSelected = selected === index + 1;
      return (
        <div
          key={index}
          onClick={() => onSelect(index + 1)}
          className={`group flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer
            ${isSelected
              ? "bg-slate-800 border-[#ee2b5b] shadow-[0_0_12px_rgba(238,43,91,0.15)]"
              : "bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-500"
            }`}
        >
          <div
            className={`${large ? "size-10" : "size-8"} rounded flex items-center justify-center font-bold text-sm transition-colors shrink-0
              ${isSelected
                ? "bg-[#ee2b5b] text-white"
                : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"
              }`}
          >
            {index + 1}
          </div>
          <span className={`${large ? "text-lg" : "text-base"} font-medium font-jp ${isSelected ? "text-white" : "text-slate-300"}`}>
            {opt}
          </span>
        </div>
      );
    })}
  </div>
);

// helpers
const parseOpts = (opts: any): string[] => {
  if (Array.isArray(opts)) return opts;
  try { const p = JSON.parse(opts); return Array.isArray(p) ? p : []; } catch { return []; }
};

// ─── Reading Group View (passage + ALL sub-questions stacked) ─────────────────
const ReadingGroupView = ({
  question,
  currentQ,
  scrollTrigger,
  answers,
  onSelect,
}: {
  question: JlptQuestion;
  currentQ: number;
  scrollTrigger?: number;
  answers: Record<number, number>;
  onSelect: (questionId: number, opt: number) => void;
}) => {
  const parent = (question as any).parent ?? null;

  // Scroll to the active sub-question ONLY when sidebar was clicked (scrollTrigger increments)
  // Depends on scrollTrigger, NOT on question — so manual scrolling never causes snap-back
  useEffect(() => {
    if (!scrollTrigger) return; // skip initial render (scrollTrigger starts at 0)
    const target = document.getElementById(`sub-q-${(question as any).questionOrder}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTrigger]); // intentionally omit `question` — only fire on sidebar click

  const passageText = parent?.contentText ?? (question as any).contentText ?? "";
  const mondaiTitle = (question as any).mondaiTitle ?? parent?.mondaiTitle ?? null;
  const mondaiNumber = (question as any).mondaiNumber ?? parent?.mondaiNumber ?? null;

  // All sibling questions sorted by questionOrder
  const siblings: JlptQuestion[] = parent?.children
    ? [...parent.children].sort((a: any, b: any) => a.questionOrder - b.questionOrder)
    : [question];

  // Use sequential group base (attached by page.tsx) for consistent labels with admin sidebar
  const baseOrder: number =
    (question as any).parent?.passageGroupBase ??
    siblings[0]?.questionOrder ??
    (question as any).questionOrder ??
    0;

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 md:pt-8 px-4 pb-8">
      {/* Section label + mondai instruction */}
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold text-[#ee2b5b] uppercase tracking-wide">
          {question.section} QUESTION
        </h2>
        {(mondaiNumber || mondaiTitle) && (
          <p className="text-slate-300 text-sm mt-1 font-jp leading-relaxed">
            {mondaiNumber && <span className="font-bold mr-1">問題{mondaiNumber}</span>}
            {mondaiTitle}
          </p>
        )}
      </div>

      {/* Passage */}
      {passageText && (
        <div className="bg-slate-800/70 border border-blue-500/30 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-400 text-sm">article</span>
            <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Đoạn văn</span>
          </div>
          <div className="text-slate-200 text-base leading-9 whitespace-pre-wrap font-jp">
            {renderJlptText(passageText)}
          </div>
        </div>
      )}

      {/* Sub-questions stacked */}
      <div className="space-y-5">
        {siblings.map((sibling: any, idx: number) => {
          const opts = parseOpts(sibling.options);
          const subLabel = (sibling as any).subLabel ?? String(sibling.questionOrder);
          const isCurrentSub = (sibling as any).questionOrder === (question as any).questionOrder;
          const subSelected = answers[sibling.id];
          const questionText = sibling.contentText ?? "";

          return (
            <div
              key={sibling.id}
              id={`sub-q-${sibling.questionOrder}`}
              className={`bg-[#151c2c] border rounded-xl p-5 md:p-6 shadow-xl transition-all
                ${isCurrentSub ? "border-blue-500/60 ring-1 ring-blue-500/30" : "border-slate-700/50"}`}
            >
              <div className="mb-4">
                <span className="text-[#ee2b5b] font-bold text-sm mr-2 font-jp">{subLabel}</span>
                {questionText && (
                  <span className="text-slate-200 font-jp text-base leading-relaxed">
                    {renderJlptText(questionText)}
                  </span>
                )}
              </div>
              <OptionList
                options={opts}
                selected={subSelected}
                onSelect={(opt) => onSelect(sibling.id, opt)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Standard Question View (vocab / grammar / listening) ─────────────────────
const StandardView = ({
  question,
  qNum,
  answers,
  onSelect,
}: {
  question: JlptQuestion;
  qNum: number;
  answers: Record<number, number>;
  onSelect: (questionId: number, opt: number) => void;
}) => {
  const passageText = (question as any).parent?.contentText ?? null;
  const audioUrl =
    (question as any).audioMedia?.url ??
    (question as any).parent?.audioMedia?.url ??
    null;
  const isListening = question.section?.toUpperCase().includes("LISTENING");
  const imageUrl    = (question as any).imageMedia?.url ?? null;
  const mondaiTitle =
    (question as any).mondaiTitle ??
    (question as any).parent?.mondaiTitle ??
    null;

  const opts = parseOpts(question.options);
  const selected = answers[question.id];

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 md:pt-8 px-4">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-bold text-[#ee2b5b] uppercase tracking-wide">
          {question.section} QUESTION
        </h2>
        {mondaiTitle && (
          <p className="text-slate-300 text-sm mt-1 font-jp leading-relaxed">{mondaiTitle}</p>
        )}
      </div>

      {audioUrl && <AudioPlayer url={audioUrl} />}

      {imageUrl && (
        <div className="mb-6">
          <img src={imageUrl} alt={`Câu ${qNum + 1}`} className="max-w-full rounded-xl border border-slate-700" />
        </div>
      )}

      <div className="bg-[#151c2c] border border-slate-700/50 rounded-xl p-6 md:p-8 shadow-2xl">
        {!isListening && (
          <div className="mb-6">
            <span className="text-slate-500 font-bold text-sm mb-3 block">問 {qNum + 1}</span>
            {passageText && (
              <p className="text-slate-200 text-lg md:text-xl font-jp leading-relaxed mb-4 pb-4 border-b border-slate-700">
                {renderJlptText(passageText)}
              </p>
            )}
            {question.contentText && (
              <h3 className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed">
                {renderJlptText(question.contentText)}
              </h3>
            )}
          </div>
        )}

        <OptionList
          options={opts}
          selected={selected}
          onSelect={(opt) => onSelect(question.id, opt)}
          large
        />
      </div>
    </div>
  );
};

// ─── Main ExamContent ─────────────────────────────────────────────────────────
export default function ExamContent({
  currentQ,
  question,
  answers,
  scrollTrigger,
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

  // Use reading group layout ONLY when parent is flagged as a reading passage mondai
  // (isReadingPassage is set in page.tsx based on examStructure.requires_passage)
  // Vocab/grammar questions may also have a parent but isReadingPassage = false → StandardView
  const hasPassageParent = (question as any).parent?.isReadingPassage === true;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B1120] text-slate-200">
      {hasPassageParent ? (
        <ReadingGroupView
          question={question}
          currentQ={currentQ}
          scrollTrigger={scrollTrigger}
          answers={answers}
          onSelect={onSelectOption}
        />
      ) : (
        <StandardView
          question={question}
          qNum={currentQ}
          answers={answers}
          onSelect={onSelectOption}
        />
      )}
      <div className="h-10" />
    </div>
  );
}