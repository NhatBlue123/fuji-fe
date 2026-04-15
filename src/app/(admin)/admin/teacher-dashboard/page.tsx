"use client";

import { Button } from "@/components/ui/button";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const stats = [
  {
    title: "Lịch dạy hôm nay",
    value: "6",
    hint: "+2 so với hôm qua",
    icon: "event",
  },
  {
    title: "Học viên đang theo",
    value: "48",
    hint: "12 học viên mới tuần này",
    icon: "groups",
  },
  {
    title: "Giờ dạy tháng này",
    value: "72h",
    hint: "Đạt 90% mục tiêu",
    icon: "schedule",
  },
  {
    title: "Đánh giá trung bình",
    value: "4.9",
    hint: "124 lượt đánh giá",
    icon: "star",
  },
];

const todayClasses = [
  {
    time: "08:30",
    student: "Nguyễn Minh Anh",
    level: "N3",
    topic: "Kaiwa: Job Interview",
  },
  {
    time: "10:00",
    student: "Trần Quốc Bảo",
    level: "N4",
    topic: "Nghe hiểu JLPT",
  },
  {
    time: "14:00",
    student: "Lê Hoàng Phúc",
    level: "N2",
    topic: "Bunpo nâng cao",
  },
  {
    time: "19:30",
    student: "Phạm Thu Trang",
    level: "N5",
    topic: "Kana + goi y hoc tap",
  },
];

const pendingTasks = [
  "Chấm 8 bài tập viết",
  "Duyệt 3 yêu cầu đổi lịch",
  "Cập nhật tài liệu cho lớp N3",
  "Gửi feedback tuần cho 5 học viên",
];

const revenueTrend = [
  { week: "T1", revenue: 8200000 },
  { week: "T2", revenue: 9400000 },
  { week: "T3", revenue: 10100000 },
  { week: "T4", revenue: 11200000 },
  { week: "T5", revenue: 10600000 },
  { week: "T6", revenue: 12400000 },
];

const classTrend = [
  { week: "T1", filledRate: 74 },
  { week: "T2", filledRate: 77 },
  { week: "T3", filledRate: 81 },
  { week: "T4", filledRate: 79 },
  { week: "T5", filledRate: 84 },
  { week: "T6", filledRate: 88 },
];

const revenueIdeas = [
  "Mở gói học theo cụm 10 buổi để tăng tỉ lệ giữ chân.",
  "Khung giờ tối ưu (19:00 - 21:00) có thể áp dụng phụ phí nhẹ.",
  "Đề xuất combo luyện thi ngắn hạn N3/N2 trước kỳ thi.",
];

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const iconStrongClass =
  "material-symbols-outlined filled text-[20px] leading-none align-middle text-primary";
const iconChipClass =
  "material-symbols-outlined filled text-[18px] leading-none align-middle text-primary";

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Teacher Workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Dashboard giảng viên
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tổng quan lớp học, lịch dạy và hiệu suất cá nhân trong ngày.
        </p>

        <div className="mt-4 flex gap-3">
          <Button className="rounded-xl font-bold">Tạo lớp học</Button>
          <Button variant="outline" className="rounded-xl font-bold">
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                {item.title}
              </p>
              <span className="rounded-lg border border-secondary/30 bg-secondary/20 px-2 py-1">
                <span className={iconChipClass}>{item.icon}</span>
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">{item.value}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {item.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">
              Lịch dạy hôm nay
            </h2>
            <Button
              variant="default"
              className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm hover:brightness-110"
            >
              <span className="material-symbols-outlined mr-1 text-[18px]">
                calendar_month
              </span>
              Xem toàn bộ
            </Button>
          </div>

          <div className="space-y-3">
            {todayClasses.map((cls) => (
              <div
                key={`${cls.time}-${cls.student}`}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-secondary/20 px-3 py-2 text-sm font-black text-foreground">
                    {cls.time}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{cls.student}</p>
                    <p className="text-xs text-muted-foreground">{cls.topic}</p>
                  </div>
                </div>

                <span className="w-fit rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
                  {cls.level}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">
              Việc cần xử lý
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-secondary/35 bg-secondary/20 px-2 py-1 text-xs font-bold text-foreground">
              <span className={iconChipClass}>smart_toy</span>
              AI Agent
            </span>
          </div>

          <ul className="space-y-2">
            {pendingTasks.map((task) => (
              <li
                key={task}
                className="flex items-center gap-3 rounded-lg bg-background/70 px-3 py-2 text-sm text-foreground"
              >
                <span className={iconStrongClass}>check_circle</span>
                {task}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-border/80 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Doanh thu ước tính
            </p>
            <p className="mt-2 text-2xl font-black text-foreground">
              {formatVnd(12800000)}
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              +12% so với tuần trước
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tập trung số liệu tổng quan, chi tiết nằm ở trang báo cáo chuyên
              sâu.
            </p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-black text-foreground">
              Xu hướng doanh thu (VNĐ)
            </h2>
            <p className="text-sm text-muted-foreground">
              Biểu đồ đường 6 tuần gần nhất, chỉ để theo dõi nhịp tăng trưởng.
            </p>
          </div>

          <div className="h-72 min-h-[288px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <LineChart data={revenueTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000000)}tr`}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatVnd(value)
                      : String(value ?? "")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-black text-foreground">
              Tỉ lệ lấp lịch theo tuần
            </h2>
            <p className="text-sm text-muted-foreground">
              Theo dõi mức độ kín lịch để cân đối thời gian và ưu tiên khung giờ
              tốt.
            </p>
          </div>

          <div className="h-72 min-h-[288px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <LineChart data={classTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[60, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? `${value}%`
                      : String(value ?? "")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="filledRate"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-black text-foreground">
          Ý tưởng doanh thu (tổng quan)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Các gợi ý nhanh để tối ưu doanh thu, không đi sâu vận hành chi tiết.
        </p>

        <ul className="mt-4 space-y-2">
          {revenueIdeas.map((idea) => (
            <li
              key={idea}
              className="flex items-start gap-3 rounded-lg bg-background/70 px-3 py-2 text-sm text-foreground"
            >
              <span className={iconStrongClass}>trending_up</span>
              {idea}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
