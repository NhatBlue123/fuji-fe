"use client";

import React from "react";
import Link from "next/link";
const classes = [
  {
    teacher: "Sakura Sensei",
    subject: "Kaiwa & Pronunciation (N3)",
    date: "Hôm nay, 24 Oct",
    time: "19:30 - 20:30",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9krVS6kNBZafdHAS4ToHczl32IJ-qSiqbG49QjX99eiHVpZPRbpYd_5XKLAL09C589qY-h-RdQNQNkAyXT59O1gXi4fp3f-CUOb-ta_swbMNcrVDyJKLoPRSzunARF23OsGluY6AEOzqFs6Xk-8kzB4Q6iCP_xC_MIJhDA6RD4Auw-UBG9WWMwiUYH1xrm8mxNI-UJfuDICdXchj6gYYN7mL8aI8uWo4l6rVKiJN44t4gZetX6Go6kcpDZhEpump-VP-CWeuGpx0J",
    status: "join",
  },
  {
    teacher: "Tanaka Sensei",
    subject: "Kanji & Grammar Advanced",
    date: "Thứ 6, 26 Oct",
    time: "09:00 - 10:30",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIeLvsgcoa3uitY5ecItviIFtPSFrZgvE0akISdGNn6gGqSMCyDn2EvFGI-Mt6_fL1Z0PhQ5BDQWcSJQC4h4XccTjfoR8JfijfyNFLv8XKoklX1BGnMe7wra29f7_FQuxQx5Ph_A0DPfsVPvn-ucj7pbb-Djx6-dr5vFod8sy_xBbJa00Jk59_UdJNLtXkVUMQov22wet0hRTCTd0T6_B4PJLs1De1GchBsX8w-QMlLbd5v9-OL6-EcTeL-gIr_s8Z1357EnO7fM87",
    status: "waiting",
  },
];

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

export default function MySchedule() {
  return (
    <main className="flex-1 overflow-y-auto bg-[#0f172a] px-6 relative">
      {/* glow background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

      {/* HEADER */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-10 py-6 border-b border-white/10 backdrop-blur-md bg-[#0f172a]/80">
        <div>
          <h2 className="text-slate-100 text-4xl font-black mb-2">
            Lịch học của tôi
          </h2>
          <p className="text-slate-400 text-xl">
            Theo dõi và quản lý các buổi học trực tuyến
          </p>
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
            />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="px-10 py-8">
        {/* FILTER */}
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
      </div>
    </main>
  );
}

/* STAT CARD */

function StatCard({ title, value, extra, icon, highlight }: any) {
  return (
    <div
      className={`rounded-2xl p-6 relative overflow-hidden bg-white/5 border border-white/10 ${
        highlight ? "border-pink-500/30 bg-pink-500/5" : ""
      }`}
    >
      <span className="material-symbols-outlined absolute top-4 right-4 opacity-20 text-5xl">
        {icon}
      </span>

      <p className="text-slate-400 text-sm">{title}</p>

      <div className="flex items-end gap-3 mt-2">
        <span
          className={`text-3xl font-bold ${
            highlight ? "text-pink-500" : "text-white"
          }`}
        >
          {value}
        </span>

        <span className="text-pink-400 text-sm">{extra}</span>
      </div>
    </div>
  );
}