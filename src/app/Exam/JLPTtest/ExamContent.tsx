"use client";
import { useEffect, useState } from "react";
import type { JlptQuestion } from "@/types/jlpt";
import { renderJlptText } from "@/lib/renderJlptText";

interface ContentProps {
  currentQ: number;
  question?: JlptQuestion;
  answers: Record<number, number>;
  scrollTrigger?: number;
  onSelectOption: (questionId: number, opt: number) => void;
}

// Section labels mapping for JLPT structure
const SECTION_LABELS: Record<string, { ja: string; vi: string }> = {
  "Language Knowledge (Characters/Vocabulary)": { ja: "言語知識（文字・語彙）", vi: "Kiến thức ngôn ngữ (Chữ/Kanji-Từ vựng)" },
  "Language Knowledge (Grammar)": { ja: "言語知識（文法）", vi: "Kiến thức ngôn ngữ (Ngữ pháp)" },
  "Reading": { ja: "読解", vi: "Đọc hiểu" },
  "Listening": { ja: "聴解", vi: "Nghe hiểu" },
  "LANGUAGE_KNOWLEDGE_CHARTS": { ja: "言語知識（文字・語彙）", vi: "Kiến thức ngôn ngữ (Chữ/Kanji-Từ vựng)" },
  "LANGUAGE_KNOWLEDGE_GRAMMAR": { ja: "言語知識（文法）", vi: "Kiến thức ngôn ngữ (Ngữ pháp)" },
  "READING": { ja: "読解", vi: "Đọc hiểu" },
  "LISTENING": { ja: "聴解", vi: "Nghe hiểu" },
};

const getSectionLabel = (section: string): { ja: string; vi: string } => {
  return SECTION_LABELS[section] || { ja: section, vi: section };
};

// Audio Player with Japanese Minimalism styling
const AudioPlayer = ({ url, level }: { url: string; level?: string }) => (
  <div className="bg-charcoal/50 border border-washi-paper/5 rounded-sm p-5 mb-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="size-9 rounded-sm bg-shun-nuri/10 border border-shun-nuri/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-shun-nuri/80 text-sm">
          volume_up
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-jp text-washi-paper/60 uppercase tracking-wider">
          音声
        </span>
        <span className="text-[10px] text-washi-paper/40 font-jp">
          Chọn đáp án phù hợp với nội dung nghe
        </span>
      </div>
    </div>
    <audio
      controls
      className="w-full h-12"
      style={{ colorScheme: "dark" }}
    >
      <source src={url} type="audio/mpeg" />
      <source src={url} type="audio/mp4" />
      Trình duyệt không hỗ trợ audio.
    </audio>
  </div>
);

// Options list with Ma breathing space
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
  <div className="flex flex-col gap-3">
    {options.map((opt, index) => {
      const isSelected = selected === index + 1;
      return (
        <div
          key={index}
          onClick={() => onSelect(index + 1)}
          className={`jlpt-option cursor-pointer group ${isSelected ? "selected" : ""}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`option-number size-9 rounded-sm flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                large ? "size-10 text-base" : ""
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`font-mincho text-base ${
                large ? "text-lg" : "text-base"
              } ${isSelected ? "text-shun-nuri" : "text-washi-paper/80"}`}
              style={{ lineHeight: 1.8 }}
            >
              {opt}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

const parseOpts = (opts: any): string[] => {
  if (Array.isArray(opts)) return opts;
  try {
    const p = JSON.parse(opts);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

// Section Label Component
const SectionLabel = ({ section }: { section: string }) => {
  const label = getSectionLabel(section);
  return (
    <div className="mb-6">
      <span className="text-[10px] font-jp text-shun-nuri/70 uppercase tracking-[0.2em] mb-1 block">
        {label.ja}
      </span>
      <h2 className="text-sm font-jp text-washi-paper/50 tracking-wide">
        {label.vi}
      </h2>
    </div>
  );
};

// Mondai Header Component
const MondaiHeader = ({
  mondaiNumber,
  mondaiTitle,
  instruction,
  instructionVi,
}: {
  mondaiNumber: number;
  mondaiTitle?: string | null;
  instruction?: string;
  instructionVi?: string;
}) => (
  <div className="mb-8 mt-2">
    <div className="divider-ma mb-6" />
    <div className="flex items-start gap-4 mb-4">
      <div className="question-id-badge">
        問題{mondaiNumber}
      </div>
      {mondaiTitle && (
        <span className="text-lg font-mincho text-washi-paper/80 pt-0.5" style={{ lineHeight: 1.8 }}>
          {mondaiTitle}
        </span>
      )}
    </div>
    {instruction && (
      <div className="bg-charcoal/30 border border-washi-paper/5 rounded-sm p-4">
        <p className="font-mincho text-washi-paper/70 text-sm mb-1" style={{ lineHeight: 1.8 }}>
          {instruction}
        </p>
        {instructionVi && (
          <p className="text-[12px] text-washi-paper/40 font-jp italic">
            {instructionVi}
          </p>
        )}
      </div>
    )}
  </div>
);

// Reading Group View with proper Ma spacing
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

  useEffect(() => {
    if (!scrollTrigger) return;
    const target = document.getElementById(`sub-q-${(question as any).questionOrder}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTrigger]);

  const passageText = parent?.contentText ?? (question as any).contentText ?? "";
  const mondaiTitle = (question as any).mondaiTitle ?? parent?.mondaiTitle ?? null;
  const mondaiNumber = (question as any).mondaiNumber ?? parent?.mondaiNumber ?? null;
  const instruction = (question as any).instruction ?? parent?.instruction ?? null;

  const siblings: JlptQuestion[] = parent?.children
    ? [...parent.children].sort((a: any, b: any) => a.questionOrder - b.questionOrder)
    : [question];

  const instructions: Record<number, { ja: string; vi: string }> = {
    11: {
      ja: "________の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。",
      vi: "Chọn cách đọc của từ được gạch chân trong 4 đáp án 1, 2, 3, 4.",
    },
    12: {
      ja: "________に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
      vi: "Chọn từ/cụm từ phù hợp nhất để điền vào chỗ trống trong 4 đáp án.",
    },
    13: {
      ja: "次の文章を読んで、文章の内容と一致するものを選んでください。",
      vi: "Đọc đoạn văn sau và chọn ý đúng nhất trong 4 đáp án.",
    },
  };

  return (
    <div className="max-w-5xl mx-auto w-full pt-6 md:pt-10 px-6 pb-10">
      <SectionLabel section={question.section || "Reading"} />

      <MondaiHeader
        mondaiNumber={mondaiNumber || 11}
        mondaiTitle={mondaiTitle}
        instruction={instructions[mondaiNumber]?.ja || instruction}
        instructionVi={instructions[mondaiNumber]?.vi}
      />

      {/* Passage Box - Washi Paper Effect */}
      {passageText && (
        <div className="passage-box mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-shun-nuri/60 text-sm">
              article
            </span>
            <span className="text-[10px] font-jp text-washi-paper/40 uppercase tracking-wider">
              読解文
            </span>
          </div>
          <div
            className="text-jp-content text-washi-paper/90"
            style={{ lineHeight: 2, letterSpacing: "0.05em" }}
          >
            {renderJlptText(passageText)}
          </div>
        </div>
      )}

      {/* Sub-questions with Ma spacing */}
      <div className="space-y-8">
        {siblings.map((sibling: any, idx: number) => {
          const opts = parseOpts(sibling.options);
          const subLabel = sibling.subLabel ?? String(sibling.questionOrder);
          const isCurrentSub = sibling.questionOrder === question.questionOrder;
          const subSelected = answers[sibling.id];
          const questionText = sibling.contentText ?? "";

          return (
            <div
              key={sibling.id}
              id={`sub-q-${sibling.questionOrder}`}
              className={`bg-charcoal/40 border rounded-sm p-6 transition-all ${
                isCurrentSub
                  ? "border-shun-nuri/30 ring-1 ring-shun-nuri/10"
                  : "border-washi-paper/5"
              }`}
            >
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="question-id-badge" style={{ fontSize: "0.75rem" }}>
                    問 {subLabel}
                  </span>
                </div>
                {questionText && (
                  <p
                    className="text-jlpt-question text-washi-paper/90"
                    style={{ lineHeight: 1.8 }}
                  >
                    {renderJlptText(questionText)}
                  </p>
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

// Standard Question View with Japanese Minimalism
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
  const isListening = question.section?.toUpperCase().includes("LISTENING") ||
    question.section?.toLowerCase().includes("聴解");
  const imageUrl = (question as any).imageMedia?.url ?? null;
  const mondaiTitle =
    (question as any).mondaiTitle ??
    (question as any).parent?.mondaiTitle ??
    null;
  const mondaiNumber = (question as any).mondaiNumber ?? null;

  const opts = parseOpts(question.options);
  const selected = answers[question.id];

  // Instruction for standard questions
  const getInstruction = () => {
    if (isListening) {
      return {
        ja: "会話を聞いて、後の問いに対する最も適切な答えを1・2・3・4から一つ選びなさい。",
        vi: "Nghe đoạn hội thoại và chọn câu trả lời đúng nhất trong 4 đáp án.",
      };
    }
    if (mondaiNumber === 1) {
      return {
        ja: "________の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。",
        vi: "Chọn cách đọc đúng của từ được gạch chân trong 4 đáp án 1, 2, 3, 4.",
      };
    }
    return null;
  };

  const instruction = getInstruction();

  // Listening section with side-by-side layout
  if (isListening && imageUrl) {
    return (
      <div className="max-w-6xl mx-auto w-full pt-6 md:pt-10 px-6 pb-10">
        <SectionLabel section={question.section || "Listening"} />

        <MondaiHeader
          mondaiNumber={mondaiNumber || 1}
          mondaiTitle={mondaiTitle}
          instruction={instruction?.ja}
          instructionVi={instruction?.vi}
        />

        {/* Side-by-side layout for listening */}
        <div className="listening-container">
          {/* Left column - Image (40%) */}
          <div className="image-sticky">
            <div className="bg-charcoal/40 border border-washi-paper/5 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-shun-nuri/60 text-sm">
                  image
                </span>
                <span className="text-[10px] font-jp text-washi-paper/40 uppercase tracking-wider">
                  問題画像
                </span>
              </div>
              <img
                src={imageUrl}
                alt={`Câu hỏi ${qNum + 1}`}
                className="w-full rounded-sm border border-washi-paper/5"
              />
            </div>
          </div>

          {/* Right column - Audio & Options (60%) */}
          <div>
            {audioUrl && <AudioPlayer url={audioUrl} level={question.section} />}

            <div className="bg-charcoal/40 border border-washi-paper/5 rounded-sm p-6">
              <div className="mb-5">
                <span className="question-id-badge" style={{ fontSize: "0.875rem" }}>
                  問 {(question as any).subLabel ?? (qNum + 1)}
                </span>
              </div>
              <OptionList
                options={opts}
                selected={selected}
                onSelect={(opt) => onSelect(question.id, opt)}
                large
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pt-6 md:pt-10 px-6 pb-10">
      <SectionLabel section={question.section || "Language Knowledge"} />

      <MondaiHeader
        mondaiNumber={mondaiNumber || (qNum + 1)}
        mondaiTitle={mondaiTitle}
        instruction={instruction?.ja}
        instructionVi={instruction?.vi}
      />

      {audioUrl && <AudioPlayer url={audioUrl} />}

      {/* Question Card with Ma spacing */}
      <div className="bg-charcoal/40 border border-washi-paper/5 rounded-sm p-8 shadow-ma">
        {!isListening && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="question-id-badge" style={{ fontSize: "0.875rem" }}>
                問 {(question as any).subLabel ?? (qNum + 1)}
              </span>
            </div>
            {question.contentText && (
              <h3
                className="text-jlpt-question text-washi-paper/90"
                style={{ lineHeight: 1.8 }}
              >
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

// Main ExamContent Component
export default function ExamContent({
  currentQ,
  question,
  answers,
  scrollTrigger,
  onSelectOption,
}: ContentProps) {
  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center bg-exam-dark text-washi-paper/40">
        <div className="text-center animate-fade-in">
          <span className="material-symbols-outlined text-6xl mb-4 text-washi-paper/20">
            quiz
          </span>
          <p className="font-jp text-washi-paper/50">問題がありません</p>
        </div>
      </div>
    );
  }

  const hasPassageParent = (question as any).parent?.isReadingPassage === true;

  return (
    <div className="flex-1 overflow-y-auto bg-exam-dark text-washi-paper/80 custom-scrollbar">
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
      <div className="h-12" />
    </div>
  );
}
