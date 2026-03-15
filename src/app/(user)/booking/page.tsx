"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
const slots = [
  {
    time: "08:00 - 09:00",
    teacher: "Sakura Sensei",
    subject: "Sơ cấp N5 - Kaiwa",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnLMy5RxPXb33n_K1--Y3VLHbzvt7cJNKPasYfTh-GY-dfuXUhXpVwuxm1Mw_v9cOryFEk4xmNd3ersb-iEQbXEuEN8rPtAoNB6pFsalK-TTpAPrzd88mb0EHNa2yxjGgbaxmVv1Q9fwB8yjm4aPKvhGCOSKJmi7PVEfBDpLYwRX0pByywCyjzPCNYLnURJm73JPMFqnsqfvoipjXlsVKwkKx9DfCSEJzaVkdBu-gwJlg-e4jc0E8cjUGEg-L4ySrucay-Y3LAy887",
  },
  {
    time: "09:30 - 10:30",
    teacher: "Tanaka Sensei",
    subject: "Trung cấp N3 - Ngữ pháp",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDAZxxBYvHhmgJYR7isJeI2IEApXFBm0nov9YIpJ4jJ3PSRauAuBWQaTzxWfvj6KN-uWLaKe3rkjtmdk9jASycIJoPYnAut2YnEdh3krY04mt5AG47ZpsxEMORmKY6DfW5CefubynVOAEagiax5XsPInCux3OKRFGC0DMHlOtpK4gXtBNM3zUmLYuD3Ox1B8NkH-5HcL7bxo_zDcd9ywhIRzbwmzlyDizRp8oz45j6e5RluysMvFOfZo3nWjD3c6sHmnNQkVge_Or3q",
  },
  {
    time: "11:00 - 12:00",
    teacher: "Yuki Sensei",
    subject: "JLPT N2 - Luyện đề",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDIzgCGqRp_j2ccvVK8TpiE63r7aeRF0Qxeid0Eu_Ro6ywhurDS-yEQzcSLXh3Ns-Kdq3mV0fPlS7VQ2FW54d9MdaJB1yXqebtI9_P1oO4T4srp4uMWgfFeP_8Fu5N_fPJb0HvDoo0ja_Dlz8Ly8fKgsLOEC2f3cvlsZVJtXOgS9tRk56J_IFdmTBk-l2XkAZCIemLxpaugf5r2Nx34sxd_hqQsmNlV-BmvVuwLk4tZoDAL33ysnjPc3zLMV3V_l5ezXwe3I6ZmX2U",
  },
  {
    time: "14:00 - 15:00",
    teacher: "Sato Sensei",
    subject: "Business Japanese",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDnuBaQ4BVsKtcvbl9j5cfdZMtQtnyri_PG4dXil-UyNVsoxgQzPURR1e2Fgu1hQ3Ik9BLNIiRvtDvHEJQjduKeYA9FLSFlPB3gxU2PNoO8_K9SSxWfcmVPMnWjaPgoJR8O2gAB_TNMW1YuvjTAcaUHyhIZZ3HO7-uinYInVcArXyuzS4jjxAR-QCon5AE8JT3KcM9h1lLJQyiHb_siZkKEVDRaB3PBHV277kw42e8ROOnbk6j1GR6cyOd6j7wlixd6z0LtNTqZ6XJ9",
  },
  {
    time: "15:30 - 16:30",
    teacher: "Hiroshi Sensei",
    subject: "Kanji Mastery N1",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAreiMblEUP1GYBovOEyNPvfjS0a9HgH4YToCEz0YP4sjXUgmCGhYGvrO2WCtIu5dFHYyRO6F3vJ7fOdQ1oWTGkJ8A8YSsOvM7075r5kK6qZ30JAhg9JYBF3RAZALgLiNJ7hlQZzVOb5_BSxh2ZZWgNTWRdna6WqL6eJfq0v3Yjss3JIicsgYOtycuEoHWnDtDzWXyWnQe55-l89A-dI-uc0_uoJIEDdSIolPTLrxDeYdMXCv0-wuKbHdTcr82vPnqG1zu63ac4Wwth",
  },
  {
    time: "19:00 - 20:00",
    teacher: "Sakura Sensei",
    subject: "Sơ cấp N4 - Kaiwa",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYPqrM0yKwAkoy99Rp8zxCjnvxGkKX8LjIINbe2ZHfGqm6sWCffWwH7CCU-QAgYFKvLlgOMDuL_nt8wGMKKuLQajSKKLKKp0E8Fwu2X4m-B1jqWt_1d0gatOdvqbd1ZwlnYq21wLu_UAVhloqMxXK178A3GLY11jCCI7AbTai99QgTYyGrg-H0fdg149V9SlmXzhecT4y_XCDYie06u0l4pUsJqd1EVmyXzeO71W1DyTy0s1K-xeZAyLq_GeIJMf80PG8GHcbukrd3",
  },
];
export default function SlotList() {
  return (
    <main className="flex-1 flex flex-col px-6 overflow-hidden relative">
      {/* Background Neon Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]"></div>

      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-background-light/50 backdrop-blur-md ">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3">
            Đặt lịch cùng{" "}
            <span className="text-secondary text-glow">Sensei</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-xl md:max-w-2xl leading-relaxed">
            Nâng trình hội thoại với giáo viên bản xứ cực kỳ tâm huyết. Tìm kiếm chuyên gia tiếng Nhật 1 kèm 1 phù hợp nhất.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all w-64"
              placeholder="Tìm giáo viên..."
              type="text"
            />
          </div>

          <Link href="/booking/bookingmodal">
            <button className="bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 transition">
              Lịch của tôi
            </button>
          </Link>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Date Selection Section */}
        <div className="glass-card rounded-2xl p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white shadow-[0_0_15px_rgba(255,92,141,0.3)]">
              <span className="text-[10px] uppercase font-bold opacity-80">
                Hôm nay
              </span>
              <span className="text-lg font-black">07</span>
              <span className="text-xs">Th10</span>
            </button>

            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl border border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Thứ 3
              </span>
              <span className="text-lg font-black">08</span>
              <span className="text-xs">Th10</span>
            </button>

            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl border border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Thứ 4
              </span>
              <span className="text-lg font-black">09</span>
              <span className="text-xs">Th10</span>
            </button>

            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl border border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Thứ 5
              </span>
              <span className="text-lg font-black">10</span>
              <span className="text-xs">Th10</span>
            </button>

            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl border border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Thứ 6
              </span>
              <span className="text-lg font-black">11</span>
              <span className="text-xs">Th10</span>
            </button>

            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl border border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Thứ 7
              </span>
              <span className="text-lg font-black">12</span>
              <span className="text-xs">Th10</span>
            </button>

            <button className="flex flex-col items-center justify-center w-24 py-3 rounded-xl border border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Chủ Nhật
              </span>
              <span className="text-lg font-black">13</span>
              <span className="text-xs">Th10</span>
            </button>
          </div>
        </div>

        {/* Slot List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="glass-card p-6 rounded-2xl border border-white/5 hover:border-pink-500/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-pink-500 text-2xl font-black mb-1">
                    {slot.time}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20 w-fit">
                    Available
                  </span>
                </div>

                <div className="size-14 rounded-full border-2 border-pink-500/30 p-1 group-hover:border-pink-500 transition-all">
                  <div
                    className="w-full h-full rounded-full bg-cover bg-center bg-white/10"
                    style={{ backgroundImage: `url(${slot.avatar})` }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-pink-500 text-sm">
                    person
                  </span>
                  <span className="text-sm font-semibold">
                    Giáo viên: {slot.teacher}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-pink-500 text-sm">
                    book
                  </span>
                  <span className="text-sm">Môn học: {slot.subject}</span>
                </div>
              </div>

              <Link href="/booking/bookappointment">
                <button className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold  transition-all">
                  Đặt lịch ngay
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}