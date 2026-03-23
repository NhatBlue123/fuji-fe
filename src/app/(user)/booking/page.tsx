"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetDiscoverySlotsQuery } from "@/store/services/bookingApi";

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeRange(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(s)} - ${hhmm(e)}`;
}

export default function SlotListPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

//tạo phần chạy lịch ăn cắp ý tưởng bên momo
  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 365 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(toYmd(new Date()));

  const { data, isLoading, isFetching, isError } = useGetDiscoverySlotsQuery({
    date: selectedDate,
    keyword: keyword.trim() || undefined,
  });

  const filteredSlots = useMemo(() => {
    const rawSlots = data?.items ?? [];
    return rawSlots.filter((slot) => {
      const slotStart = new Date(slot.startAt);
      return slotStart > now;
    });
  }, [data, now]);

  return (
    <main className="flex-1 flex flex-col px-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />

      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Đặt lịch cùng <span className="text-secondary text-glow">Sensei</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            Tìm giáo viên phù hợp và chọn khung giờ còn trống.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all w-64"
              placeholder="Tìm giáo viên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <Link href="/booking/bookingmodal">
            <button className="bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-2 rounded-xl transition">
              Lịch của tôi
            </button>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Thanh chọn ngày */}
        <div className="glass-card rounded-2xl p-4 overflow-hidden relative group">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x select-none">
            {days.map((d, idx) => {
              const ymd = toYmd(d);
              const active = selectedDate === ymd;
              const day = d.getDate();
              const month = d.getMonth() + 1;
              const weekday = d.toLocaleDateString("vi-VN", { weekday: "short" });

              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDate(ymd)}
                  className={`flex flex-col items-center justify-center min-w-[90px] py-4 rounded-xl transition-all snap-start ${
                    active
                      ? "bg-secondary text-white shadow-[0_0_15px_rgba(255,92,141,0.3)] scale-105"
                      : "border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-80 mb-1">
                    {idx === 0 ? "Hôm nay" : weekday}
                  </span>
                  <span className="text-2xl font-black leading-none">
                    {String(day).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] mt-1 font-medium">Tháng {month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {(isLoading || isFetching) && (
          <div className="text-muted-foreground animate-pulse">Đang tải lịch rảnh...</div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Không tải được dữ liệu lịch rảnh.
          </div>
        )}

        {/* Kiểm tra mảng sau khi đã lọc */}
        {!isLoading && !isFetching && !isError && filteredSlots.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-muted-foreground">
            Hiện không có khung giờ nào khả dụng .
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => (
            <div
              key={slot.timeSlotId}
              className="glass-card p-6 rounded-2xl border border-white/5 hover:border-pink-500/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-secondary text-2xl font-black mb-1">
                    {formatTimeRange(slot.startAt, slot.endAt)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20 w-fit">
                    {slot.status}
                  </span>
                </div>
                <div className="size-14 rounded-full border-2 border-pink-500/30 p-1 group-hover:border-pink-500 transition-all">
                  <div
                    className="w-full h-full rounded-full bg-cover bg-center bg-white/10"
                    style={{
                      backgroundImage: `url(${slot.teacherAvatarUrl || "/images/avt-default.jpg"})`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-pink-500 text-sm">person</span>
                  <span className="text-sm font-semibold">Giáo viên: {slot.teacherName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-pink-500 text-sm">book</span>
                  <span className="text-sm">Môn học: {slot.subject}</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/booking/bookappointment?timeSlotId=${slot.timeSlotId}`)}
                className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold transition-all shadow-lg shadow-secondary/20"
              >
                Đặt lịch ngay
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}