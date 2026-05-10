"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ExamHeader from "./ExamHeader";
import ExamSidebar from "./ExamSidebar";
import ExamContent from "./ExamContent";
import AntiCheatOverlay from "./AntiCheatOverlay";
import PaywallPopup from "@/components/common/PaywallPopup";
import { useCountdown } from "@/hooks/useCountdown";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import {
  useGetTestByIdQuery,
  useSubmitTestMutation,
  useReportViolationMutation,
} from "@/store/services/jlptApi";
import type { JlptQuestion, UserAnswer } from "@/types/jlpt";
import {
  JLPT_STRUCTURE,
  rebuildStructureWithCounts,
  type JLPTLevel,
  type SectionConfig,
} from "@/lib/jlpt-structure";
import { getJlptTopupPath } from "@/lib/jlpt-topup";
import {
  getFeatureErrorMessage,
  isFeatureError,
} from "@/lib/subscription-errors";

function parseOptions(opts?: string[] | string | null): string[] {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts;
  try {
    const parsed = JSON.parse(opts);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function JLPTtestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-400"></div>
        </div>
      }
    >
      <JLPTtestPageInner />
    </Suspense>
  );
}

function JLPTtestPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const examStartTimeRef = useRef(0);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const {
    jlptTopupTitle,
    jlptTopupMessage,
    jlptTopupType,
    jlptRecommendedPlan,
  } = useFeatureAccess();

  const {
    data: testData,
    isLoading,
    error,
  } = useGetTestByIdQuery(Number(testId), { skip: !testId });

  const [submitTest] = useSubmitTestMutation();
  const [reportViolation] = useReportViolationMutation();

  const allQuestions = useMemo(
    () => testData?.questions || [],
    [testData?.questions],
  );
  const upgradePath = getJlptTopupPath(jlptTopupType, jlptRecommendedPlan);

  useEffect(() => {
    examStartTimeRef.current = Date.now();
  }, []);

  /* ===== STRUCTURE ===== */
  const examStructure = useMemo<SectionConfig[]>(() => {
    if (!testData?.level) return [];

    // Priority: 1) localStorage overrides, 2) testData.mondaiCounts (from API/DB), 3) hardcoded defaults
    const countMap: Record<number, number> = {};

    // Step 1: Check localStorage overrides (admin-set counts, most recent)
    try {
      const raw = localStorage.getItem(`jlpt_mondai_config_${testId}`);
      if (raw) {
        const overrides = JSON.parse(raw) as Record<string, { count: number }>;
        const countMap: Record<number, number> = {};

        Object.entries(overrides).forEach(([k, v]) => {
          if (v.count > 0) countMap[Number(k)] = v.count;
        });
      }
    } catch {}

    // Step 2: Merge with testData.mondaiCounts from backend (admin-saved via API)
    if (testData.mondaiCounts) {
      Object.entries(testData.mondaiCounts).forEach(([k, v]) => {
        const n = Number(k);
        // Only override if not already set by localStorage
        if (countMap[n] === undefined && v > 0) {
          countMap[n] = v;
        }
      });
    }

    if (Object.keys(countMap).length > 0) {
      return rebuildStructureWithCounts(
        testData.level as JLPTLevel,
        countMap,
      );
    }

    return JLPT_STRUCTURE[testData.level as JLPTLevel] ?? [];
  }, [testData, testId]);

  /* ===== FLATTEN QUESTIONS ===== */
  const leafQuestions = useMemo(() => {
    const flattened: JlptQuestion[] = [];
    const mondaiPassageMap = new Map<number, boolean>();
    examStructure.forEach((section) => {
      section.mondai.forEach((m) => {
        mondaiPassageMap.set(m.number, Boolean(m.requires_passage));
      });
    });

    const sortedQ = [...allQuestions].sort(
      (a, b) => a.questionOrder - b.questionOrder,
    );

    sortedQ.forEach((q) => {
      if (!q.children || q.children.length === 0) {
        const opts = parseOptions(q.options);
        if (opts.length > 0) {
          flattened.push({
            ...q,
            options: opts,
          });
        }
      } else {
        const parentQuestion = {
          ...q,
          isReadingPassage: mondaiPassageMap.get(q.mondaiNumber) === true,
        };
        q.children.forEach((child) => {
          const opts = parseOptions(child.options);
          if (opts.length > 0) {
            flattened.push({
              ...child,
              options: opts,
              parent: parentQuestion,
            });
          }
        });
      }
    });

    return flattened;
  }, [allQuestions, examStructure]);

  const totalQuestions = leafQuestions.length;
  const duration = testData?.duration || 140;

  /* ===== SUBMIT ===== */
  const submitExam = useCallback(async () => {
    if (!testId) return;

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - examStartTimeRef.current) / 1000);

      const userAnswers: UserAnswer[] = Object.entries(answers).map(
        ([id, selected]) => ({
          questionId: Number(id),
          selected,
        }),
      );

      const result = await submitTest({
        testId: Number(testId),
        userAnswers: JSON.stringify(userAnswers),
        timeSpent,
      }).unwrap();

      router.push(`/jlpt/result?attemptId=${result.id}`);
    } catch (e) {
      if (isFeatureError(e)) {
        toast.error(getFeatureErrorMessage(e));
        setShowConfirm(false);
        setShowUpgradePopup(true);
        setIsSubmitting(false);
        return;
      }

      alert("Không thể nộp bài!");
      setIsSubmitting(false);
    }
  }, [answers, submitTest, router, testId]);

  /* ===== AUTO SUBMIT WHEN TIME UP ===== */
  const handleAutoSubmit = useCallback(() => {
    submitExam();
  }, [submitExam]);

  /* ===== TIMER ===== */
  const { timeLeft } = useCountdown({
    duration: duration * 60,
    paused: false,
    onFiveMinutesLeft: () => alert("⚠️ Còn 5 phút!"),
    onTimeUp: handleAutoSubmit,
  });

  /* ===== ANTI CHEAT ===== */
  const MAX_TAB_SWITCHES = 5;
  const isAntiCheatEnabled = true;

  const handleViolation = useCallback(
    (warning: import("@/hooks/useAntiCheat").AntiCheatWarning) => {
      // Gửi báo cáo vi phạm về backend ngay lập tức
      reportViolation({
        // Chuyển đổi type sang định dạng backend hiểu được
        type: warning.type === 'tab_switch' ? 'TAB_SWITCH' : (warning.type === 'devtools' ? 'DEVTOOLS' : 'COPY_PASTE'),
        description: warning.message,
        testId: testId || undefined
      });

      if (
        warning.type === "tab_switch" &&
        warning.count &&
        warning.count >= MAX_TAB_SWITCHES
      ) {
        alert("Bạn đã vi phạm rời trang thi quá 5 lần. Hệ thống tự động nộp bài!");
        submitExam();
      }
    },
    [submitExam, reportViolation, testId]
  );

  const { tabSwitchCount, activeWarning, dismissWarning } =
    useAntiCheat({
      enabled: isAntiCheatEnabled,
      maxTabSwitches: MAX_TAB_SWITCHES,
      detectDevTools: true,
      onViolation: handleViolation,
    });

  /* ===== UI STATES ===== */

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Đang tải đề...
      </div>
    );

  if (error || !testData)
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Không tải được đề
      </div>
    );

  if (isSubmitting)
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Đang nộp bài...
      </div>
    );

  const answeredCount = Object.keys(answers).length;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col text-white bg-[#0B1120]">
      <ExamHeader
        timeLeft={timeLeft}
        formatTime={formatTime}
        testTitle={testData.title}
        answeredCount={answeredCount}
        totalCount={totalQuestions}
        onSubmit={() => setShowConfirm(true)}
      />

      {activeWarning && (
        <AntiCheatOverlay
          warning={activeWarning}
          tabSwitchCount={tabSwitchCount}
          maxTabSwitches={MAX_TAB_SWITCHES}
          onDismiss={dismissWarning}
        />
      )}

      {/* CONFIRM DIALOG */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a2540] p-6 rounded-xl text-center">
            <p>Bạn chắc chắn muốn nộp bài?</p>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowConfirm(false)}>Hủy</button>

              <button
                onClick={submitExam}
                className="bg-red-500 px-4 py-2 rounded"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <ExamContent
          currentQ={currentQuestion}
          question={leafQuestions[currentQuestion]}
          answers={answers}
          scrollTrigger={scrollTrigger}
          onSelectOption={(id, opt) =>
            setAnswers((prev) => ({ ...prev, [id]: opt }))
          }
        />

        <ExamSidebar
          structure={examStructure}
          currentQ={leafQuestions[currentQuestion]?.questionOrder ?? 0}
          answers={answers}
          questions={allQuestions}
          onSelect={(order) => {
            const idx = leafQuestions.findIndex(
              (q) => q.questionOrder === order,
            );
            if (idx !== -1) {
              setCurrentQuestion(idx);
              setScrollTrigger((t) => t + 1);
            }
          }}
        />
      </main>

      <PaywallPopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        title={jlptTopupTitle || "Ban da dung het luot thi JLPT"}
        description={
          jlptTopupMessage ||
          "Hay nang cap goi hoac mua them luot de tiep tuc lam bai."
        }
        requiredTier={jlptRecommendedPlan === "PREMIUM" ? "PREMIUM" : "PRO"}
        actionLabel={
          jlptRecommendedPlan ? `Nang cap ${jlptRecommendedPlan}` : undefined
        }
        upgradePath={upgradePath}
      />
    </div>
  );
}
