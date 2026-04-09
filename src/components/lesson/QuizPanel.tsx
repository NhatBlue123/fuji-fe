"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpCircle, Play, SkipForward, Eye, Flag, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateQuizMutation,
  useListQuizzesQuery,
  useSubmitQuizAnswerMutation,
  useGetQuizResultsQuery,
  type QuizResponse,
  type QuestionType,
} from "@/store/services/lessonApi";
import { useQuizStomp, type QuizQuestionPublic, type QuizSubmissionEvent } from "@/hooks/useQuizStomp";
import { cn } from "@/lib/utils";

interface QuizPanelProps {
  lessonId: number;
  token: string | null;
  isTeacher: boolean;
}

export function QuizPanel({ lessonId, token, isTeacher }: QuizPanelProps) {
  const { data: quizzes = [], refetch } = useListQuizzesQuery({ lessonId });
  const [createQuiz, { isLoading: creating }] = useCreateQuizMutation();
  const [submitAnswer, { isLoading: submitting }] = useSubmitQuizAnswerMutation();

  const [title, setTitle] = useState("");
  const [mcQuestion, setMcQuestion] = useState("");
  const [mcOptions, setMcOptions] = useState('["A","B","C","D"]');
  const [mcCorrect, setMcCorrect] = useState("A");

  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [liveQuestion, setLiveQuestion] = useState<QuizQuestionPublic | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [reveal, setReveal] = useState<{ questionId: number; correctAnswer: string } | null>(null);
  const [feed, setFeed] = useState<QuizSubmissionEvent[]>([]);

  const onQuestion = useCallback((q: QuizQuestionPublic) => {
    setLiveQuestion(q);
    setReveal(null);
    setStudentAnswer("");
  }, []);

  const onSubmission = useCallback((s: QuizSubmissionEvent) => {
    setFeed((prev) => [...prev.slice(-20), s]);
  }, []);

  const onReveal = useCallback((r: { questionId: number; correctAnswer: string }) => {
    setReveal({ questionId: r.questionId, correctAnswer: r.correctAnswer });
  }, []);

  const { startQuiz, nextQuestion, submitLive, sendReveal, endQuiz } = useQuizStomp({
    lessonId,
    token,
    onQuestion,
    onSubmission,
    onReveal,
  });

  const { data: results } = useGetQuizResultsQuery(
    { lessonId, quizId: activeQuizId ?? 0 },
    { skip: !isTeacher || !activeQuizId }
  );

  useEffect(() => {
    if (liveQuestion?.quizId) {
      setActiveQuizId(liveQuestion.quizId);
    }
  }, [liveQuestion]);

  const handleCreate = async () => {
    if (!title.trim() || !mcQuestion.trim()) {
      toast.error("Nhập tiêu đề và nội dung câu hỏi");
      return;
    }
    let optionsJson = mcOptions.trim();
    try {
      JSON.parse(optionsJson);
    } catch {
      toast.error("Options JSON không hợp lệ (ví dụ [\"A\",\"B\"])");
      return;
    }
    try {
      await createQuiz({
        lessonId,
        title: title.trim(),
        questions: [
          {
            type: "MULTIPLE_CHOICE" as QuestionType,
            questionText: mcQuestion.trim(),
            optionsJson,
            correctAnswer: mcCorrect.trim(),
            orderIndex: 0,
          },
        ],
      }).unwrap();
      toast.success("Đã tạo quiz");
      setTitle("");
      setMcQuestion("");
      refetch();
    } catch {
      toast.error("Không tạo được quiz");
    }
  };

  const parseOptions = (json?: string | null): string[] => {
    if (!json) return [];
    try {
      const v = JSON.parse(json) as unknown;
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 text-[13px]">
      <div className="px-3 py-2 border-b border-white/[0.08] flex items-center gap-2 shrink-0">
        <HelpCircle className="h-4 w-4 text-[#6C63FF]" />
        <span className="font-medium text-[#F0F0F0]">Quiz</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        {isTeacher && (
          <div className="rounded-xl border border-white/[0.08] bg-[#252838]/50 p-3 space-y-2">
            <p className="text-xs text-[#8B8FA8]">Tạo nhanh (1 câu trắc nghiệm)</p>
            <input
              className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-[#F0F0F0] text-xs"
              placeholder="Tiêu đề quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-[#F0F0F0] text-xs min-h-[52px]"
              placeholder="Câu hỏi"
              value={mcQuestion}
              onChange={(e) => setMcQuestion(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-[#F0F0F0] text-xs font-mono"
              placeholder='Options JSON — ví dụ ["A","B","C"]'
              value={mcOptions}
              onChange={(e) => setMcOptions(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-[#F0F0F0] text-xs"
              placeholder="Đáp án đúng (khớp một phần tử options)"
              value={mcCorrect}
              onChange={(e) => setMcCorrect(e.target.value)}
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 rounded-lg bg-[#6C63FF] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#5a52e0] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo quiz
            </button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-[#8B8FA8]">Danh sách</p>
          {quizzes.length === 0 ? (
            <p className="text-xs text-[#8B8FA8]/70">Chưa có quiz</p>
          ) : (
            quizzes.map((q: QuizResponse) => (
              <div
                key={q.id}
                className={cn(
                  "rounded-lg border px-2 py-2 flex items-center justify-between gap-2",
                  activeQuizId === q.id
                    ? "border-[#6C63FF]/50 bg-[#6C63FF]/10"
                    : "border-white/[0.08] bg-[#1a1d27]/80"
                )}
              >
                <div className="min-w-0">
                  <p className="text-[#F0F0F0] text-xs font-medium truncate">{q.title}</p>
                  <p className="text-[10px] text-[#8B8FA8]">{q.questionCount} câu</p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0">
                  <button
                    type="button"
                    className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-[#F0F0F0] hover:bg-white/10"
                    onClick={() => {
                      setActiveQuizId(q.id);
                      setQuestionIndex(0);
                      setFeed([]);
                    }}
                  >
                    Chọn
                  </button>
                  {isTeacher && activeQuizId === q.id && (
                    <>
                      <button
                        type="button"
                        className="rounded-md bg-[#6C63FF]/30 px-2 py-1 text-[10px] text-[#F0F0F0]"
                        onClick={() => startQuiz(q.id, 0)}
                        title="Bắt đầu / gửi câu 0"
                      >
                        <Play className="inline h-3 w-3 mr-0.5" />
                        Start
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/[0.08] px-2 py-1 text-[10px]"
                        onClick={() => {
                          const next = questionIndex + 1;
                          setQuestionIndex(next);
                          nextQuestion(q.id, next);
                        }}
                      >
                        <SkipForward className="inline h-3 w-3 mr-0.5" />
                        Next
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/[0.08] px-2 py-1 text-[10px]"
                        onClick={() => liveQuestion && sendReveal(liveQuestion.id)}
                      >
                        <Eye className="inline h-3 w-3 mr-0.5" />
                        Reveal
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-[#FF6B6B]/25 px-2 py-1 text-[10px] text-[#ffb4b4]"
                        onClick={() => endQuiz(q.id)}
                      >
                        <Flag className="inline h-3 w-3 mr-0.5" />
                        End
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {liveQuestion && (
          <div className="rounded-xl border border-[#6C63FF]/30 bg-[#1a1d27] p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-[#6C63FF]">Câu đang mở</p>
            <p className="text-sm text-[#F0F0F0] whitespace-pre-wrap">{liveQuestion.questionText}</p>
            {liveQuestion.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-1">
                {parseOptions(liveQuestion.optionsJson).map((opt, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 text-xs text-[#E8E8F0] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="mc"
                      className="accent-[#6C63FF]"
                      checked={studentAnswer === opt}
                      onChange={() => setStudentAnswer(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {liveQuestion.questionType !== "MULTIPLE_CHOICE" && (
              <input
                className="w-full rounded-lg bg-[#252838] border border-white/10 px-2 py-1.5 text-xs"
                placeholder="Câu trả lời"
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
              />
            )}
            {reveal && reveal.questionId === liveQuestion.id && (
              <p className="text-xs text-emerald-400">
                Đáp án: <span className="font-mono">{reveal.correctAnswer}</span>
              </p>
            )}
            {!isTeacher && liveQuestion && activeQuizId && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={submitting || !studentAnswer}
                  className="rounded-lg bg-[#6C63FF] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                  onClick={async () => {
                    try {
                      await submitAnswer({
                        lessonId,
                        quizId: activeQuizId,
                        questionId: liveQuestion.id,
                        answer: studentAnswer,
                      }).unwrap();
                      submitLive(activeQuizId, liveQuestion.id, studentAnswer);
                      toast.success("Đã gửi");
                    } catch {
                      toast.error("Gửi thất bại");
                    }
                  }}
                >
                  Gửi đáp án
                </button>
              </div>
            )}
          </div>
        )}

        {isTeacher && feed.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] p-2 space-y-1">
            <p className="text-[10px] text-[#8B8FA8]">Realtime</p>
            {feed.map((f, i) => (
              <div key={`${f.userId}-${f.questionId}-${i}`} className="text-[11px] text-[#c9cad4]">
                <span className="text-[#6C63FF]">{f.userName}</span> —{" "}
                {f.correct ? (
                  <span className="text-emerald-400">đúng (+{f.scorePoints})</span>
                ) : (
                  <span className="text-[#FF6B6B]">sai</span>
                )}
              </div>
            ))}
          </div>
        )}

        {isTeacher && results && activeQuizId && (
          <div className="rounded-xl border border-white/[0.08] p-2 text-[11px] text-[#8B8FA8]">
            <p className="text-[#F0F0F0] text-xs mb-1">Tổng kết (REST)</p>
            <pre className="whitespace-pre-wrap font-mono text-[10px] overflow-x-auto">
              {JSON.stringify(results.scoresByUser, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
