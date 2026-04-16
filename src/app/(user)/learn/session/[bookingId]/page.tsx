"use client";

import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetPostSessionByBookingQuery } from "@/store/services/lessonApi";
import {
  RefreshCw,
  FileText,
  NotebookPen,
  GraduationCap,
  Download,
  ArrowLeft,
  Copy,
  Clock3,
  UserRound,
  BookText,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PostSessionPage() {
  const { t } = useTranslation();
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = Number(params.bookingId);

  const { data, isLoading, error } = useGetPostSessionByBookingQuery(
    { bookingId },
    { skip: !bookingId || Number.isNaN(bookingId) }
  );

  const transcriptTxt = useMemo(() => {
    if (!data?.transcripts?.length) return "";
    return data.transcripts
      .map((t, i) => `=== Transcript ${i + 1} ===\n${t}`)
      .join("\n\n");
  }, [data?.transcripts]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] bg-[#0f1117] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#8B8FA8] text-sm">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Đang tải dữ liệu buổi học...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[calc(100vh-64px)] bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#F0F0F0] text-sm">{t('auto.booking_session_1')}</p>
          <button
            type="button"
            onClick={() => router.push("/booking/bookingmodal")}
            className="mt-3 rounded-lg bg-[#6C63FF] px-4 py-2 text-xs text-white"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f1117] text-[#F0F0F0] p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <button
          type="button"
          onClick={() => router.push("/booking/bookingmodal")}
          className="inline-flex items-center gap-1.5 text-xs text-[#8B8FA8] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại booking
        </button>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1d27] to-[#22263a] p-6">
          <p className="text-xl font-semibold">{data.subject || "Buổi học"}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#B8BCD2]">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              GV: {data.teacherName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              HV: {data.studentName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Post-session ready
            </span>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 lg:col-span-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <BookText className="h-4 w-4" />
              Timeline buổi học
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 bg-[#121520] p-3">
                <p className="text-[11px] text-[#8B8FA8]">Summary</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{data.summary?.teacherNote || "Chưa có nhận xét"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#121520] p-3">
                <p className="text-[11px] text-[#8B8FA8]">Homework</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{data.summary?.homework || "Chưa có bài tập"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#121520] p-3">
                <p className="text-[11px] text-[#8B8FA8]">Quiz score</p>
                <p className="text-sm mt-1">{data.latestQuizScore ?? data.summary?.quizScore ?? "-"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <p className="text-sm font-semibold flex items-center gap-2">
              <NotebookPen className="h-4 w-4" />
              Ghi chú của tôi
            </p>
            <p className="text-sm mt-3 whitespace-pre-wrap text-[#D7DBEE]">
              {data.myNote?.content || "Chưa có ghi chú"}
            </p>
          </section>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Download className="h-4 w-4" />
              Recordings
            </p>
            <div className="mt-4 space-y-2">
              {data.recordings.length === 0 && <p className="text-xs text-[#8B8FA8]">{t('auto.booking_session_2')}</p>}
              {data.recordings.map((r, idx) => (
                <div key={r.id} className="rounded-lg border border-white/10 bg-[#121520] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">Recording #{idx + 1}</p>
                    <p className="text-[11px] text-[#8B8FA8] inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatDuration(r.durationSeconds)}
                    </p>
                  </div>
                  {r.downloadUrl ? (
                    <a
                      href={r.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md bg-[#6C63FF]/20 px-2.5 py-1 text-[11px] text-[#c8c3ff] hover:bg-[#6C63FF]/30"
                    >
                      Mở file
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#8B8FA8]">N/A</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Transcript
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!transcriptTxt}
                  onClick={async () => {
                    if (!transcriptTxt) return;
                    await navigator.clipboard.writeText(transcriptTxt);
                    toast.success("Đã copy transcript");
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] disabled:opacity-40"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
                <button
                  type="button"
                  disabled={!transcriptTxt}
                  onClick={() => {
                    if (!transcriptTxt) return;
                    downloadTextFile(`lesson-${data.lessonId}-transcript.txt`, transcriptTxt);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] disabled:opacity-40"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {data.transcripts.length === 0 && <p className="text-xs text-[#8B8FA8]">{t('auto.booking_session_3')}</p>}
              {data.transcripts.map((transcript, idx) => (
                <details key={idx} className="rounded-lg border border-white/10 bg-[#121520] open:border-[#6C63FF]/40">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium flex items-center justify-between">
                    <span>Transcript #{idx + 1}</span>
                    <span className="text-[#8B8FA8] text-[11px]">{t('auto.booking_session_4')}</span>
                  </summary>
                  <div className="px-3 pb-3 text-xs whitespace-pre-wrap text-[#D7DBEE]">
                    {transcript}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
