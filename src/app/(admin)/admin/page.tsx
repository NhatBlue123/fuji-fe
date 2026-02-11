import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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

const stats = [
  {
    title: "Tổng người dùng",
    value: "12,450",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
    description: "so với tháng trước",
  },
  {
    title: "Khóa học",
    value: "48",
    change: "+3",
    trend: "up" as const,
    icon: BookOpen,
    description: "khóa mới trong tháng",
  },
  {
    title: "Doanh thu",
    value: "₫245.8M",
    change: "+8.2%",
    trend: "up" as const,
    icon: DollarSign,
    description: "so với tháng trước",
  },
  {
    title: "Tỷ lệ hoàn thành",
    value: "67.3%",
    change: "-2.1%",
    trend: "down" as const,
    icon: TrendingUp,
    description: "so với tháng trước",
  },
];

const recentUsers = [
  {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    course: "N5 Cơ bản",
    date: "2 giờ trước",
  },
  {
    name: "Trần Thị B",
    email: "tranthib@email.com",
    course: "N4 Nâng cao",
    date: "3 giờ trước",
  },
  {
    name: "Lê Văn C",
    email: "levanc@email.com",
    course: "N3 Trung cấp",
    date: "5 giờ trước",
  },
  {
    name: "Phạm Thị D",
    email: "phamthid@email.com",
    course: "N5 Cơ bản",
    date: "6 giờ trước",
  },
  {
    name: "Hoàng Văn E",
    email: "hoangvane@email.com",
    course: "N2 Cao cấp",
    date: "8 giờ trước",
  },
];

const popularCourses = [
  { name: "JLPT N5 - Cơ bản", students: 3420, completion: 78 },
  { name: "JLPT N4 - Sơ trung cấp", students: 2180, completion: 65 },
  { name: "JLPT N3 - Trung cấp", students: 1560, completion: 52 },
  { name: "Kanji Master N5-N4", students: 1240, completion: 71 },
  { name: "Kaiwa - Giao tiếp cơ bản", students: 980, completion: 83 },
];

export default function AdminDashboardPage() {
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
              <Button variant="outline" size="sm">
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user, index) => (
                <div key={index}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.name.split(" ").pop()?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {user.course}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {user.date}
                      </p>
                    </div>
                  </div>
                  {index < recentUsers.length - 1 && (
                    <Separator className="mt-4" />
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
