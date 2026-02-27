"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExamHeader from "./ExamHeader";
import ExamSidebar from "./ExamSidebar";
import ExamContent from "./ExamContent";
import AntiCheatOverlay from "./AntiCheatOverlay";
import { useCountdown } from "@/hooks/useCountdown";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useGetTestByIdQuery, useSubmitTestMutation } from "@/store/services/jlptApi";
import type { UserAnswer, JlptQuestion } from "@/types/jlpt";
import {
  JLPT_STRUCTURE,
  rebuildStructureWithCounts,
  getQuestionNumbers,
  type JLPTLevel,
  type SectionConfig,
} from "@/lib/jlpt-structure";

/** Normalize options: backend may store as string[] OR as JSON-encoded string */
function parseOptions(opts?: string[] | string | null): string[] {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts;
  try {
    const parsed = JSON.parse(opts as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


export default function JLPTtestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [examStartTime] = useState<number>(Date.now());
  // Increments only when user explicitly clicks a sidebar number → triggers scroll in grouped view
  const [scrollTrigger, setScrollTrigger] = useState(0);

  // Fetch test data
  const { data: testData, isLoading, error } = useGetTestByIdQuery(
    Number(testId),
    { skip: !testId }
  );

  const [submitTest] = useSubmitTestMutation();

  // Flatten tree: collect only answerable leaf questions
  const allQuestions = testData?.questions || [];

  // ── Build structure first so we know which mondai are reading passages ──
  const examStructure = useMemo<SectionConfig[]>(() => {
    if (!testData?.level) return [];
    try {
      const raw = localStorage.getItem(`jlpt_mondai_config_${testId}`);
      if (raw) {
        const overrides = JSON.parse(raw) as Record<string, { count: number; instruction: string }>;
        const countMap: Record<number, number> = {};
        Object.entries(overrides).forEach(([k, v]) => { if (v.count > 0) countMap[Number(k)] = v.count; });
        if (Object.keys(countMap).length > 0)
          return rebuildStructureWithCounts(testData.level as JLPTLevel, countMap);
      }
    } catch { /* ignore */ }
    return JLPT_STRUCTURE[testData.level as JLPTLevel] ?? [];
  }, [testData?.level, testId]);

  // Map of reading mondai numbers to their start question order
  const readingMondaiData = useMemo(() => {
    const map = new Map<number, { start: number }>();
    examStructure.forEach((s) => s.mondai.forEach((m) => {
      if (m.requires_passage) map.set(m.number, { start: m.start });
    }));
    return map;
  }, [examStructure]);
  const isReadingMondai = (mondaiNum: number) => readingMondaiData.has(mondaiNum);

  const examSubLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    if (!examStructure) return labels;

    let currentLabelNumber = 1;

    examStructure.forEach((section) => {
      section.mondai.forEach((mondai) => {
        const nums = [];
        for (let i = mondai.start; i <= mondai.end; i++) {
          nums.push(i);
        }

        if (mondai.requires_passage) {
          nums.forEach((qNum, idx) => {
            labels[qNum] = `${currentLabelNumber}.${idx + 1}`;
          });
          currentLabelNumber++;
        } else {
          nums.forEach((qNum) => {
            labels[qNum] = String(currentLabelNumber);
            currentLabelNumber++;
          });
        }
      });
    });

    return labels;
  }, [examStructure]);

  const leafQuestions = useMemo(() => {
    const flattened: any[] = [];
    const sortedQ = [...allQuestions].sort((a, b) => a.questionOrder - b.questionOrder);
    
    sortedQ.forEach(q => {
      if (!q.children || q.children.length === 0) {
        if (q.parentId == null) {
          const opts = parseOptions(q.options);
          if (opts.length > 0) {
            flattened.push({
              ...q,
              options: opts,
              subLabel: examSubLabels[q.questionOrder] || String(q.questionOrder),
            });
          }
        }
      } else {
        const isReadingPassage = readingMondaiData.has(q.mondaiNumber);
        const sortedChildren = [...q.children].sort((a, b) => a.questionOrder - b.questionOrder);
        
        sortedChildren.forEach(child => {
          const opts = parseOptions(child.options);
          flattened.push({
            ...child,
            options: opts,
            subLabel: examSubLabels[child.questionOrder] || String(child.questionOrder),
            parent: {
              ...q,
              isReadingPassage,
              passageGroupBase: isReadingPassage 
                ? parseInt(examSubLabels[child.questionOrder]?.split('.')[0] || "0") 
                : null,
            }
          });
        });
      }
    });

    return flattened;
  }, [allQuestions, examSubLabels, readingMondaiData]);


  const totalQuestions = leafQuestions.length;
  const duration = testData?.duration || 140; // minutes

  // ===== CONFIRM + SUBMIT =====
  const handleRequestSubmit = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!testId) return;
    setShowConfirm(false);
    console.log("⏱ Submitting test...");
    setIsSubmitting(true);

    try {
      const timeSpentSeconds = Math.floor((Date.now() - examStartTime) / 1000);

      const userAnswers: UserAnswer[] = Object.entries(answers).map(
        ([questionId, selected]) => ({
          questionId: Number(questionId),
          selected,
        })
      );

      const userAnswersJson = JSON.stringify(userAnswers);

      const result = await submitTest({
        testId: Number(testId),
        userAnswers: userAnswersJson,
        timeSpent: timeSpentSeconds,
      }).unwrap();

      console.log("✅ Test submitted successfully:", result);
      router.push(`/jlpt/result?attemptId=${result.id}`);
    } catch (error) {
      console.error("❌ Failed to submit test:", error);
      alert("Không thể nộp bài. Vui lòng thử lại!");
      setIsSubmitting(false);
    }
  }, [testId, answers, submitTest, router, examStartTime]);

  // ===== ANTI-CHEAT =====
  const MAX_TAB_SWITCHES = 5;
  const { tabSwitchCount, devToolsOpen, activeWarning, dismissWarning } = useAntiCheat({
    maxTabSwitches: MAX_TAB_SWITCHES,
    detectDevTools: true,
  });

  // ===== TIMER (paused when devtools open) =====
  const { timeLeft } = useCountdown({
    duration: duration * 60,
    paused: devToolsOpen,
    onFiveMinutesLeft: () => {
      alert("⚠️ Còn 5 phút cuối!");
    },
    onTimeUp: handleSubmit,
  });

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400 mb-4"></div>
          <p className="text-lg">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !testData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4">
            error
          </span>
          <p className="text-lg font-semibold">Không thể tải đề thi</p>
          <p className="text-sm text-slate-400 mt-2">
            Vui lòng kiểm tra lại hoặc chọn đề thi khác
          </p>
          <button
            onClick={() => router.push("/JLPT_Practice")}
            className="mt-6 px-6 py-3 bg-pink-400 rounded-lg font-semibold hover:bg-pink-500 transition"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // Submitting state
  if (isSubmitting) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400 mb-4"></div>
          <p className="text-lg">Đang nộp bài...</p>
        </div>
      </div>
    );
  }

  // Answered count
  const answeredCount = Object.keys(answers).length;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden font-sans text-white"
      style={{ backgroundColor: "#0B1120" }}
    >
      <ExamHeader
        timeLeft={timeLeft}
        formatTime={formatTime}
        testTitle={testData.title}
        answeredCount={answeredCount}
        totalCount={totalQuestions}
        onSubmit={handleRequestSubmit}
      />

      {/* ── Anti-Cheat Overlay ──────────────────────────────────────── */}
      {activeWarning && (
        <AntiCheatOverlay
          warning={activeWarning}
          tabSwitchCount={tabSwitchCount}
          maxTabSwitches={MAX_TAB_SWITCHES}
          onDismiss={dismissWarning}
        />
      )}

      {/* ── Confirmation Dialog ─────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a2540] border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <span className="material-symbols-outlined text-5xl text-[#ee2b5b] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_turned_in</span>
            <h2 className="text-xl font-bold text-white mb-2">Xác nhận nộp bài</h2>
            {answeredCount < totalQuestions ? (
              <p className="text-slate-300 text-sm mb-6">
                Bạn đã làm{" "}
                <span className="text-yellow-400 font-bold">{answeredCount}/{totalQuestions}</span>{" "}
                câu. Còn{" "}
                <span className="text-red-400 font-bold">{totalQuestions - answeredCount}</span>{" "}
                câu chưa tắt.<br />
                Bạn có chắc chắn muốn nộp bài không?
              </p>
            ) : (
              <p className="text-slate-300 text-sm mb-6">
                Bạn đã hoàn thành tất cả <span className="text-green-400 font-bold">{totalQuestions}</span> câu.<br />
                Bạn có chắc chắn muốn nộp bài không?
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition font-medium"
              >
                Tiếp tục làm
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-5 py-2.5 rounded-lg bg-[#ee2b5b] text-white font-bold hover:bg-[#d41f4e] transition"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <ExamContent
              currentQ={currentQuestion}
              question={leafQuestions[currentQuestion]}
              answers={answers}
              scrollTrigger={scrollTrigger}
              onSelectOption={(questionId, opt) =>
                setAnswers((prev) => ({ ...prev, [questionId]: opt }))
              }
            />
          </div>

          {/* FOOTER */}
          <div
            className="h-20 shrink-0 px-6 md:px-10 flex items-center justify-between z-20"
            style={{
              backgroundColor: "#161e31",
              borderTop: "1px solid #334155",
            }}
          >
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2.5 rounded-lg disabled:opacity-50 hover:bg-slate-700"
            >
              ← Câu trước
            </button>

            {currentQuestion === totalQuestions - 1 ? (
              <button
                onClick={handleRequestSubmit}
                className="px-6 py-2.5 rounded-lg font-bold bg-green-500 text-white hover:bg-green-600"
              >
                Nộp bài ✓
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestion((q) => Math.min(totalQuestions - 1, q + 1))
                }
                className="px-6 py-2.5 rounded-lg font-bold bg-white text-slate-900"
              >
                Câu tiếp theo →
              </button>
            )}
          </div>
        </div>

        <ExamSidebar
          structure={examStructure}
          currentQ={leafQuestions[currentQuestion]?.questionOrder ?? 0}
          answers={answers}
          questions={allQuestions}
          onSelect={(questionOrder) => {
            const idx = leafQuestions.findIndex(q => q.questionOrder === questionOrder);
            if (idx !== -1) {
              setCurrentQuestion(idx);
              setScrollTrigger((t) => t + 1); // signal: scroll to the target sub-question
            }
          }}
        />
      </main>
    </div>
  );
}
