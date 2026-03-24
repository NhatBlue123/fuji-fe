"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCancelBookingMutation, useGetMyBookingsQuery } from "@/store/services/bookingApi";

type Tab = "UPCOMING" | "COMPLETED" | "CANCELLED";

function formatDate(v: string) {
  return new Date(v).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTimeRange(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(s)} - ${hhmm(e)}`;
}

export default function MySchedulePage() {
  const [tab, setTab] = useState<Tab>("UPCOMING");
  
  // State để quản lý việc hiển thị Modal xác nhận hủy
  // Nếu bằng null là đóng, nếu có ID là đang mở Modal cho class đó
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError } = useGetMyBookingsQuery({ status: tab });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const items = data ?? [];

  // Hàm thực hiện hủy thực sự khi bấm "Đồng ý" trên Modal
  const handleConfirmCancel = async () => {
    if (deletingId === null) return;
    try {
      await cancelBooking({ bookingId: deletingId }).unwrap();
      // Thành công thì tự đóng modal
      setDeletingId(null);
    } catch (e) {
      console.error("Lỗi khi hủy lịch:", e);
      alert("Không thể hủy lịch, vui lòng thử lại sau.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0f172a] px-6 relative min-h-screen">
      <div className="px-10 py-8">
        {/* Tab Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {(["UPCOMING", "COMPLETED", "CANCELLED"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === t ? "bg-secondary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "UPCOMING" ? "Sắp tới" : t === "COMPLETED" ? "Đã hoàn thành" : "Đã hủy"}
              </button>
            ))}
          </div>

          <Link href="/booking">
  <button className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-xl text-sm font-bold text-secondary hover:bg-secondary/20 transition-all active:scale-95">
    <span className="material-symbols-outlined text-sm">add</span>
    Đặt lịch mới
  </button>
</Link>
        </div>

        {/* Trạng thái Loading / Lỗi */}
        {(isLoading || isFetching) && <div className="text-slate-400 animate-pulse">Đang tải lịch của bạn...</div>}

        {isError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Không tải được lịch của bạn. Vui lòng kiểm tra lại kết nối.
          </div>
        )}

        {!isLoading && !isFetching && !isError && items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
            Không có dữ liệu lịch học trong mục này.
          </div>
        )}

        {/* Danh sách lịch học */}
        <div className="space-y-4">
          {items.map((c) => (
            <div
              key={c.bookingId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 w-full">
                <img
                  src={c.teacherAvatarUrl || "/images/avt-default.jpg"}
                  className="size-14 rounded-xl object-cover ring-2 ring-pink-500/20"
                  alt="Teacher"
                />
                <div>
                  <h4 className="text-slate-100 font-bold">{c.teacherName}</h4>
                  <p className="text-pink-400 text-sm">{c.subject}</p>
                </div>
              </div>

              <div className="flex items-center gap-8 px-8 border-x border-white/10">
                <div className="flex flex-col items-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Ngày</p>
                  <p className="text-white font-bold">{formatDate(c.startAt)}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Giờ</p>
                  <p className="text-white font-bold">{formatTimeRange(c.startAt, c.endAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {tab === "UPCOMING" && (
                  <>
                    <button className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/90 text-white transition-all">
                      {new Date() >= new Date(c.startAt) ? "Vào lớp" : "Chờ lớp"}
                    </button>
                    <button
                      disabled={isCancelling}
                      onClick={() => setDeletingId(c.bookingId)}
                      className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </>
                )}

                {tab === "COMPLETED" && (
                  <span className="px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                    Hoàn thành
                  </span>
                )}

                {tab === "CANCELLED" && (
                  <span className="px-6 py-3 rounded-xl text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/20">
                    Đã hủy
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL XÁC NHẬN HỦY (Chỉ hiện khi deletingId khác null) --- */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Lớp nền mờ */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !isCancelling && setDeletingId(null)} 
          />
          
        {/* Nội dung Modal */}
          <div className="relative bg-[#1e293b] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">warning</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Xác nhận hủy lớp</h3>
              <p className="text-slate-400 text-sm mb-8">
                 Bạn sẽ phải chịu 50% phí hủy lớp.Bạn có chắc chắn muốn hủy lịch học này không?
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeletingId(null)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Để sau
                </button>
                
                <button 
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-secondary/20"
                >
                  {isCancelling ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang hủy...
                    </>
                  ) : "Đồng ý hủy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}