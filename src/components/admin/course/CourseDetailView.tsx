"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useGetCourseByIdQuery,
  useGetLessonsByCourseQuery,
  useDeleteLessonMutation,
  useDeleteCourseMutation,
} from "@/store/services/courseApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users,
  Clock,
  BookOpen,
  Star,
  Video,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

function formatDuration(totalMinutes: number): string {
  if (!totalMinutes) return "0 phút";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} phút`;
  return `${h}h ${m}m`;
}

function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop";

interface CourseDetailViewProps {
  courseId: number;
}

export function CourseDetailView({ courseId }: CourseDetailViewProps) {
  const router = useRouter();
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useGetCourseByIdQuery(courseId);
  const { data: lessons, isLoading: lessonsLoading } =
    useGetLessonsByCourseQuery(courseId);
  const [deleteLesson, { isLoading: isDeletingLesson }] =
    useDeleteLessonMutation();
  const [deleteCourse, { isLoading: isDeletingCourse }] =
    useDeleteCourseMutation();

  // Dialog states
  const [deleteLessonDialog, setDeleteLessonDialog] = useState<number | null>(
    null,
  );
  const [deleteCourseDialog, setDeleteCourseDialog] = useState(false);

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      await deleteLesson({ lessonId, courseId }).unwrap();
      toast.success("Xóa bài học thành công!");
      setDeleteLessonDialog(null);
    } catch {
      toast.error("Xóa bài học thất bại");
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await deleteCourse(courseId).unwrap();
      toast.success("Xóa khóa học thành công!");
      router.push("/admin/courses");
    } catch {
      toast.error("Xóa khóa học thất bại");
    }
  };

  const openEditLesson = (lessonId: number) => {
    router.push(`/admin/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  const openCreateLesson = () => {
    router.push(`/admin/courses/${courseId}/lessons/new`);
  };

  // Loading state
  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Không tìm thấy khóa học</p>
        <Button variant="outline" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="size-4 mr-2" />
            Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  const sortedLessons = lessons
    ? [...lessons].sort((a, b) => a.lessonOrder - b.lessonOrder)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            Chi tiết khóa học và quản lý bài học
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteCourseDialog(true)}
        >
          <Trash2 className="size-4 mr-2" />
          Xóa khóa học
        </Button>
      </div>

      {/* Course Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thumbnail + Description */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Thông tin khóa học</CardTitle>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-muted">
              <Image
                src={course.thumbnailUrl || DEFAULT_THUMBNAIL}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Mô tả
              </h3>
              <p className="text-sm leading-relaxed">
                {course.description || "Chưa có mô tả"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thống kê</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-blue-500/10">
                <Users className="size-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {course.studentCount} học viên
                </p>
                <p className="text-xs text-muted-foreground">Đã ghi danh</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-green-500/10">
                <BookOpen className="size-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {course.lessonCount} bài học
                </p>
                <p className="text-xs text-muted-foreground">Tổng số bài</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-orange-500/10">
                <Clock className="size-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatDuration(course.totalDuration)}
                </p>
                <p className="text-xs text-muted-foreground">Thời lượng</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-yellow-500/10">
                <Star className="size-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {course.ratingCount > 0
                    ? `${Number(course.averageRating).toFixed(1)} / 5`
                    : "Chưa có"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {course.ratingCount} đánh giá
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage
                  src={course.instructor?.avatarUrl}
                  alt={course.instructor?.fullName}
                />
                <AvatarFallback>
                  {course.instructor?.fullName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {course.instructor?.fullName || "Chưa có"}
                </p>
                <p className="text-xs text-muted-foreground">Giảng viên</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">{formatPrice(course.price)}</p>
              <p className="text-xs text-muted-foreground">Giá khóa học</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lessons Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Danh sách bài học</CardTitle>
              <CardDescription>
                {sortedLessons.length} bài học trong khóa học này
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreateLesson}>
              <Plus className="size-4 mr-2" />
              Thêm bài học
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">
                Chưa có bài học nào
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Bấm &quot;Thêm bài học&quot; để tạo bài học đầu tiên
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-28">Loại</TableHead>
                  <TableHead className="w-28">Thời lượng</TableHead>
                  <TableHead className="w-32">Ngày tạo</TableHead>
                  <TableHead className="w-16 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      {lesson.lessonOrder}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lesson.lessonType === "video" ? (
                          <Video className="size-4 text-blue-500 shrink-0" />
                        ) : (
                          <ClipboardList className="size-4 text-green-500 shrink-0" />
                        )}
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lesson.lessonType === "video"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {lesson.lessonType === "video" ? "Video" : "Bài tập"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lesson.duration > 0
                        ? formatDuration(lesson.duration)
                        : "--"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditLesson(lesson.id)}
                          >
                            <Pencil className="size-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteLessonDialog(lesson.id)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Xóa bài học
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Lesson Confirmation */}
      <Dialog
        open={deleteLessonDialog !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteLessonDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bài học</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteLessonDialog(null)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingLesson}
              onClick={() =>
                deleteLessonDialog && handleDeleteLesson(deleteLessonDialog)
              }
            >
              {isDeletingLesson ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa bài học"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation */}
      <Dialog open={deleteCourseDialog} onOpenChange={setDeleteCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khóa học</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khóa học &quot;{course.title}&quot;?
              Toàn bộ bài học và dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteCourseDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingCourse}
              onClick={handleDeleteCourse}
            >
              {isDeletingCourse ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa khóa học"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
