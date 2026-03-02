"use client";

import React, { useEffect, useState } from "react";
interface BookingModalProps {
  onClose: () => void;
}
export default function BookingModal({ onClose }: BookingModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  const [selectedDate, setSelectedDate] = useState(7);
  const [selectedTime, setSelectedTime] = useState("10:00 - 11:00");

  const times = [
    "08:00 - 10:00",
    "09:00 - 11:00",
    "13:00 - 15:00",
    "15:00 - 17:00",
    "18:00 - 20:00",
    "19:00 - 21:00",
    "20:00 - 22:00",
  ];

  const disabledTimes = ["14:00 - 15:00"];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F1A]/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-6xl h-[90vh] bg-[#161B22]/70 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="size-10 rounded-full hover:bg-white/5 transition flex items-center justify-center"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <h2 className="text-xl font-bold">Đặt lịch học với Sensei</h2>
          </div>

          <button
            onClick={onClose}
            className="size-10 rounded-full hover:bg-white/5 transition flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-12 gap-8">
            {/* LEFT PANEL */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* PROFILE */}
              <div className="bg-[#161B22] rounded-2xl border border-pink-500/20 p-6 text-center shadow-[0_0_20px_rgba(255,92,141,0.05)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvQFVjaA0ZgmkPZEXimtW00t7GPwNeIGsyJMq7arB2jvnLSppnuhNs-SYDqamYhzfLQmPbpci444m1IPuSUeACsi5ICYEDRV8gEvOhqqrjCEEoobYluCeNFTIub_G8p1P3K66QidoZmtuZHxFN4gSQyaI_Wx1oSduv93CFalNFnbOdSEX-h6yAb_pphUiM-yIHkUvTVztIKO7p9fxdR8oKXbG7hfNsdDfTtA-GKcNOmehZuk3Ld2-QV6mFFggN-JXGIZwbcIA9X5eK"
                  className="size-32 mx-auto rounded-2xl border-2 border-pink-500 object-cover shadow-[0_0_20px_rgba(255,92,141,0.2)]"
                />

                <h3 className="text-2xl font-bold mt-4">Haruka Sensei</h3>

                <p className="text-pink-400 font-bold text-sm mt-1">
                  ⭐ 4.9 (128 đánh giá)
                </p>

                <div className="mt-5 p-4 bg-[#0B0F1A]/60 rounded-xl border border-white/5 flex justify-between">
                  <span className="text-gray-400 text-sm">Học phí</span>
                  <span className="text-xl font-black">
                    $25
                    <span className="text-xs text-gray-400">/giờ</span>
                  </span>
                </div>
              </div>

              <div className="bg-[#161B22]/50 rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="material-symbols-outlined text-neon-pink">
                    verified
                  </span>
                  <span className="text-text-secondary">JLPT N1 Certified</span>
                </div>

                <div className="flex items-center gap-3 text-sm mb-2">
                  <span className="material-symbols-outlined text-neon-pink">
                    schedule
                  </span>
                  <span className="text-text-secondary">
                    Thành viên từ 2021
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-neon-pink">
                    language
                  </span>
                  <span className="text-text-secondary">
                    Tiếng Nhật, Tiếng Anh
                  </span>
                </div>
              </div>

              {/* NOTE */}
              <div className="bg-[#161B22]/50 rounded-2xl p-6 border border-white/5">
                <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-gray-400">
                  Lưu ý đặt lịch
                </h4>

                <ul className="space-y-3 text-xs text-gray-400">
                  <li>• Hủy trước 24h để hoàn tiền</li>
                  <li>• Vui lòng đến đúng giờ</li>
                </ul>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* DATE */}
              <section>
                <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold mb-4">Chọn ngày học</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">Tháng 10, 2024</span>
                  <div className="flex gap-2">
                    <button className="size-8 rounded-lg border border-accent-border flex items-center justify-center hover:border-neon-pink transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                    </button>
                    <button className="size-8 rounded-lg border border-accent-border flex items-center justify-center hover:border-neon-pink transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const isSelected = day === selectedDate;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`h-20 rounded-xl border flex items-start p-2 font-bold transition
                          ${
                            isSelected
                              ? "bg-[#0B0F1A] border-pink-500 shadow-[0_0_15px_rgba(255,92,141,0.4)]"
                              : "bg-[#161B22] border-gray-700 hover:border-pink-500"
                          }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* TIME */}
              <section>
                <h3 className="text-lg font-bold mb-4">Chọn khung giờ</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {times.map((time) => {
                    const disabled = disabledTimes.includes(time);
                    const selected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        disabled={disabled}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition
                          ${
                            disabled
                              ? "opacity-40 cursor-not-allowed bg-[#161B22]/50 border-gray-700"
                              : selected
                                ? "border-pink-500 bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(255,92,141,0.4)]"
                                : "bg-[#161B22] border-gray-700 hover:border-pink-500"
                          }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex gap-10 text-sm">
            <div>
              <p className="text-gray-400 uppercase text-xs font-bold">Ngày</p>
              <p className="font-bold">Ngày {selectedDate}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-xs font-bold">Giờ</p>
              <p className="font-bold">{selectedTime}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-xs font-bold">Tổng</p>
              <p className="text-2xl font-black text-pink-500">$25.00</p>
            </div>
          </div>

          <button className="px-12 py-4 bg-pink-500 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition shadow-[0_0_30px_rgba(255,92,141,0.4)]">
            Xác nhận đặt lịch
          </button>
        </div>
      </div>
    </div>
  );
}
