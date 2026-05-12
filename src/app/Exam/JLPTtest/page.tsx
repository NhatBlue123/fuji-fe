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

  const {
    data: testData,
    isLoading,
    error,
  } = useGetTestByIdQuery(Number(testId), { skip: !testId });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const examStartTimeRef = useRef(0);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [initialTimeLeft, setInitialTimeLeft] = useState<number | undefined>();
  const [initialTabSwitchCount, setInitialTabSwitchCount] = useState(0);

  const [submitTest] = useSubmitTestMutation();
  const [reportViolation] = useReportViolationMutation();

  const storageKey = `jlpt_exam_state_${testId}`;

  // Restore answers, current question, and tab switch count immediately
  useEffect(() => {
    if (!testId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.answers) setAnswers(state.answers);
        if (typeof state.currentQuestion === "number") setCurrentQuestion(state.currentQuestion);
        if (typeof state.tabSwitchCount === "number") setInitialTabSwitchCount(state.tabSwitchCount);
      }
    } catch {}
  }, [testId, storageKey]);

  // Set start time and calculate remaining time when testData is available
  useEffect(() => {
    if (!testId || !testData?.duration) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.examStartTime) {
          examStartTimeRef.current = state.examStartTime;
          const elapsed = Math.floor((Date.now() - state.examStartTime) / 1000);
          const durationSec = testData.duration * 60;
          const remaining = Math.max(0, durationSec - elapsed);
          setInitialTimeLeft(remaining);
          return;
        }
      }
      examStartTimeRef.current = Date.now();
    } catch {
      examStartTimeRef.current = Date.now();
    }
  }, [testId, testData, storageKey]);

  const {
    jlptTopupTitle,
    jlptTopupMessage,
    jlptTopupType,
    jlptRecommendedPlan,
  } = useFeatureAccess();

  const allQuestions = useMemo(
    () => testData?.questions || [],
    [testData?.questions],
  );
  const upgradePath = getJlptTopupPath(jlptTopupType, jlptRecommendedPlan);

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

      localStorage.removeItem(storageKey);
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
  }, [answers, submitTest, router, testId, storageKey]);

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
    ...(initialTimeLeft !== undefined && { initialTimeLeft }),
  });

  /* ===== ANTI CHEAT ===== */
  const MAX_TAB_SWITCHES = 5;
  const isAntiCheatEnabled = testData?.isAntiCheatEnabled ?? true;

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

  const { tabSwitchCount, activeWarning, dismissWarning, setTabSwitchCount } =
    useAntiCheat({
      enabled: isAntiCheatEnabled,
      maxTabSwitches: MAX_TAB_SWITCHES,
      detectDevTools: true,
      initialTabSwitchCount,
      onViolation: handleViolation,
    });

  // Sync tab switch count to localStorage
  useEffect(() => {
    if (!testId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      const state = saved ? JSON.parse(saved) : {};
      localStorage.setItem(storageKey, JSON.stringify({
        ...state,
        tabSwitchCount,
      }));
    } catch {}
  }, [tabSwitchCount, testId, storageKey]);

  /* ===== UI STATES ===== */

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#0B1120" }}>
        <div className="text-center animate-pulse">
          <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "rgba(165, 42, 42, 0.4)" }}>school</span>
          <p className="font-jp text-sm tracking-wider" style={{ color: "rgba(245, 240, 232, 0.6)" }}>問題を読み込んでいます...</p>
        </div>
      </div>
    );

  if (error || !testData)
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#0B1120" }}>
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "rgba(165, 42, 42, 0.4)" }}>error</span>
          <p className="font-jp text-sm" style={{ color: "rgba(245, 240, 232, 0.6)" }}>問題がありません</p>
        </div>
      </div>
    );

  if (isSubmitting)
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#0B1120" }}>
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-3 animate-pulse" style={{ color: "rgba(165, 42, 42, 0.6)" }}>send</span>
          <p className="font-jp text-sm tracking-wider" style={{ color: "rgba(245, 240, 232, 0.6)" }}>提出中...</p>
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
    <div className="h-screen flex flex-col text-white" style={{ backgroundColor: "#0B1120" }}>
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }}>
          <div style={{
            padding: "2rem",
            textAlign: "center",
            maxWidth: "28rem",
            width: "100%",
            margin: "0 1rem",
            background: "linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(17, 25, 39, 0.98) 100%)",
            border: "1px solid rgba(245, 240, 232, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(20px)",
            animation: "slideUp 0.3s ease-out forwards"
          }}>
            <div style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "4px",
              backgroundColor: "rgba(165, 42, 42, 0.1)",
              border: "1px solid rgba(165, 42, 42, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}>
              <span className="material-symbols-outlined" style={{ color: "#A52A2A", fontSize: "1.5rem" }}>send</span>
            </div>
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#F5F0E8",
              marginBottom: "0.5rem",
              fontFamily: "'Noto Sans JP', sans-serif"
            }}>
              試験を提出しますか？
            </h3>
            <p style={{
              fontSize: "0.875rem",
              color: "rgba(245, 240, 232, 0.5)",
              marginBottom: "2rem",
              fontFamily: "'Noto Sans JP', sans-serif"
            }}>
              解答済み: <span style={{ color: "#A52A2A" }}>{answeredCount}</span> / {totalQuestions} 問題
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(245, 240, 232, 0.2)",
                  backgroundColor: "transparent",
                  color: "rgba(245, 240, 232, 0.7)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                キャンセル
              </button>

              <button
                onClick={submitExam}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)",
                  border: "1px solid rgba(165, 42, 42, 0.6)",
                  borderRadius: "6px",
                  color: "#F5F0E8",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(165, 42, 42, 0.3)",
                  transition: "all 0.25s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #8B2525 0%, #6B1D1D 100%)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(165, 42, 42, 0.4)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #A52A2A 0%, #8B2525 100%)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(165, 42, 42, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>send</span>
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
