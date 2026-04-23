"use client";

import React, { useState } from "react";
import {
  Banknote,
  CalendarDays,
  BookOpen,
  GraduationCap,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Wallet,
  Download,
  RefreshCcw,
  DollarSign,
  Users,
  Clock,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useGetRevenueStatsQuery } from "@/store/services/adminRevenueApi";
import { useGetTeacherDashboardQuery } from "@/store/services/teacherApi";

export default function AnalyticsRootPage() {
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Trung tâm Phân tích
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Theo dõi hiệu suất doanh thu và hoạt động giảng dạy trên toàn nền tảng.
          </p>
        </div>
      </div>

      <Tabs defaultValue="admin" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8">
          <TabsTrigger value="admin" className="text-sm font-semibold">Doanh thu Hệ thống</TabsTrigger>
          <TabsTrigger value="teacher" className="text-sm font-semibold">Hiệu suất Giảng viên</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-6">
          <AdminAnalyticsView />
        </TabsContent>

        <TabsContent value="teacher" className="space-y-6">
          <TeacherAnalyticsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- CURRENCY FORMATTER ---
const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// --- ADMIN ANALYTICS VIEW ---
function AdminAnalyticsView() {
  const { data: stats, isLoading, isError, refetch, isFetching } = useGetRevenueStatsQuery();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !stats) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Tổng Doanh thu" 
          value={formatVND(stats.totalRevenue)} 
          description="Toàn bộ doanh thu nền tảng" 
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
          gradient="from-emerald-500/10 to-transparent"
        />
        <StatsCard 
          title="Phí Booking" 
          value={formatVND(stats.totalBookingFeeRevenue)} 
          description="Thu nhập từ đặt lịch" 
          icon={<Wallet className="h-5 w-5 text-blue-500" />}
        />
        <StatsCard 
          title="Bán Khóa học" 
          value={formatVND(stats.totalCourseRevenue)} 
          description="Doanh thu từ học liệu" 
          icon={<BookOpen className="h-5 w-5 text-violet-500" />}
        />
        <StatsCard 
          title="Đang chờ rút" 
          value={formatVND(stats.totalPendingWithdrawalAmount)} 
          description="Số dư đang yêu cầu thanh toán" 
          icon={<Banknote className="h-5 w-5 text-orange-500" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 overflow-hidden border-none shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle>Biểu đồ doanh thu hàng tháng</CardTitle>
            <CardDescription>Xu hướng doanh thu theo từng tháng</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenues}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(m) => `T${m}`} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip 
                    formatter={(val: number | string | undefined) => [formatVND(Number(val ?? 0)), ""]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="bookingFeeRevenue" name="Phí Booking" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="courseRevenue" name="Khóa học" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="withdrawalFeeRevenue" name="Phí rút tiền" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle>Giao dịch gần đây</CardTitle>
            <CardDescription>5 hoạt động mới nhất</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {stats.recentTransactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tx.type === 'WITHDRAWAL' ? '-' : '+'}{formatVND(tx.amount)}
                  </div>
                </div>
              ))}
              {(!stats.recentTransactions || stats.recentTransactions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Chưa có giao dịch nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- TEACHER ANALYTICS VIEW ---
function TeacherAnalyticsView() {
  const { data: stats, isLoading, isError, refetch } = useGetTeacherDashboardQuery();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !stats) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Tổng thu nhập" 
          value={formatVND(stats.lifetimeEarnings)} 
          description="Tất cả thời gian" 
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
        <StatsCard 
          title="Trong tháng" 
          value={formatVND(stats.currentMonthEarnings)} 
          description={`Tăng trưởng: ${stats.monthOverMonthGrowth}%`} 
          highlight={stats.monthOverMonthGrowth >= 0}
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
        />
        <StatsCard 
          title="Giờ giảng dạy" 
          value={`${stats.totalHoursTaught}h`} 
          description="Tổng thời gian dạy" 
          icon={<Clock className="h-5 w-5 text-orange-500" />}
        />
        <StatsCard 
          title="Số buổi học" 
          value={stats.totalSessions.toString()} 
          description="Tổng số session" 
          icon={<Users className="h-5 w-5 text-violet-500" />}
        />
        <StatsCard 
          title="Số dư khả dụng" 
          value={formatVND(stats.availableBalance)} 
          description="Có thể rút về ví" 
          icon={<Wallet className="h-5 w-5 text-emerald-500" />}
        />
        <StatsCard 
          title="Đang xử lý" 
          value={formatVND(stats.pendingPayouts)} 
          description="Chờ chuyển khoản" 
          icon={<RefreshCcw className="h-5 w-5 text-orange-500" />}
        />
        <StatsCard 
          title="Đã rút tiền" 
          value={formatVND(stats.totalWithdrawn)} 
          description="Tổng số tiền đã rút" 
          icon={<Banknote className="h-5 w-5 text-red-500" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle>Thu nhập theo thời gian</CardTitle>
            <CardDescription>Dữ liệu doanh thu gần đây</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.earningsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip formatter={(val: number | string | undefined) => [formatVND(Number(val ?? 0)), "Thu nhập"]} />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle>Học viên nổi bật</CardTitle>
            <CardDescription>Dựa trên chi tiêu và số lượng buổi học</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {stats.topStudents?.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {student.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">{student.studentName}</p>
                    <p className="text-xs text-muted-foreground">{student.bookingCount} buổi học</p>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatVND(student.spentAmount)}
                  </div>
                </div>
              ))}
              {(!stats.topStudents || stats.topStudents.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu học viên</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Khóa học */}
        <Card className="md:col-span-4 border-none shadow-lg">
          <CardHeader className="bg-muted/30">
            <CardTitle>Doanh thu Khóa học</CardTitle>
            <CardDescription>Các khóa học bán chạy thời gian qua</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {stats.courseRevenueList?.slice(0, 5).map((course, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold line-clamp-1">{course.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{course.studentCount} học viên</p>
                  </div>
                  <div className="text-sm font-bold text-violet-600">
                    {formatVND(course.revenue)}
                  </div>
                </div>
              ))}
              {(!stats.courseRevenueList || stats.courseRevenueList.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu khóa học</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatsCard({ title, value, description, icon, gradient, highlight }: any) {
  return (
    <Card className={`overflow-hidden border-none shadow-md transition-all hover:shadow-xl hover:translate-y-[-2px] bg-gradient-to-br ${gradient || 'from-background to-background'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 bg-muted rounded-xl">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {highlight !== undefined && (
             <ArrowUpRight className={`h-3 w-3 ${highlight ? 'text-emerald-500' : 'text-red-500'}`} />
          )}
          <p className="text-xs text-muted-foreground italic">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 h-[400px] bg-muted animate-pulse rounded-2xl" />
        <div className="md:col-span-3 h-[400px] bg-muted animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <Activity className="h-12 w-12 text-destructive opacity-50" />
      <div>
        <h3 className="text-xl font-bold">Lỗi tải dữ liệu</h3>
        <p className="text-muted-foreground">Không thể kết nối với máy chủ thống kê.</p>
      </div>
      <Button onClick={onRetry} variant="outline" className="rounded-full px-8">
        <RefreshCcw className="mr-2 h-4 w-4" /> Thử lại
      </Button>
    </div>
  );
}
