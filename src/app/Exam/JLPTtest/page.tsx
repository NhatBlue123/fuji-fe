"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useReportViolationMutation,
  useSubmitTestMutation,
} from "@/store/services/jlptApi";
import type { JlptQuestion, UserAnswer } from "@/types/jlpt";
import {
  JLPT_STRUCTURE,
  rebuildStructureWithCounts,
  type JLPTLevel,
  type SectionConfig,
} from "@/lib/jlpt-structure";
import { getJlptTopupPath } from "@/lib/jlpt-topup";
import { getFeatureErrorMessage, isFeatureError } from "@/lib/subscription-errors";

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
        <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-pink-400" />
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
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const examStartTimeRef = useRef(0);

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

  const allQuestions = useMemo(() => testData?.questions || [], [testData?.questions]);
  const upgradePath = getJlptTopupPath(jlptTopupType, jlptRecommendedPlan);
  const testLevel = testData?.level;

  useEffect(() => {
    examStartTimeRef.current = Date.now();
  }, []);

  const examStructure = useMemo<SectionConfig[]>(() => {
    if (!testLevel) return [];

    try {
      const raw = localStorage.getItem(`jlpt_mondai_config_${testId}`);
      if (raw) {
        const overrides = JSON.parse(raw) as Record<string, { count?: number }>;
        const countMap: Record<number, number> = {};

        Object.entries(overrides).forEach(([key, value]) => {
          if ((value.count ?? 0) > 0) countMap[Number(key)] = value.count ?? 0;
        });

        if (Object.keys(countMap).length > 0) {
          return rebuildStructureWithCounts(
            testLevel as JLPTLevel,
            countMap,
          );
        }
      }
    } catch {}

    return JLPT_STRUCTURE[testLevel as JLPTLevel] ?? [];
  }, [testLevel, testId]);

  const leafQuestions = useMemo(() => {
    const flattened: JlptQuestion[] = [];
    const mondaiPassageMap = new Map<number, boolean>();

    examStructure.forEach((section) => {
      section.mondai.forEach((mondai) => {
        mondaiPassageMap.set(mondai.number, Boolean(mondai.requires_passage));
      });
    });

    const sortedQuestions = [...allQuestions].sort(
      (a, b) => a.questionOrder - b.questionOrder,
    );

    sortedQuestions.forEach((question) => {
      if (!question.children || question.children.length === 0) {
        const options = parseOptions(question.options);
        if (options.length > 0) {
          flattened.push({
            ...question,
            options,
          });
        }
        return;
      }

      const parentQuestion = {
        ...question,
        isReadingPassage: mondaiPassageMap.get(question.mondaiNumber) === true,
      };

      question.children.forEach((child) => {
        const options = parseOptions(child.options);
        if (options.length > 0) {
          flattened.push({
            ...child,
            options,
            parent: parentQuestion,
          });
        }
      });
    });

    return flattened;
  }, [allQuestions, examStructure]);

  const totalQuestions = leafQuestions.length;
  const duration = testData?.duration || 140;

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
    } catch (error) {
      if (isFeatureError(error)) {
        toast.error(getFeatureErrorMessage(error));
        setShowConfirm(false);
        setShowUpgradePopup(true);
      } else {
        alert("Khong the nop bai!");
      }
      setIsSubmitting(false);
    }
  }, [answers, router, submitTest, testId]);

  const handleAutoSubmit = useCallback(() => {
    submitExam();
  }, [submitExam]);

  const { timeLeft } = useCountdown({
    duration: duration * 60,
    paused: false,
    onFiveMinutesLeft: () => alert("Con 5 phut!"),
    onTimeUp: handleAutoSubmit,
  });

  const MAX_TAB_SWITCHES = 5;

  const handleViolation = useCallback(
    (warning: import("@/hooks/useAntiCheat").AntiCheatWarning) => {
      reportViolation({
        type:
          warning.type === "tab_switch"
            ? "TAB_SWITCH"
            : warning.type === "devtools"
              ? "DEVTOOLS"
              : "COPY_PASTE",
        description: warning.message,
        testId: testId || undefined,
      });

      if (
        warning.type === "tab_switch" &&
        warning.count &&
        warning.count >= MAX_TAB_SWITCHES
      ) {
        alert("Ban da roi trang thi qua 5 lan. He thong se tu dong nop bai.");
        submitExam();
      }
    },
    [reportViolation, submitExam, testId],
  );

  const { tabSwitchCount, activeWarning, dismissWarning } = useAntiCheat({
    maxTabSwitches: MAX_TAB_SWITCHES,
    detectDevTools: true,
    onViolation: handleViolation,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Dang tai de...
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Khong tai duoc de
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Dang nop bai...
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen flex-col bg-[#0B1120] text-white">
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

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="rounded-xl bg-[#1a2540] p-6 text-center">
            <p>Ban chac chan muon nop bai?</p>

            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowConfirm(false)}>Huy</button>

              <button
                onClick={submitExam}
                className="rounded bg-red-500 px-4 py-2"
              >
                Nop bai
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
          onSelectOption={(id, option) =>
            setAnswers((prev) => ({ ...prev, [id]: option }))
          }
        />

        <ExamSidebar
          structure={examStructure}
          currentQ={leafQuestions[currentQuestion]?.questionOrder ?? 0}
          answers={answers}
          questions={allQuestions}
          onSelect={(order) => {
            const index = leafQuestions.findIndex(
              (question) => question.questionOrder === order,
            );

            if (index !== -1) {
              setCurrentQuestion(index);
              setScrollTrigger((value) => value + 1);
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
          jlptRecommendedPlan
            ? `Nang cap ${jlptRecommendedPlan}`
            : "Xem goi phu hop"
        }
        upgradePath={upgradePath}
      />
    </div>
  );
}
