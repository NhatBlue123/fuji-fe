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
  <div style={{
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(245, 240, 232, 0.05)",
    borderRadius: "4px",
    padding: "1.25rem",
    marginBottom: "1.5rem"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
      <div style={{
        width: "2.25rem",
        height: "2.25rem",
        borderRadius: "4px",
        backgroundColor: "rgba(165, 42, 42, 0.1)",
        border: "1px solid rgba(165, 42, 42, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <span className="material-symbols-outlined" style={{ color: "rgba(165, 42, 42, 0.8)", fontSize: "0.875rem" }}>
          volume_up
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{
          fontSize: "0.75rem",
          fontFamily: "'Noto Sans JP', sans-serif",
          color: "rgba(245, 240, 232, 0.6)",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          音声
        </span>
        <span style={{
          fontSize: "0.625rem",
          color: "rgba(245, 240, 232, 0.4)",
          fontFamily: "'Noto Sans JP', sans-serif"
        }}>
          Chọn đáp án phù hợp với nội dung nghe
        </span>
      </div>
    </div>
    <audio
      controls
      style={{ width: "100%", height: "3rem", colorScheme: "dark" }}
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
          className="cursor-pointer group transition-all duration-200"
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "6px",
            border: isSelected ? "1px solid #A52A2A" : "1px solid rgba(245, 240, 232, 0.1)",
            backgroundColor: isSelected ? "rgba(165, 42, 42, 0.15)" : "rgba(30, 41, 59, 0.3)",
            position: "relative",
            overflow: "hidden",
            transform: "translateX(0)",
            boxShadow: isSelected ? "0 0 0 1px rgba(165, 42, 42, 0.3), 0 4px 12px rgba(165, 42, 42, 0.2)" : "none",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.borderColor = "rgba(165, 42, 42, 0.4)";
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)";
              e.currentTarget.style.transform = "translateX(4px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.borderColor = "rgba(245, 240, 232, 0.1)";
              e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.3)";
              e.currentTarget.style.transform = "translateX(0)";
            }
          }}
        >
          <div 
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "3px",
              background: isSelected ? "#A52A2A" : "transparent",
              transition: "background 0.25s ease"
            }}
          />
          <div className="flex items-center gap-4">
            <div
              style={{
                width: large ? "2.5rem" : "2.25rem",
                height: large ? "2.5rem" : "2.25rem",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: large ? "1rem" : "0.875rem",
                backgroundColor: isSelected ? "#A52A2A" : "rgba(245, 240, 232, 0.08)",
                border: isSelected ? "1px solid rgba(165, 42, 42, 0.8)" : "1px solid rgba(245, 240, 232, 0.15)",
                color: isSelected ? "#F5F0E8" : "rgba(245, 240, 232, 0.8)",
                boxShadow: isSelected ? "0 2px 8px rgba(165, 42, 42, 0.4)" : "none",
                transition: "all 0.25s ease",
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
            <span
              className="font-mincho"
              style={{
                fontSize: large ? "1.125rem" : "1rem",
                lineHeight: 1.8,
                color: isSelected ? "#C07A7A" : "rgba(245, 240, 232, 0.8)",
              }}
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
    <div style={{ marginBottom: "1.5rem" }}>
      <span style={{
        fontSize: "0.625rem",
        fontFamily: "'Noto Sans JP', sans-serif",
        color: "rgba(165, 42, 42, 0.7)",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        marginBottom: "0.25rem",
        display: "block"
      }}>
        {label.ja}
      </span>
      <h2 style={{
        fontSize: "0.875rem",
        fontFamily: "'Noto Sans JP', sans-serif",
        color: "rgba(245, 240, 232, 0.5)",
        letterSpacing: "0.025em"
      }}>
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
  <div style={{ marginBottom: "2rem", marginTop: "0.5rem" }}>
    <div style={{
      height: "1px",
      marginBottom: "1.5rem",
      background: "linear-gradient(90deg, transparent 0%, rgba(245, 240, 232, 0.15) 20%, rgba(245, 240, 232, 0.25) 50%, rgba(245, 240, 232, 0.15) 80%, transparent 100%)"
    }} />
    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.375rem 0.875rem",
        background: "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)",
        borderRadius: "4px",
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: "#F5F0E8",
        boxShadow: "0 2px 8px rgba(165, 42, 42, 0.3)"
      }}>
        問題{mondaiNumber}
      </div>
      {mondaiTitle && (
        <span style={{
          fontSize: "1.125rem",
          fontFamily: "'Noto Serif JP', serif",
          color: "rgba(245, 240, 232, 0.8)",
          paddingTop: "0.125rem",
          lineHeight: 1.8
        }}>
          {mondaiTitle}
        </span>
      )}
    </div>
    {instruction && (
      <div style={{
        backgroundColor: "rgba(30, 41, 59, 0.3)",
        border: "1px solid rgba(245, 240, 232, 0.05)",
        borderRadius: "4px",
        padding: "1rem"
      }}>
        <p style={{
          fontFamily: "'Noto Serif JP', serif",
          color: "rgba(245, 240, 232, 0.7)",
          fontSize: "0.875rem",
          marginBottom: "0.25rem",
          lineHeight: 1.8
        }}>
          {instruction}
        </p>
        {instructionVi && (
          <p style={{
            fontSize: "0.75rem",
            color: "rgba(245, 240, 232, 0.4)",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontStyle: "italic"
          }}>
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
    <div style={{ maxWidth: "64rem", margin: "0 auto", width: "100%", paddingTop: "1.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingBottom: "2.5rem" }}>
      <SectionLabel section={question.section || "Reading"} />

      <MondaiHeader
        mondaiNumber={mondaiNumber || 11}
        mondaiTitle={mondaiTitle}
        instruction={instructions[mondaiNumber]?.ja || instruction}
        instructionVi={instructions[mondaiNumber]?.vi}
      />

      {/* Passage Box - Washi Paper Effect */}
      {passageText && (
        <div style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(30, 41, 59, 0.3) 100%)",
          border: "1px solid rgba(245, 240, 232, 0.1)",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2.5rem",
          position: "relative"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span className="material-symbols-outlined" style={{ color: "rgba(165, 42, 42, 0.6)", fontSize: "0.875rem" }}>
              article
            </span>
            <span style={{
              fontSize: "0.625rem",
              fontFamily: "'Noto Sans JP', sans-serif",
              color: "rgba(245, 240, 232, 0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              読解文
            </span>
          </div>
          <div style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: "1rem",
            lineHeight: 2,
            letterSpacing: "0.05em",
            color: "rgba(245, 240, 232, 0.9)"
          }}>
            {renderJlptText(passageText)}
          </div>
        </div>
      )}

      {/* Sub-questions with Ma spacing */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
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
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.4)",
                border: isCurrentSub ? "1px solid rgba(165, 42, 42, 0.3)" : "1px solid rgba(245, 240, 232, 0.05)",
                borderRadius: "4px",
                padding: "1.5rem",
                transition: "all 0.2s",
                boxShadow: isCurrentSub ? "0 0 0 1px rgba(165, 42, 42, 0.1)" : "none"
              }}
            >
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.375rem 0.875rem",
                    background: "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)",
                    borderRadius: "4px",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#F5F0E8",
                    boxShadow: "0 2px 8px rgba(165, 42, 42, 0.3)"
                  }}>
                    問 {subLabel}
                  </div>
                </div>
                {questionText && (
                  <p style={{
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: "1.0625rem",
                    lineHeight: 1.8,
                    color: "rgba(245, 240, 232, 0.9)"
                  }}>
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
      <div style={{ maxWidth: "72rem", margin: "0 auto", width: "100%", paddingTop: "1.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingBottom: "2.5rem" }}>
        <SectionLabel section={question.section || "Listening"} />

        <MondaiHeader
          mondaiNumber={mondaiNumber || 1}
          mondaiTitle={mondaiTitle}
          instruction={instruction?.ja}
          instructionVi={instruction?.vi}
        />

        {/* Side-by-side layout for listening */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
          {/* Left column - Image */}
          <div style={{ position: "sticky", top: "1rem", alignSelf: "start" }}>
            <div style={{
              backgroundColor: "rgba(30, 41, 59, 0.4)",
              border: "1px solid rgba(245, 240, 232, 0.05)",
              borderRadius: "4px",
              padding: "1rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span className="material-symbols-outlined" style={{ color: "rgba(165, 42, 42, 0.6)", fontSize: "0.875rem" }}>
                  image
                </span>
                <span style={{
                  fontSize: "0.625rem",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  color: "rgba(245, 240, 232, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  問題画像
                </span>
              </div>
              <img
                src={imageUrl}
                alt={`Câu hỏi ${qNum + 1}`}
                style={{ width: "100%", borderRadius: "4px", border: "1px solid rgba(245, 240, 232, 0.05)" }}
              />
            </div>
          </div>

          {/* Right column - Audio & Options */}
          <div>
            {audioUrl && <AudioPlayer url={audioUrl} level={question.section} />}

            <div style={{
              backgroundColor: "rgba(30, 41, 59, 0.4)",
              border: "1px solid rgba(245, 240, 232, 0.05)",
              borderRadius: "4px",
              padding: "1.5rem"
            }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.375rem 0.875rem",
                  background: "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)",
                  borderRadius: "4px",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#F5F0E8",
                  boxShadow: "0 2px 8px rgba(165, 42, 42, 0.3)"
                }}>
                  問 {(question as any).subLabel ?? (qNum + 1)}
                </div>
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
    <div style={{ maxWidth: "56rem", margin: "0 auto", width: "100%", paddingTop: "1.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingBottom: "2.5rem" }}>
      <SectionLabel section={question.section || "Language Knowledge"} />

      <MondaiHeader
        mondaiNumber={mondaiNumber || (qNum + 1)}
        mondaiTitle={mondaiTitle}
        instruction={instruction?.ja}
        instructionVi={instruction?.vi}
      />

      {audioUrl && <AudioPlayer url={audioUrl} />}

      {/* Question Card with Ma spacing */}
      <div style={{
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(30, 41, 59, 0.3) 100%)",
        border: "1px solid rgba(245, 240, 232, 0.1)",
        borderRadius: "8px",
        padding: "2rem",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
      }}>
        {!isListening && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.375rem 0.875rem",
                background: "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)",
                borderRadius: "4px",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#F5F0E8",
                boxShadow: "0 2px 8px rgba(165, 42, 42, 0.3)"
              }}>
                問 {(question as any).subLabel ?? (qNum + 1)}
              </div>
            </div>
            {question.contentText && (
              <h3 style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "1.0625rem",
                lineHeight: 1.8,
                color: "rgba(245, 240, 232, 0.9)"
              }}>
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
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0B1120" }}>
        <div style={{ textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "3.75rem", marginBottom: "1rem", color: "rgba(245, 240, 232, 0.2)" }}>
            quiz
          </span>
          <p style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "rgba(245, 240, 232, 0.5)" }}>問題がありません</p>
        </div>
      </div>
    );
  }

  const hasPassageParent = (question as any).parent?.isReadingPassage === true;

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#0B1120" }} className="custom-scrollbar">
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
      <div style={{ height: "3rem" }} />
    </div>
  );
}
