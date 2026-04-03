"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCancelBookingMutation, useGetMyBookingsQuery, useGetMyTimeSlotsQuery } from "@/store/services/bookingApi";
import { useAuth } from "@/store/hooks";

type BookingTab = "UPCOMING" | "COMPLETED" | "CANCELLED";
type Tab = "MY_SLOTS" | BookingTab;

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
  const { isTeacher, isInitialized } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [tab, setTab] = useState<Tab>("UPCOMING");

  // Sync lại khi auth state thực sự đã init (phòng trường hợp localStorage stale)
  useEffect(() => {
    if (isInitialized) {
      setTab((prev) => {
        const correct = isTeacher ? "MY_SLOTS" : "UPCOMING";
        // Chỉ set nếu đang ở tab mặc định cũ (chưa user chủ động chọn)
        if (prev === "MY_SLOTS" || prev === "UPCOMING") return correct;
        return prev;
      });
    }
  }, [isInitialized, isTeacher]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resolvedTab = tab;
  const isBookingTab = resolvedTab !== "MY_SLOTS";

  // Chỉ fetch khi auth đã sẵn sàng
  const { data, isLoading, isFetching, isError } = useGetMyBookingsQuery(
    { status: resolvedTab as BookingTab },
    { skip: !isInitialized || !isBookingTab }
  );
  const {
    data: slotsData,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    isError: slotsError,
  } = useGetMyTimeSlotsQuery(undefined, {
    skip: !isInitialized || !isTeacher || isBookingTab,
    refetchOnMountOrArgChange: true,
  });

  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const items = data ?? [];

  const handleConfirmCancel = async () => {
    if (deletingId === null) return;
    try {
      await cancelBooking({ bookingId: deletingId }).unwrap();
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
            {isMounted && isTeacher && (
              <button
                onClick={() => setTab("MY_SLOTS")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  resolvedTab === "MY_SLOTS" ? "bg-secondary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Lịch rảnh
              </button>
            )}
            {(["UPCOMING", "COMPLETED", "CANCELLED"] as BookingTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  resolvedTab === t ? "bg-secondary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "UPCOMING" ? "Sắp tới" : t === "COMPLETED" ? "Đã hoàn thành" : "Đã hủy"}
              </button>
            ))}
          </div>

          <Link href={isMounted && isTeacher ? "/admin/teacher-schedules/create-slot" : "/booking"}>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-xl text-sm font-bold text-secondary hover:bg-secondary/20 transition-all active:scale-95">
              <span className="material-symbols-outlined text-sm">add</span>
              {isMounted && isTeacher ? "Tạo lịch dạy" : "Đặt lịch mới"}
            </button>
          </Link>
        </div>

        {/* === Tab Lịch rảnh (chỉ GV) === */}
        {resolvedTab === "MY_SLOTS" && (
          <>
            {(slotsLoading || slotsFetching) && <div className="text-slate-400 animate-pulse">Đang tải lịch rảnh...</div>}
            {slotsError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Không tải được lịch rảnh.
              </div>
            )}
            {!slotsLoading && !slotsFetching && !slotsError && (!slotsData || slotsData.length === 0) && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
                Bạn chưa tạo lịch rảnh nào. Bấm &quot;Tạo lịch dạy&quot; để bắt đầu.
              </div>
            )}
            <div className="space-y-4">
              {(slotsData ?? []).map((s) => (
                <div
                  key={s.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="size-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-2xl">event_available</span>
                    </div>
                    <div>
                      <h4 className="text-slate-100 font-bold">{s.subject || "Chưa đặt tên"}</h4>
                      <p className="text-pink-400 text-sm">{s.price} 🌸 / buổi</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 px-8 border-x border-white/10">
                    <div className="flex flex-col items-center">
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Ngày</p>
                      <p className="text-white font-bold">{formatDate(s.startAt)}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Giờ</p>
                      <p className="text-white font-bold">{formatTimeRange(s.startAt, s.endAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {s.status === "AVAILABLE" ? (
                      <span className="px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                        Chờ đặt
                      </span>
                    ) : (
                      <span className="px-6 py-3 rounded-xl text-sm font-bold bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        Đã có người đặt
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* === Các tab Booking (UPCOMING, COMPLETED, CANCELLED) === */}
        {isBookingTab && (
          <>
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

            <div className="space-y-4">
              {items.map((c) => (
                <div
                  key={c.bookingId}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <img
                      src={(c.role === "TEACHER" ? c.studentAvatarUrl : c.teacherAvatarUrl) || "/images/avt-default.jpg"}
                      className="size-14 rounded-xl object-cover ring-2 ring-pink-500/20"
                      alt={c.role === "TEACHER" ? "Student" : "Teacher"}
                    />
                    <div>
                      <h4 className="text-slate-100 font-bold">
                        {c.role === "TEACHER" ? c.studentName : c.teacherName}
                      </h4>
                      <p className="text-pink-400 text-sm">{c.subject}</p>
                      <p className="text-slate-500 text-xs">
                        {c.role === "TEACHER" ? "Học viên" : "Giáo viên"}
                      </p>
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
                        {c.canJoinVideoCall ? (
                          <Link href={`/learn/session/${c.bookingId}`}>
                            <button className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-all flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">videocam</span>
                              Vào phòng
                            </button>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold bg-secondary/50 text-white/60 cursor-not-allowed transition-all"
                            title="Chỉ vào phòng được trước 5 phút so với giờ bắt đầu"
                          >
                            Chờ lớp
                          </button>
                        )}
                        {!isTeacher && (
                          <button
                            disabled={isCancelling}
                            onClick={() => setDeletingId(c.bookingId)}
                            className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                          >
                            Hủy
                          </button>
                        )}
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
          </>
        )}
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