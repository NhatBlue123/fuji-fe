 "use client";

import { useParams, useRouter } from "next/navigation";
import { useGetPostSessionByBookingQuery } from "@/store/services/lessonApi";
import { RefreshCw, FileText, NotebookPen, GraduationCap, Download, ArrowLeft } from "lucide-react";

export default function PostSessionPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = Number(params.bookingId);

  const { data, isLoading, error } = useGetPostSessionByBookingQuery(
    { bookingId },
    { skip: !bookingId || Number.isNaN(bookingId) }
  );

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
          <p className="text-[#F0F0F0] text-sm">Không tải được lịch sử buổi học</p>
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
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push("/booking/bookingmodal")}
          className="inline-flex items-center gap-1.5 text-xs text-[#8B8FA8] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại booking
        </button>

        <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
          <p className="text-lg font-semibold">{data.subject || "Buổi học"}</p>
          <p className="text-xs text-[#8B8FA8] mt-1">
            {data.teacherName} - {data.studentName}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <p className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Summary</p>
            <p className="text-xs text-[#8B8FA8] mt-3">Nhận xét</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{data.summary?.teacherNote || "Chưa có"}</p>
            <p className="text-xs text-[#8B8FA8] mt-3">Bài tập</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{data.summary?.homework || "Chưa có"}</p>
            <p className="text-xs text-[#8B8FA8] mt-3">Quiz score</p>
            <p className="text-sm mt-1">{data.latestQuizScore ?? data.summary?.quizScore ?? "-"}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <p className="text-sm font-semibold flex items-center gap-2"><NotebookPen className="h-4 w-4" /> Ghi chú của tôi</p>
            <p className="text-sm mt-3 whitespace-pre-wrap">{data.myNote?.content || "Chưa có ghi chú"}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5">
            <p className="text-sm font-semibold flex items-center gap-2"><Download className="h-4 w-4" /> Recordings</p>
            <div className="space-y-2 mt-3">
              {data.recordings.length === 0 && <p className="text-xs text-[#8B8FA8]">Chưa có recording</p>}
              {data.recordings.map((r) => (
                <a
                  key={r.id}
                  href={r.downloadUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-white/10 p-2 text-xs hover:bg-white/[0.03]"
                >
                  Recording #{r.id} - {r.durationSeconds ?? 0}s
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 md:col-span-2">
            <p className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Transcript</p>
            <div className="space-y-2 mt-3">
              {data.transcripts.length === 0 && <p className="text-xs text-[#8B8FA8]">Chưa có transcript</p>}
              {data.transcripts.map((t, idx) => (
                <div key={idx} className="rounded-lg border border-white/10 p-3 text-xs whitespace-pre-wrap">
                  {t}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
