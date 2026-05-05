"use client";

import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Loader2,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetTeacherDashboardQuery } from "@/store/services/teacherApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("vi-VN").format(value || 0);

const formatBlossom = (value?: number | null) =>
  `${formatNumber(value)} hoa`;

const formatPercent = (value?: number | null) =>
  `${(value || 0).toFixed(1)}%`;

const formatChartDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

export default function TeacherDashboardPage() {
  const { data, isLoading, isError, isFetching, refetch } =
    useGetTeacherDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <BarChart3 className="size-6 text-destructive" />
        </div>
        <div>
          <p className="font-semibold">Không thể tải dashboard giảng viên</p>
          <p className="text-sm text-muted-foreground">
            Vui lòng thử lại sau khi kiểm tra phiên đăng nhập.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-4" />
          Tải lại
        </Button>
      </div>
    );
  }

  const chartData = data.earningsOverTime ?? [];
  const topStudents = data.topStudents ?? [];
  const courseRevenue = data.courseRevenueList ?? [];

  const stats = [
    {
      title: "Tổng thu nhập",
      value: formatBlossom(data.lifetimeEarnings),
      hint: `Tháng này ${formatBlossom(data.currentMonthEarnings)}`,
      icon: Wallet,
    },
    {
      title: "Buổi đã dạy",
      value: formatNumber(data.totalSessions),
      hint: `${formatNumber(data.totalHoursTaught)} giờ đã ghi nhận`,
      icon: CalendarCheck,
    },
    {
      title: "Thu nhập / giờ",
      value: formatBlossom(data.averageEarningsPerHour),
      hint: `${formatPercent(data.monthOverMonthGrowth)} so với tháng trước`,
      icon: TrendingUp,
    },
    {
      title: "Đánh giá",
      value: `${(data.averageRating || 0).toFixed(1)} / 5`,
      hint: `Hoàn thành ${formatPercent(data.bookingSuccessRate)}`,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard giảng viên
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng quan lịch dạy, doanh thu, ví và hiệu suất của chính bạn.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{item.title}</CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Số dư khả dụng</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle>{formatBlossom(data.availableBalance)}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang chờ rút</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle>{formatBlossom(data.pendingPayouts)}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã rút</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle>{formatBlossom(data.totalWithdrawn)}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu 30 ngày</CardTitle>
            <CardDescription>Thu nhập booking theo ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 min-h-[288px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatChartDate}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(Number(value))}
                    />
                    <Tooltip
                      labelFormatter={(value) => formatChartDate(String(value))}
                      formatter={(value) => formatBlossom(Number(value))}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                  Chưa có dữ liệu doanh thu trong khoảng thời gian này
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiệu suất booking</CardTitle>
            <CardDescription>Tỉ lệ hoàn thành và hủy lịch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hoàn thành</span>
                <Badge variant="secondary">{formatPercent(data.bookingSuccessRate)}</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(data.bookingSuccessRate || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hủy lịch</span>
                <Badge variant="outline">{formatPercent(data.cancellationRate)}</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${Math.min(data.cancellationRate || 0, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Học viên đóng góp cao
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStudents.length > 0 ? (
              <div className="space-y-3">
                {topStudents.map((student) => (
                  <div
                    key={`${student.studentId}-${student.studentName}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(student.bookingCount)} booking
                      </p>
                    </div>
                    <p className="font-semibold">{formatBlossom(student.spentAmount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu học viên
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Doanh thu khóa học
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseRevenue.length > 0 ? (
              <div className="space-y-3">
                {courseRevenue.map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{course.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(course.studentCount)} học viên
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">{formatBlossom(course.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Chưa có doanh thu khóa học
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
