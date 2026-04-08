"use client";

import React, { useState } from "react";
import {
  Banknote,
  CalendarDays,
  BookOpen,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  Download,
  RefreshCcw,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetRevenueStatsQuery } from "@/store/services/adminRevenueApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

export default function AdminRevenuePage() {
  const {
    data: statsResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetRevenueStatsQuery();
  const [viewMode, setViewMode] = useState<"line" | "bar">("bar");

  const stats = statsResponse;

  const handleRefresh = async () => {
    try {
      await refetch().unwrap();
      toast.success("Dữ liệu đã được cập nhật");
    } catch {
      // RTK Query handles error state
      toast.error("Không thể cập nhật dữ liệu");
    }
  };

  const handleExport = () => {
    toast.info("Tính năng xuất báo cáo đang được phát triển");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Activity className="h-12 w-12 text-destructive opacity-50" />
          <div>
            <h3 className="text-lg font-semibold">Lấy dữ liệu thất bại</h3>
            <p className="text-muted-foreground">
              Đã có lỗi xảy ra khi tải dữ liệu thống kê doanh thu.
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Thống kê Doanh thu
          </h1>
          <p className="text-muted-foreground">
            Hiệu suất tài chính, doanh thu nền tảng và tổng quan thu nhập.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Cập nhật
          </Button>
          <Button onClick={handleExport} size="sm">
            <Download className="mr-2 h-4 w-4" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Doanh thu (All-time)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {(stats.totalIncome || 0).toLocaleString()}đ
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Toàn bộ doanh thu từ trước đến nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Doanh thu 30 ngày qua
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.monthlyIncome || 0).toLocaleString()}đ
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              Biến động gần đây
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Phí nền tảng (Booking)
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.bookingIncome || 0).toLocaleString()}đ
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Phí thu từ các lịch đặt học
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Doanh thu khóa học
            </CardTitle>
            <BookOpen className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.courseIncome || 0).toLocaleString()}đ
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Từ bán khóa học nền tảng
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 xl:grid-cols-7">
        {/* Chart Section */}
        <Card className="col-span-full xl:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Biểu đồ doanh thu</CardTitle>
              <CardDescription>
                Phân bổ doanh thu theo thời gian
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
              <Button
                variant={viewMode === "bar" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setViewMode("bar")}
              >
                Cột
              </Button>
              <Button
                variant={viewMode === "line" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setViewMode("line")}
              >
                Đường
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="h-[350px] w-full min-h-[350px] min-w-0">
              {stats.monthlyIncomeBreakdown &&
              stats.monthlyIncomeBreakdown.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                >
                  {viewMode === "line" ? (
                    <LineChart
                      data={stats.monthlyIncomeBreakdown}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#888888"
                        opacity={0.2}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => [
                          `${Number(value ?? 0).toLocaleString()} đ`,
                          "Doanh thu",
                        ]}
                      />
                      <Legend iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="totalRevenue"
                        name="Tổng thu"
                        stroke="#10b981"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bookingRevenue"
                        name="Phí Booking"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="courseRevenue"
                        name="Khóa học"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={stats.monthlyIncomeBreakdown}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#888888"
                        opacity={0.2}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        formatter={(value) => [
                          `${Number(value ?? 0).toLocaleString()} đ`,
                          "Doanh thu",
                        ]}
                      />
                      <Legend iconType="circle" />
                      <Bar
                        dataKey="bookingRevenue"
                        name="Phí Booking"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                      <Bar
                        dataKey="courseRevenue"
                        name="Khóa học"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Chưa có dữ liệu biểu đồ
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side Metrics & Stats */}
        <div className="col-span-full lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan hệ thống</CardTitle>
              <CardDescription>Thống kê số liệu hoạt động</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" /> Tổng số học viên
                  </div>
                  <span className="font-semibold">
                    {stats.courseStatistics?.totalStudents || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" /> Tổng khóa học
                  </div>
                  <span className="font-semibold">
                    {stats.courseStatistics?.totalCourses || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium mb-3">Thống kê Booking</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.bookingStatistics?.completed || 0}
                    </div>
                    <div className="text-[10px] uppercase text-emerald-600 tracking-wider mt-1 font-semibold">
                      Hoàn thành
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.bookingStatistics?.pending || 0}
                    </div>
                    <div className="text-[10px] uppercase text-orange-600 tracking-wider mt-1 font-semibold">
                      Chờ học
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {stats.bookingStatistics?.cancelled || 0}
                    </div>
                    <div className="text-[10px] uppercase text-red-600 tracking-wider mt-1 font-semibold">
                      Đã Hủy
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-medium mb-3">Tình trạng quỹ</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Đã rút (Giảng viên)
                    </span>
                    <span className="font-medium text-destructive">
                      {(stats.withdrawn || 0).toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Chờ rút tiền</span>
                    <span className="font-medium text-orange-500">
                      {(stats.pendingWithdrawals || 0).toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Số dư hiện tại
                    </span>
                    <span className="font-medium text-primary">
                      {(stats.currentBalance || 0).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <CardDescription>
            Danh sách các phát sinh doanh thu hoặc dòng tiền chi ra mới nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Mã GD</th>
                    <th className="pb-3 font-medium">Loại</th>
                    <th className="pb-3 font-medium">Mô tả</th>
                    <th className="pb-3 font-medium text-right">Số tiền</th>
                    <th className="pb-3 font-medium text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recentTransactions.map((tx: any, idx: number) => (
                    <tr
                      key={tx.id || idx}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 font-medium">#{tx.id}</td>
                      <td className="py-3">
                        {tx.type === "BOOKING_FEE" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 dark:bg-blue-900/30"
                          >
                            Phí Booking
                          </Badge>
                        )}
                        {tx.type === "COURSE_SALE" && (
                          <Badge
                            variant="outline"
                            className="bg-violet-50 text-violet-700 dark:bg-violet-900/30"
                          >
                            Bán Khóa học
                          </Badge>
                        )}
                        {tx.type === "WITHDRAWAL" && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 dark:bg-red-900/30"
                          >
                            Rút tiền
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                        {tx.description || "Giao dịch hệ thống"}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${tx.type === "WITHDRAWAL" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {tx.type === "WITHDRAWAL" ? "-" : "+"}
                        {(tx.amount || 0).toLocaleString()}đ
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                Chưa có giao dịch nào gần đây
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
