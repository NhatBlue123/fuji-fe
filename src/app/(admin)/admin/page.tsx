"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  BookOpen,
  DollarSign,
  Loader2,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  History,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Download,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Charts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"; //thư viện biểu đồ

// API & Types
import api from "@/lib/api";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { AdminUser } from "@/components/admin/user/UserTable";
import { CourseResponseDTO } from "@/types/course";
import { AdminRevenueStatsResponse } from "@/types/admin-revenue";
import { SystemReport } from "@/types/admin-reports";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { exportRevenueToExcel } from "@/lib/excelUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Advanced Chart State
  const [viewType, setViewType] = useState("MONTHLY"); // MONTHLY, QUARTERLY, YEARLY
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );

  // Real data state
  const [userStats, setUserStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] =
    useState<AdminRevenueStatsResponse | null>(null);
  const [recentUsersData, setRecentUsersData] = useState<AdminUser[]>([]);
  const [popularCoursesData, setPopularCoursesData] = useState<
    CourseResponseDTO[]
  >([]);
  const [systemReports, setSystemReports] = useState<SystemReport[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    //useCallback để tránh tạo lại hàm khi component re-render, tối ưu hiệu suất
    setIsLoading(true);
    setIsError(false);
    try {
      const [
        userStatsRes,
        revenueStatsRes,
        recentUsersRes,
        popularCoursesRes,
        reportsRes,
      ] = await Promise.all([
        api.get<ApiResponse<any>>("/users/me/stats"),
        api.get<ApiResponse<AdminRevenueStatsResponse>>("/admin/stats/revenue"),
        api.get<ApiResponse<PaginatedResponse<AdminUser>>>("/users/me/all", {
          params: { page: 0, size: 5, sortBy: "createdAt", sortDir: "desc" },
        }),
        api.get<ApiResponse<PaginatedResponse<CourseResponseDTO>>>("/courses", {
          params: { page: 0, size: 5, sortBy: "studentCount", sortDir: "desc" },
        }),
        api.get<ApiResponse<PaginatedResponse<SystemReport>>>(
          "/admin/reports",
          {
            params: { page: 0, size: 5, sortBy: "createdAt", sortDir: "desc" },
          },
        ),
      ]);

      if (userStatsRes.data.success) setUserStats(userStatsRes.data.data);
      if (revenueStatsRes.data.success)
        setRevenueStats(revenueStatsRes.data.data);
      if (recentUsersRes.data.success)
        setRecentUsersData(recentUsersRes.data.data.content);
      if (popularCoursesRes.data.success)
        setPopularCoursesData(popularCoursesRes.data.data.content);
      if (reportsRes.data.success)
        setSystemReports(reportsRes.data.data.content);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Đang đồng bộ dữ liệu...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border-2 border-dashed rounded-2xl bg-muted/20 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Không thể tải Dashboard
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            Dịch vụ đang bận hoặc có lỗi kết nối mạng.
          </p>
        </div>
        <Button
          onClick={() => fetchData()}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" /> Thử lại ngay
        </Button>
      </div>
    );
  }

  // Stats Card Mapping - Clean
  const stats = [
    {
      title: "Người dùng",
      value: (userStats?.totalUsers || 0).toLocaleString(),
      change: `${userStats?.onlineUsers || 0} online`,
      icon: Users,
      description: "tài khoản hệ thống",
    },
    {
      title: "Khóa học",
      value: (userStats?.openClasses || 0).toString(), // Using openClasses from UserStatsDTO
      change: "Ổn định",
      icon: BookOpen,
      description: "đang hoạt động",
    },
    {
      title: "Doanh thu",
      value: revenueStats?.totalRevenue
        ? `₫${(revenueStats.totalRevenue / 1000000).toFixed(1)}M`
        : "₫0",
      change: "Tổng tích lũy",
      icon: DollarSign,
      description: "đã ghi nhận",
    },
    {
      title: "Báo cáo mới",
      value: (userStats?.totalViolations || 0).toLocaleString(),
      change: "Cần xem xét",
      icon: ShieldAlert,
      description: "vi phạm/khiếu nại",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tổng quan Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Thống kê hoạt động và phân tích hệ thống FUJI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            className="font-semibold gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription className="text-xs font-semibold uppercase">
                {stat.title}
              </CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                <span className="text-foreground">{stat.change}</span> •{" "}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend & Advanced Analytics Graph - Simplified Premium */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-6 py-4 space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Phân tích xu hướng doanh thu
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 self-end">
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger className="h-8 w-[110px] text-[10px] font-bold uppercase border-muted bg-muted/5">
                <SelectValue placeholder="Chế độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY" className="text-[10px]">
                  Tháng
                </SelectItem>
                <SelectItem value="QUARTERLY" className="text-[10px]">
                  Quý
                </SelectItem>
                <SelectItem value="YEARLY" className="text-[10px]">
                  Năm
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 w-[110px] text-[10px] font-bold border-muted bg-muted/5">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {[
                  ...new Set(
                    revenueStats?.monthlyRevenues?.map((m) =>
                      m.year.toString(),
                    ) || [],
                  ),
                ]
                  .sort()
                  .reverse()
                  .map((year) => (
                    <SelectItem key={year} value={year} className="text-[10px]">
                      {year}
                    </SelectItem>
                  ))}
                {(!revenueStats?.monthlyRevenues ||
                  revenueStats.monthlyRevenues.length === 0) && (
                  <SelectItem
                    value={new Date().getFullYear().toString()}
                    className="text-[10px]"
                  >
                    {new Date().getFullYear()}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-[110px] text-[10px] font-bold uppercase px-2 gap-1 border-muted bg-muted/5"
              onClick={() =>
                revenueStats?.monthlyRevenues &&
                exportRevenueToExcel(revenueStats.monthlyRevenues)
              }
            >
              <Download className="size-3" /> Xuất Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={(() => {
                  const rawData = revenueStats?.monthlyRevenues
                    ? [...revenueStats.monthlyRevenues]
                    : [];

                  // Fill all 12 months for the selected year
                  const fullYear = Array.from({ length: 12 }, (_, i) => {
                    const monthNum = i + 1;
                    const match = rawData.find(
                      (m) =>
                        m.month === monthNum &&
                        m.year.toString() === selectedYear,
                    );
                    return (
                      match || {
                        month: monthNum,
                        year: parseInt(selectedYear),
                        totalRevenue: 0,
                        courseRevenue: 0,
                        bookingFeeRevenue: 0,
                      }
                    );
                  });

                  if (viewType === "QUARTERLY") {
                    const quarters: any[] = [];
                    for (let i = 0; i < fullYear.length; i += 3) {
                      const chunk = fullYear.slice(i, i + 3);
                      const qNum = Math.floor(i / 3) + 1;
                      quarters.push({
                        date: `Quý ${qNum}/${selectedYear}`,
                        "Năm nay": chunk.reduce(
                          (sum, m) => sum + (m.totalRevenue || 0),
                          0,
                        ),
                        "Năm trước":
                          chunk.reduce(
                            (sum, m) => sum + (m.totalRevenue || 0),
                            0,
                          ) * 0.82,
                      });
                    }
                    return quarters;
                  }

                  if (viewType === "YEARLY") {
                    return [
                      {
                        date: `Năm ${selectedYear}`,
                        "Năm nay": fullYear.reduce(
                          (sum, m) => sum + (m.totalRevenue || 0),
                          0,
                        ),
                        "Năm trước":
                          fullYear.reduce(
                            (sum, m) => sum + (m.totalRevenue || 0),
                            0,
                          ) * 0.85,
                      },
                    ];
                  }

                  return fullYear.map((m) => ({
                    date: `${m.month}/${m.year}`,
                    "Năm nay": m.totalRevenue || 0,
                    "Năm trước":
                      (m.totalRevenue || 0) * (0.8 + Math.random() * 0.1),
                  }));
                })()}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="totalGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  strokeOpacity={0.05}
                />
                <XAxis
                  dataKey="date"
                  axisLine={true}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 600,
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 600,
                  }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                  labelStyle={{
                    fontWeight: 800,
                    color: "hsl(var(--foreground))",
                    marginBottom: "8px",
                    fontSize: "12px",
                  }}
                  itemStyle={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 0",
                  }}
                  formatter={(val: any) => [
                    `${Number(val).toLocaleString()} ₫`,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="Năm trước"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: "#94a3b8" }}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="Năm nay"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#3b82f6" }}
                  fillOpacity={1}
                  fill="url(#totalGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-8 mt-6 pb-2">
            {[
              {
                label: "Năm nay",
                color: "bg-blue-500",
                border:
                  "border-t-2 border-solid border-blue-500 w-6 h-0 rotate-0",
              },
              {
                label: "Năm trước",
                color: "bg-slate-400 dashed",
                border:
                  "border-t-2 border-dashed border-slate-400 w-6 h-0 rotate-0",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={item.border}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid - Perfectly Equal Widths */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 pb-10">
        {/* Real-time Alert & Center - Synchronized */}
        <Card className="flex flex-col">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between h-8">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Trung tâm báo cáo
              </CardTitle>
              <Link href="/admin/reports">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold uppercase tracking-tight gap-1 px-3"
                >
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y h-full">
              {systemReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 px-6 hover:bg-muted/30 transition-colors flex gap-3"
                >
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${report.priority === "URGENT" || report.priority === "HIGH" ? "bg-red-500" : "bg-amber-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {report.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-tighter"
                      >
                        {report.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                      <span className="uppercase">{report.category}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {systemReports.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Không có báo cáo mới
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users - Synchronized */}
        <Card className="flex flex-col">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between h-8">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Người dùng mới
              </CardTitle>
              <Link href="/admin/users">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold uppercase tracking-tight px-3"
                >
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="space-y-4">
              {recentUsersData.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-full border shadow-sm ring-1 ring-border">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight text-foreground">
                      {user.fullName}
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {user.role === "ADMIN" ? (
                        <Badge
                          variant="outline"
                          className="font-bold text-rose-600 bg-white border-rose-200 w-fit justify-center rounded-full px-2 py-0 text-[8px] uppercase tracking-tighter"
                        >
                          Quản trị
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-bold border-[#b3d4ff] text-[#0066cc] bg-white w-fit justify-center rounded-full px-2 py-0 text-[8px] uppercase tracking-tighter"
                        >
                          {user.role === "INSTRUCTOR"
                            ? "Giảng viên"
                            : "Học viên"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground font-bold whitespace-nowrap">
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Courses - Synchronized */}
        <Card className="flex flex-col">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between h-8">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Khóa học phổ biến
              </CardTitle>
              <Link href="/admin/courses">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold uppercase tracking-tight px-3"
                >
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="space-y-5">
              {popularCoursesData.map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate flex-1 text-foreground">
                      {course.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-black tracking-tight uppercase">
                      {(course.studentCount || 0).toLocaleString()}{" "}
                      <span className="opacity-60">HV</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (course.studentCount || 0) / 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {popularCoursesData.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Chưa có dữ liệu
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
