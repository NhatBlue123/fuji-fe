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
    const childModeMap: Record<number, boolean> = {};

    // Step 1: Check localStorage overrides (admin-set counts, most recent)
    try {
      const raw = localStorage.getItem(`jlpt_mondai_config_${testId}`);
      if (raw) {
        const overrides = JSON.parse(raw) as Record<string, { count: number }>;

        Object.entries(overrides).forEach(([k, v]) => {
          if (v.count > 0) countMap[Number(k)] = v.count;
          if ("childMode" in v) childModeMap[Number(k)] = Boolean((v as { childMode?: boolean }).childMode);
        });
      }
    } catch {}

    // Step 2: Merge with testData.mondaiCounts from backend (admin-saved via API)
    const backendCounts = (testData as unknown as { mondaiCounts?: Record<string, number> })?.mondaiCounts;
    if (backendCounts) {
      Object.entries(backendCounts).forEach(([k, v]) => {
        const n = Number(k);
        // Only override if not already set by localStorage
        if (countMap[n] === undefined && typeof v === 'number' && v > 0) {
          countMap[n] = v;
        }
      });
    }
    const backendChildModes = (testData as unknown as { mondaiChildModes?: Record<string, boolean> })?.mondaiChildModes;
    if (backendChildModes) {
      Object.entries(backendChildModes).forEach(([k, v]) => {
        const n = Number(k);
        if (childModeMap[n] === undefined) {
          childModeMap[n] = Boolean(v);
        }
      });
    }
    testData.questions?.forEach((q) => {
      if (q.section === "READING" && q.children && q.children.length > 0) {
        childModeMap[q.mondaiNumber] = true;
      }
    });

    if (Object.keys(countMap).length > 0 || Object.keys(childModeMap).length > 0) {
      return rebuildStructureWithCounts(
        testData.level as JLPTLevel,
        countMap,
        undefined,
        childModeMap,
      );
    }

    return JLPT_STRUCTURE[testData.level as JLPTLevel] ?? [];
  }, [testData, testId]);

  /* ===== FLATTEN QUESTIONS ===== */
  const leafQuestions = useMemo(() => {
    const flattened: JlptQuestion[] = [];
    const seenOrders = new Set<number>();
    const mondaiPassageMap = new Map<number, boolean>();
    const mondaiConfigMap = new Map<number, { start: number; displayStart: number }>();
    examStructure.forEach((section) => {
      section.mondai.forEach((m) => {
        mondaiPassageMap.set(m.number, Boolean(m.requires_passage));
        mondaiConfigMap.set(m.number, {
          start: m.start,
          displayStart: m._displayStart ?? m.start,
        });
      });
    });

    const sortedQ = [...allQuestions].sort(
      (a, b) => a.questionOrder - b.questionOrder,
    );

    sortedQ.forEach((q) => {
      if (!q.children || q.children.length === 0) {
        const opts = parseOptions(q.options);
        if (opts.length > 0 && !seenOrders.has(q.questionOrder)) {
          const cfg = mondaiConfigMap.get(q.mondaiNumber);
          const displayOrder = cfg
            ? cfg.displayStart + Math.max(0, q.questionOrder - cfg.start)
            : q.questionOrder;
          seenOrders.add(q.questionOrder);
          flattened.push({
            ...q,
            options: opts,
            subLabel: String(displayOrder),
          });
        }
      } else {
        const cfg = mondaiConfigMap.get(q.mondaiNumber);
        const isReadingPassage = mondaiPassageMap.get(q.mondaiNumber) === true;
        const childrenWithLabels = [...q.children]
          .sort((a, b) => a.questionOrder - b.questionOrder)
          .map((child, idx) => ({
            ...child,
            subLabel: isReadingPassage
              ? `${cfg?.displayStart ?? q.questionOrder}.${idx + 1}`
              : String(child.questionOrder),
          }));
        const parentQuestion = {
          ...q,
          children: childrenWithLabels,
          isReadingPassage,
        };
        childrenWithLabels.forEach((child) => {
          const opts = parseOptions(child.options);
          if (opts.length > 0 && !seenOrders.has(child.questionOrder)) {
            seenOrders.add(child.questionOrder);
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

      alert("提出できません！");
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
    onFiveMinutesLeft: () => {
      toast.warning("⚠️ 残り5分 — 試験を完了してください！");
    },
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
        toast.error("タブ切り替え过多 — 自動的に提出されます。");
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
      <div className="h-screen flex items-center justify-center bg-exam-dark text-washi-paper/60">
        <div className="text-center animate-pulse">
          <span className="material-symbols-outlined text-5xl mb-3 text-shun-nuri/40">school</span>
          <p className="font-jp text-sm tracking-wider">問題を読み込んでいます...</p>
        </div>
      </div>
    );

  if (error || !testData)
    return (
      <div className="h-screen flex items-center justify-center bg-exam-dark text-washi-paper/60">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-3 text-shun-nuri/40">error</span>
          <p className="font-jp text-sm">問題がありません</p>
        </div>
      </div>
    );

  if (isSubmitting)
    return (
      <div className="h-screen flex items-center justify-center bg-exam-dark text-washi-paper/60">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-3 text-shun-nuri/60 animate-pulse">send</span>
          <p className="font-jp text-sm tracking-wider">提出中...</p>
        </div>
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
    <div className="h-screen flex flex-col text-white bg-exam-dark">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="confirm-dialog p-8 text-center max-w-md w-full mx-4 animate-slide-up">
            <div className="size-14 rounded-sm bg-shun-nuri/10 border border-shun-nuri/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-shun-nuri text-2xl">send</span>
            </div>
            <h3 className="text-lg font-semibold text-washi-paper mb-2 font-jp">
              試験を提出しますか？
            </h3>
            <p className="text-sm text-washi-paper/50 font-jp mb-8">
              解答済み: <span className="text-shun-nuri">{answeredCount}</span> / {totalQuestions} 問題
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2.5 rounded-sm border border-washi-paper/20 text-washi-paper/70 font-jp text-sm hover:bg-charcoal/50 transition-colors"
              >
                キャンセル
              </button>

              <button
                onClick={submitExam}
                className="btn-submit-jlpt"
              >
                提出する
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
          leafQuestions={leafQuestions}
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
