"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Filter,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetTeacherDashboardQuery } from "@/store/services/teacherApi";

// Shadcn UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TeacherDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: dashboardData, isLoading } = useGetTeacherDashboardQuery();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const isDark = theme === "dark";
  const gridColor = isDark
    ? "hsl(var(--muted-foreground) / 0.1)"
    : "hsl(var(--muted-foreground) / 0.05)";
  const textColor = "hsl(var(--muted-foreground))";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Phân tích Giáo viên
          </h1>
          <p className="text-muted-foreground">
            Theo dõi hiệu suất giảng dạy và thu nhập của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            30 ngày qua
          </Button>
          <Button size="sm">Tải báo cáo</Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng thu nhập"
          value={formatCurrency(dashboardData?.lifetimeEarnings || 0)}
          description="Tổng doanh thu đã nhận"
          icon={<Wallet className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Tăng trưởng tháng"
          value={`${dashboardData?.monthOverMonthGrowth || 0}%`}
          description={
            dashboardData?.monthOverMonthGrowth &&
            dashboardData.monthOverMonthGrowth >= 0
              ? "+12% so với tháng trước"
              : "-5% so với tháng trước"
          }
          icon={
            dashboardData?.monthOverMonthGrowth &&
            dashboardData.monthOverMonthGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )
          }
          trend={
            dashboardData?.monthOverMonthGrowth &&
            dashboardData.monthOverMonthGrowth >= 0
              ? "up"
              : "down"
          }
        />
        <StatCard
          title="Tổng giờ dạy"
          value={`${dashboardData?.totalHoursTaught || 0}h`}
          description="Buổi học đã hoàn thành"
          icon={<Clock className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title="Đánh giá TB"
          value={`${dashboardData?.averageRating || 0}/5.0`}
          description="Dựa trên đánh giá học viên"
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
        />
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="students">Học viên xuất sắc</TabsTrigger>
          <TabsTrigger value="courses">Doanh thu khóa học</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Chart */}
            <Card className="lg:col-span-2 shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle>Luồng thu nhập</CardTitle>
                  <CardDescription>
                    Phân tích doanh thu hàng ngày
                  </CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Lọc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="courses">Khóa học</SelectItem>
                    <SelectItem value="sessions">Buổi học</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[350px] pl-2 pt-4 min-h-[350px] min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                >
                  <AreaChart
                    data={dashboardData?.earningsOverTime || []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="primaryGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={gridColor}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: textColor, fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: textColor, fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#primaryGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Wallet Section */}
            <Card className="shadow-lg border-muted/60 bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Số dư ví
                </CardTitle>
                <CardDescription>
                  Rút thu nhập của bạn một cách dễ dàng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Số dư khả dụng
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {formatCurrency(dashboardData?.availableBalance || 0)} 🌸
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Đang chờ thanh toán
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(dashboardData?.pendingPayouts || 0)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">
                    Đang xử lý
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full h-11" size="lg">
                  Yêu cầu rút tiền
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Học viên xuất sắc</CardTitle>
                <CardDescription>
                  Những học viên đã đầu tư nhiều nhất vào các khóa học của bạn.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Tìm học viên..."
                    className="h-9 w-64 rounded-md border border-input pl-8 pr-3 text-sm focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Lượt đặt</TableHead>
                    <TableHead>Tổng chi tiêu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.topStudents.map((student, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {student.studentName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {student.studentName}
                        </div>
                      </TableCell>
                      <TableCell>{student.bookingCount}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(student.spentAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={idx === 0 ? "default" : "secondary"}>
                          {idx === 0 ? "VIP" : "Thường"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!dashboardData?.topStudents ||
                    dashboardData.topStudents.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        Không có dữ liệu học viên.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.courseRevenueList.map((course, idx) => (
              <Card
                key={idx}
                className="overflow-hidden group hover:border-primary/50 transition-colors shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold line-clamp-1">
                      {course.courseTitle}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {course.studentCount} Học viên
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                          Doanh thu
                        </p>
                        <p className="text-xl font-black text-primary">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-emerald-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-0.5" /> 8.2%
                        </p>
                      </div>
                    </div>
                    {/* Progress indicator */}
                    <div className="w-full h-2 bg-muted rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(100, (course.studentCount / 40) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase">
                      <span>Độ phổ biến</span>
                      <span>
                        {Math.round((course.studentCount / 40) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!dashboardData?.courseRevenueList ||
              dashboardData.courseRevenueList.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 border rounded-xl bg-muted/20 text-muted-foreground italic">
                Không có dữ liệu khóa học.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Subcomponent for Stats Card
const StatCard = ({ title, value, description, icon, trend }: any) => (
  <Card className="shadow-sm border-muted/60 hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-4 w-4 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-muted-foreground mt-1 flex items-center">
        {trend === "up" && (
          <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
        )}
        {trend === "down" && (
          <ArrowDownRight className="h-3 w-3 mr-1 text-rose-500" />
        )}
        {description}
      </p>
    </CardContent>
  </Card>
);

export default TeacherDashboard;
