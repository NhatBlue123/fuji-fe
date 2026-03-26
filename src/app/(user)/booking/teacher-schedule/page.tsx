"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetTeacherAvailabilityQuery } from "@/store/services/bookingApi";

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(v: string) {
  return new Date(v).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeRange(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(s)} - ${hhmm(e)}`;
}

export default function TeacherSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const teacherId = Number(searchParams.get("teacherId"));
  const validTeacherId = Number.isFinite(teacherId) && teacherId > 0;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fromDate = useMemo(() => toYmd(new Date()), []);
  const toDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return toYmd(d);
  }, []);

  const { data, isLoading, isError } = useGetTeacherAvailabilityQuery(
    { teacherId, fromDate, toDate },
    { skip: !validTeacherId }
  );

  const toggleSlot = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  const onGoInvoice = () => {
    if (!validTeacherId || selectedIds.length === 0) return;
    router.push(
      `/booking/bookappointment?teacherId=${teacherId}&timeSlotIds=${selectedIds.join(",")}`
    );
  };

  if (!validTeacherId) {
    return <div className="p-8 text-red-400">Thiếu teacherId trên URL.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[1.15fr_420px] gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <button onClick={() => router.back()} className="text-slate-400 mb-4">
            Quay lại
          </button>

          <h1 className="text-3xl font-black mb-2">Toàn bộ lịch rảnh của giáo viên</h1>
          <p className="text-slate-400 mb-6">
            Chọn một hoặc nhiều buổi học trong toàn bộ lịch rảnh mà giáo viên đã nhập.
          </p>

          {isLoading && <div className="text-slate-400">Đang tải lịch rảnh...</div>}

          {isError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              Không tải được lịch rảnh của giáo viên.
            </div>
          )}

          {!isLoading && !isError && data?.items?.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-400">
              Giáo viên hiện chưa có lịch rảnh.
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <div className="flex items-center gap-4 mb-6 rounded-2xl bg-slate-900/70 p-4">
                <img
                  src={data.teacherAvatarUrl || "/images/avt-default.jpg"}
                  alt={data.teacherName}
                  className="size-16 rounded-2xl object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold">{data.teacherName}</h2>
                  <p className="text-slate-400">
                    Hiển thị lịch từ {data.fromDate} đến {data.toDate}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {data.items.map((group) => (
                  <div key={group.date}>
                    <h3 className="text-lg font-bold mb-3">{formatDate(group.date)}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.slots.map((slot) => {
                        const checked = selectedIds.includes(slot.timeSlotId);

                        return (
                          <button
                            key={slot.timeSlotId}
                            onClick={() => toggleSlot(slot.timeSlotId)}
                            className={`text-left rounded-2xl border p-4 transition ${
                              checked
                                ? "border-pink-500 bg-pink-500/10"
                                : "border-white/10 bg-slate-900/70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-lg font-bold text-pink-400">
                                  {formatTimeRange(slot.startAt, slot.endAt)}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">{slot.subject}</div>
                                <div className="text-sm text-slate-500 mt-1">
                                  {slot.durationMinutes} phút
                                </div>
                              </div>

                              <div
                                className={`size-6 rounded-md border ${
                                  checked
                                    ? "bg-pink-500 border-pink-500"
                                    : "border-white/20"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4">Chuẩn bị thanh toán</h2>

          <div className="rounded-2xl bg-slate-900/70 p-4 mb-4">
            <div className="text-slate-400 text-sm">Số buổi đã chọn</div>
            <div className="text-3xl font-black mt-1">{selectedIds.length}</div>
          </div>

          <button
            onClick={onGoInvoice}
            disabled={selectedIds.length === 0}
            className="w-full mt-6 rounded-2xl bg-secondary py-4 font-bold disabled:opacity-50"
          >
            Xem hóa đơn các buổi đã chọn
          </button>
        </aside>
      </div>
    </main>
  );
}
