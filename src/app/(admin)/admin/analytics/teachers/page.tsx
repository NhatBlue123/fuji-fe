"use client";

import React from "react";
import {
  Clock,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
};

const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => (
  <Card className="border-muted/60 shadow-sm transition-shadow hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-4 w-4 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="mt-1 flex items-center text-xs text-muted-foreground">
        {trend === "up" && (
          <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
        )}
        {trend === "down" && (
          <ArrowDownRight className="mr-1 h-3 w-3 text-rose-500" />
        )}
        {description}
      </p>
    </CardContent>
  </Card>
);

const TeacherDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { data: dashboardData, isLoading } = useGetTeacherDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";
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

  const formatBlossom = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phân tích giáo viên</h1>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="students">Học viên xuất sắc</TabsTrigger>
          <TabsTrigger value="courses">Doanh thu khóa học</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-muted/60 shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle>Luồng thu nhập</CardTitle>
                  <CardDescription>Phân tích doanh thu hằng ngày</CardDescription>
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
              <CardContent className="min-h-[350px] min-w-0 pl-2 pt-4 h-[350px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart
                    data={dashboardData?.earningsOverTime || []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
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

            <Card className="border-muted/60 bg-gradient-to-br from-background to-muted/20 shadow-lg">
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
                  <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Số dư khả dụng
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {formatBlossom(dashboardData?.availableBalance || 0)} 🌸
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Đang chờ thanh toán
                    </p>
                    <p className="text-lg font-bold">
                      {formatBlossom(dashboardData?.pendingPayouts || 0)} 🌸
                    </p>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">
                    Đang xử lý
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="h-11 w-full" size="lg">
                  Yêu cầu rút tiền
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

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
                    className="h-9 w-64 rounded-md border border-input pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
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
                            <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
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
                  {(!dashboardData?.topStudents || dashboardData.topStudents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Không có dữ liệu học viên.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData?.courseRevenueList.map((course, idx) => (
              <Card
                key={idx}
                className="group overflow-hidden border-muted/60 shadow-sm transition-colors hover:border-primary/50"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 text-base font-bold">
                      {course.courseTitle}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {course.studentCount} học viên
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Doanh thu
                        </p>
                        <p className="text-xl font-black text-primary">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="flex items-center text-[10px] font-bold text-emerald-500">
                          <ArrowUpRight className="mr-0.5 h-3 w-3" /> 8.2%
                        </p>
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(100, (course.studentCount / 40) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-medium uppercase text-muted-foreground">
                      <span>Độ phổ biến</span>
                      <span>{Math.round((course.studentCount / 40) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!dashboardData?.courseRevenueList ||
              dashboardData.courseRevenueList.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border bg-muted/20 py-12 italic text-muted-foreground">
                Không có dữ liệu khóa học.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
