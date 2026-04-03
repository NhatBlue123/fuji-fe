"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
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

// API & Types
import api from "@/lib/api";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { AdminUser } from "@/components/admin/user/UserTable";
import { CourseResponseDTO } from "@/types/course";
import { AdminRevenueStatsResponse } from "@/types/admin-revenue";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Real data state
  const [userStats, setUserStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<AdminRevenueStatsResponse | null>(null);
  const [recentUsersData, setRecentUsersData] = useState<AdminUser[]>([]);
  const [popularCoursesData, setPopularCoursesData] = useState<CourseResponseDTO[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [
        userStatsRes,
        revenueStatsRes,
        recentUsersRes,
        popularCoursesRes
      ] = await Promise.all([
        api.get<ApiResponse<any>>("/users/me/stats"),
        api.get<ApiResponse<AdminRevenueStatsResponse>>("/admin/stats/revenue"),
        api.get<ApiResponse<PaginatedResponse<AdminUser>>>("/users/me/all", { 
          params: { page: 0, size: 5, sortBy: "createdAt", sortDir: "desc" } 
        }),
        api.get<ApiResponse<PaginatedResponse<CourseResponseDTO>>>("/courses", {
          params: { page: 0, size: 5, sortBy: "studentCount", sortDir: "desc" }
        })
      ]);

      if (userStatsRes.data.success) setUserStats(userStatsRes.data.data);
      if (revenueStatsRes.data.success) setRevenueStats(revenueStatsRes.data.data);
      if (recentUsersRes.data.success) setRecentUsersData(recentUsersRes.data.data.content);
      if (popularCoursesRes.data.success) setPopularCoursesData(popularCoursesRes.data.data.content);
      
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu FUJI Dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border-2 border-dashed rounded-2xl bg-muted/20">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Tải dữ liệu thất bại</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Đã có lỗi xảy ra khi kết nối tới hệ thống FUJI.</p>
        </div>
        <Button onClick={() => fetchData()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  // Data mapping
  const stats = [
    {
      title: "Tổng người dùng",
      value: (userStats?.totalUsers || 0).toLocaleString(),
      change: "+12.5%", 
      trend: "up" as const,
      icon: Users,
      description: "so với tháng trước",
    },
    {
      title: "Khóa học",
      value: (revenueStats?.courseStatistics?.totalCourses || 0).toString(),
      change: "+3",
      trend: "up" as const,
      icon: BookOpen,
      description: "khóa mới trong tháng",
    },
    {
      title: "Doanh thu",
      value: revenueStats?.monthlyIncome 
        ? (revenueStats.monthlyIncome >= 1000000 
          ? `₫${(revenueStats.monthlyIncome / 1000000).toFixed(1)}M` 
          : `₫${(revenueStats.monthlyIncome / 1000).toFixed(0)}k`)
        : "₫0",
      change: "+8.2%",
      trend: "up" as const,
      icon: DollarSign,
      description: "so với tháng trước",
    },
    {
      title: "Vi phạm hệ thống",
      value: (userStats?.totalViolations || 0).toLocaleString(),
      change: "Cần xử lý",
      trend: "up" as const,
      icon: ShieldAlert,
      description: "lượt vi phạm bảo mật",
    },
  ];


  const popularCourses = popularCoursesData.map(c => ({
    name: c.title,
    students: c.studentCount || 0,
    completion: 75 // Static since no completion rate available in CourseResponseDTO
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan hoạt động hệ thống FUJI
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={
                      stat.trend === "up"
                        ? "text-emerald-500"
                        : "text-destructive"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Users */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Người dùng mới</CardTitle>
                <CardDescription>Danh sách đăng ký gần đây</CardDescription>
              </div>
              <Link href="/admin/users">
                <Button variant="outline" size="sm" className="font-semibold hover:bg-primary/5">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsersData.map((user, index) => (
                <div key={user.id} className="group">
                  <div className="flex items-center gap-4 hover:bg-muted/30 p-2 rounded-xl transition-all duration-300">
                    <Avatar className="size-10 rounded-full border-2 border-background shadow-sm ring-1 ring-border group-hover:scale-105 transition-transform">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-bold leading-none text-foreground group-hover:text-primary transition-colors">
                        {user.fullName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-1">
                        {user.role === 'ADMIN' ? (
                          <Badge variant="outline" className="font-bold text-rose-600 bg-rose-50 border-rose-100 rounded-full px-2 py-0 text-[9px] uppercase">Quản trị</Badge>
                        ) : user.role === 'INSTRUCTOR' ? (
                          <Badge variant="outline" className="font-bold border-blue-100 text-blue-600 bg-blue-50 rounded-full px-2 py-0 text-[9px] uppercase">Giảng viên</Badge>
                        ) : (
                          <Badge variant="outline" className="font-bold border-blue-100 text-blue-600 bg-blue-50 rounded-full px-2 py-0 text-[9px] uppercase">Học viên</Badge>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                  {index < recentUsersData.length - 1 && (
                    <Separator className="mt-2 opacity-50" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Courses */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Khóa học phổ biến</CardTitle>
            <CardDescription>
              Top khóa học có nhiều học viên nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularCourses.map((course, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{course.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {course.students.toLocaleString()} học viên
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${course.completion}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                      {course.completion}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
