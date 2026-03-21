"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const courses = [
  {
    title: "Từ vựng N2 siêu tốc",
    lessons: "24 bài giảng • 12 giờ",
    tag: "N2 Prep",
  },
  {
    title: "Tiếng Nhật công sở",
    lessons: "15 bài giảng • 8 giờ",
    tag: "Business",
  },
  {
    title: "Văn hóa giao tiếp Nhật",
    lessons: "10 bài giảng • 5 giờ",
    tag: "Culture",
  },
  {
    title: "Luyện giọng chuẩn Tokyo",
    lessons: "12 bài giảng • 6 giờ",
    tag: "Pronunciation",
  },
];

const classes = [
  {
    teacher: "Tanaka Sensei",
    subject: "Giao tiếp N3",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAa6-kOZhF7ebF5mujILXAuQxsFPSgnQcE5VMEB-KjqVZHg3zEqXY5QKozYCklySzyRkWmW8mVdWEjRrHPjxQxilJlSReY36WavHmcXwcOZey0kpQStAio_GJbrs2n73Y7A7pmztL-Gny9f8XAcuIoyPUwY36FI4d5fpFeGn6kcRkxSIs101CS-aLarIt77ZZ-cct9ReUGcoggjJB8AovmjASY9Qv9AIn4r7jtjhebm1KH6cSD6eQWrhUObG8V-683jh3Fy4N6yfFD9",
    date: "15/10",
    time: "09:00",
    status: "join",
  },
  {
    teacher: "Yuki Sensei",
    subject: "Kanji N2",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAa6-kOZhF7ebF5mujILXAuQxsFPSgnQcE5VMEB-KjqVZHg3zEqXY5QKozYCklySzyRkWmW8mVdWEjRrHPjxQxilJlSReY36WavHmcXwcOZey0kpQStAio_GJbrs2n73Y7A7pmztL-Gny9f8XAcuIoyPUwY36FI4d5fpFeGn6kcRkxSIs101CS-aLarIt77ZZ-cct9ReUGcoggjJB8AovmjASY9Qv9AIn4r7jtjhebm1KH6cSD6eQWrhUObG8V-683jh3Fy4N6yfFD9",
    date: "16/10",
    time: "14:00",
    status: "waiting",
  },
];

const times = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
];

const disabledTimes = ["11:00", "14:00", "18:00"];

export default function BookingModalPage() {
  const [selectedDate, setSelectedDate] = useState<number>(15);
  const [selectedTime, setSelectedTime] = useState<string>("");

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0B0F1A]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/booking">
              <Button
                variant="ghost"
                className="size-10 rounded-full hover:bg-white/5 transition flex items-center justify-center"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Button>
            </Link>
            <h2 className="text-xl font-bold">Đặt lịch học với Sensei</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                search
              </span>
              <input
                placeholder="Tìm khóa học, giáo viên..."
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* filter */}
            <button className="flex items-center justify-center size-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-pink-500 transition">
              <span className="material-symbols-outlined">tune</span>
            </button>

            {/* avatar */}
            <div className="size-10 rounded-full border-2 border-pink-500/30 p-0.5">
              <img
                className="w-full h-full rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa6-kOZhF7ebF5mujILXAuQxsFPSgnQcE5VMEB-KjqVZHg3zEqXY5QKozYCklySzyRkWmW8mVdWEjRrHPjxQxilJlSReY36WavHmcXwcOZey0kpQStAio_GJbrs2n73Y7A7pmztL-Gny9f8XAcuIoyPUwY36FI4d5fpFeGn6kcRkxSIs101CS-aLarIt77ZZ-cct9ReUGcoggjJB8AovmjASY9Qv9AIn4r7jtjhebm1KH6cSD6eQWrhUObG8V-683jh3Fy4N6yfFD9"
                alt="avatar"
              />
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="px-10 py-8">
        {/* FILTER TABS */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button className="px-6 py-2 rounded-lg bg-secondary hover:bg-secondary/90 text-white text-sm font-bold">
              Sắp tới
            </button>
            <button className="px-6 py-2 text-slate-400 text-sm">
              Đã hoàn thành
            </button>
            <button className="px-6 py-2 text-slate-400 text-sm">Đã hủy</button>
          </div>

          <Link href="/booking">
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/30 rounded-xl text-sm font-bold text-pink-500">
              <span className="material-symbols-outlined text-sm">add</span>
              Đặt lịch mới
            </button>
          </Link>
        </div>

        {/* CLASS LIST */}
        <div className="space-y-4">
          {classes.map((c, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6"
            >
              {/* teacher */}
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={c.avatar}
                  alt={c.teacher}
                  className="size-14 rounded-xl object-cover ring-2 ring-pink-500/20"
                />
                <div>
                  <h4 className="text-slate-100 font-bold">{c.teacher}</h4>
                  <p className="text-pink-400 text-sm">{c.subject}</p>
                </div>
              </div>

              {/* date */}
              <div className="flex items-center gap-8 px-8 border-x border-white/10">
                <div className="flex flex-col items-center">
                  <p className="text-slate-500 text-xs">Ngày</p>
                  <p className="text-white font-bold">{c.date}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-slate-500 text-xs">Giờ</p>
                  <p className="text-white font-bold">{c.time}</p>
                </div>
              </div>

              {/* action */}
              <button
                className={`px-8 py-3 rounded-xl text-sm font-bold ${
                  c.status === "join"
                    ? "bg-secondary hover:bg-secondary/90 text-white"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {c.status === "join" ? "Vào lớp" : "Chờ lớp"}
              </button>
            </div>
          ))}
        </div>

        {/* DATE & TIME PICKER */}
        <div className="mt-12 grid grid-cols-12 gap-8">
          {/* LEFT PANEL - INFO */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-[#161B22]/50 rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 text-sm mb-2">
                <span className="material-symbols-outlined text-pink-500">
                  verified
                </span>
                <span className="text-slate-400">JLPT N1 Certified</span>
              </div>
              <div className="flex items-center gap-3 text-sm mb-2">
                <span className="material-symbols-outlined text-pink-500">
                  schedule
                </span>
                <span className="text-slate-400">Thành viên từ 2021</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-pink-500">
                  language
                </span>
                <span className="text-slate-400">Tiếng Nhật, Tiếng Anh</span>
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
                <h3 className="text-lg font-bold">Chọn ngày học</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">Tháng 10, 2024</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="size-8 rounded-lg border border-white/10 flex items-center justify-center hover:border-pink-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="size-8 rounded-lg border border-white/10 flex items-center justify-center hover:border-pink-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_right
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                  const isSelected = day === selectedDate;
                  return (
                    <Button
                      key={day}
                      variant="ghost"
                      onClick={() => setSelectedDate(day)}
                      className={`h-20 rounded-xl border flex items-start p-2 font-bold transition ${
                        isSelected
                          ? "bg-[#0B0F1A] border-pink-500 shadow-[0_0_15px_rgba(255,92,141,0.4)]"
                          : "bg-[#161B22] border-gray-700 hover:border-pink-500"
                      }`}
                    >
                      {day}
                    </Button>
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
                    <Button
                      key={time}
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => setSelectedTime(time)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition ${
                        disabled
                          ? "opacity-40 cursor-not-allowed bg-[#161B22]/50 border-gray-700"
                          : selected
                            ? "border-pink-500 bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(255,92,141,0.4)]"
                            : "bg-[#161B22] border-gray-700 hover:border-pink-500"
                      }`}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            </section>

            {/* CONFIRM */}
            <div className="flex justify-end pt-4">
              <Button className="px-12 py-4 bg-pink-500 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition shadow-[0_0_30px_rgba(255,92,141,0.4)]">
                Xác nhận đặt lịch
              </Button>
            </div>
          </div>
        </div>

        {/* COURSE RECOMMEND */}
        <div className="mt-12">
          <h3 className="text-slate-100 font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500">
              verified
            </span>
            Gợi ý khóa học cho bạn
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map((course, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-pink-500/40 transition"
              >
                <div className="aspect-video bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                  <span className="material-symbols-outlined text-pink-400 text-4xl">
                    play_circle
                  </span>
                </div>
                <p className="text-xs font-bold text-pink-400 uppercase">
                  {course.tag}
                </p>
                <h5 className="text-white font-bold text-sm">{course.title}</h5>
                <p className="text-slate-500 text-xs mt-1">{course.lessons}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}