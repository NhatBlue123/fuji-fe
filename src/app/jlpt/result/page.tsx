"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function JLPTResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  // For now, show a simple placeholder
  // TODO: Fetch actual results from backend using attemptId

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <span className="material-symbols-outlined text-6xl text-green-400 mb-4 inline-block">
              check_circle
            </span>
            <h1 className="text-3xl font-bold mb-2">Nộp bài thành công!</h1>
            <p className="text-slate-400">
              Bài thi của bạn đã được nộp và đang được chấm điểm.
            </p>
          </div>

          {attemptId && (
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Mã bài thi:</p>
              <p className="font-mono text-pink-400 font-bold">{attemptId}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/JLPT_Practice")}
              className="px-6 py-3 bg-pink-400 rounded-lg font-semibold hover:bg-pink-500 transition"
            >
              Quay lại danh sách đề thi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition"
            >
              Xem chi tiết kết quả
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Lưu ý:</strong> Trang kết quả chi tiết đang được phát triển.
              Hiện tại bạn có thể xem danh sách bài thi đã làm trong phần lịch sử.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
