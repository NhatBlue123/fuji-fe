"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetCourseByIdQuery,
  useGetLessonsByCourseQuery,
  useDeleteLessonMutation,
  useDeleteCourseMutation,
  useUpdateCourseMutation,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteCourseDialog } from "@/components/admin/course/DeleteCourseDialog";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
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
  const searchParams = useSearchParams();
  const shouldOpenEdit = searchParams.get("edit") !== null;

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
  const [updateCourse, { isLoading: isUpdatingCourse }] =
    useUpdateCourseMutation();

  const [deleteLessonDialog, setDeleteLessonDialog] = useState<number | null>(
    null,
  );
  const [deleteCourseDialog, setDeleteCourseDialog] = useState(false);
  const [editCourseDialog, setEditCourseDialog] = useState(shouldOpenEdit);

  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string | null>(null);
  const [editJlptLevel, setEditJlptLevel] = useState<string | null>(null);
  const [editPublished, setEditPublished] = useState<boolean | null>(null);

  const openEditCourseDialog = () => {
    if (!course) return;
    setEditTitle(course.title || "");
    setEditDescription(course.description || "");
    setEditPrice(String(course.price ?? 0));
    setEditJlptLevel(course.jlptLevel || "N5");
    setEditPublished(course.isPublished);
    setEditCourseDialog(true);
  };

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

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course?.instructor?.id) {
      toast.error("Khóa học chưa có giảng viên, không thể cập nhật");
      return;
    }

    try {
      const formData = new FormData();
      const courseData = {
        title: (editTitle ?? course.title ?? "").trim(),
        description: (editDescription ?? course.description ?? "").trim(),
        instructorId: course.instructor.id,
        price: Number(editPrice ?? course.price ?? 0) || 0,
        jlptLevel: editJlptLevel ?? course.jlptLevel ?? "N5",
        isPublished: editPublished ?? course.isPublished,
      };

      formData.append(
        "course",
        new Blob([JSON.stringify(courseData)], { type: "application/json" }),
      );

      await updateCourse({ id: courseId, course: formData }).unwrap();
      toast.success("Cập nhật khóa học thành công!");
      setEditCourseDialog(false);
      router.replace(`/admin/courses/${courseId}`);
    } catch {
      toast.error("Cập nhật khóa học thất bại");
    }
  };

  const openEditLesson = (lessonId: number) => {
    router.push(`/admin/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  const openCreateLesson = () => {
    router.push(`/admin/courses/${courseId}/lessons/new`);
  };

  if (courseLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Không tìm thấy khóa học</p>
        <Button variant="outline" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 size-4" />
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            Chi tiết khóa học và quản lý bài học
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openEditCourseDialog}>
            <Pencil className="mr-1 size-4" />
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteCourseDialog(true)}
          >
            <Trash2 className="mr-1 size-4" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Thông tin khóa học</CardTitle>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
              <Badge variant="outline">{formatPrice(course.price)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:w-60">
                <Image
                  src={course.thumbnailUrl || DEFAULT_THUMBNAIL}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Mô tả
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    {course.description || "Chưa có mô tả"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-md border bg-muted/40 px-3 py-2">
                    <p className="font-medium text-foreground">
                      {course.studentCount}
                    </p>
                    Học viên
                  </div>
                  <div className="rounded-md border bg-muted/40 px-3 py-2">
                    <p className="font-medium text-foreground">
                      {course.lessonCount}
                    </p>
                    Bài học
                  </div>
                  <div className="rounded-md border bg-muted/40 px-3 py-2">
                    <p className="font-medium text-foreground">
                      {formatDuration(course.totalDuration)}
                    </p>
                    Thời lượng
                  </div>
                  <div className="rounded-md border bg-muted/40 px-3 py-2">
                    <p className="font-medium text-foreground">
                      {course.ratingCount > 0
                        ? `${Number(course.averageRating).toFixed(1)} / 5`
                        : "Chưa có"}
                    </p>
                    Đánh giá
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tổng quan nhanh</CardTitle>
            <CardDescription>Thông tin cốt lõi của khóa học</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
              <Avatar className="size-8">
                <AvatarImage
                  src={course.instructor?.avatarUrl}
                  alt={course.instructor?.fullName}
                />
                <AvatarFallback>
                  {course.instructor?.fullName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {course.instructor?.fullName || "Chưa có"}
                </p>
                <p className="text-xs text-muted-foreground">Giảng viên</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <div className="mb-1 inline-flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3.5" />
                  <span className="text-xs">Học viên</span>
                </div>
                <p className="text-sm font-semibold">{course.studentCount}</p>
              </div>
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <div className="mb-1 inline-flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  <span className="text-xs">Bài học</span>
                </div>
                <p className="text-sm font-semibold">{course.lessonCount}</p>
              </div>
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <div className="mb-1 inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span className="text-xs">Thời lượng</span>
                </div>
                <p className="text-sm font-semibold">
                  {formatDuration(course.totalDuration)}
                </p>
              </div>
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <div className="mb-1 inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="size-3.5" />
                  <span className="text-xs">Đánh giá</span>
                </div>
                <p className="text-sm font-semibold">
                  {course.ratingCount > 0
                    ? `${Number(course.averageRating).toFixed(1)} / 5`
                    : "Chưa có"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Plus className="mr-2 size-4" />
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
              <BookOpen className="mb-3 size-12 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">
                Chưa có bài học nào
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
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
                  <TableHead className="w-28">Preview</TableHead>
                  <TableHead className="w-28">Thời lượng</TableHead>
                  <TableHead className="w-32">Ngày tạo</TableHead>
                  <TableHead className="w-[200px] text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLessons.map((lesson) => (
                  <TableRow
                    key={lesson.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">
                      {lesson.lessonOrder}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lesson.lessonType === "video" ? (
                          <Video className="size-4 shrink-0 text-blue-500" />
                        ) : (
                          <ClipboardList className="size-4 shrink-0 text-green-500" />
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
                    <TableCell>
                      {lesson.isPreview ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100">
                          Xem thử
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          --
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lesson.duration > 0
                        ? formatDuration(lesson.duration)
                        : "--"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditLesson(lesson.id)}
                        >
                          <Pencil className="mr-1 size-4" />
                          Sửa
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteLessonDialog(lesson.id)}
                        >
                          <Trash2 className="mr-1 size-4" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa bài học"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteCourseDialog
        open={deleteCourseDialog}
        onOpenChange={setDeleteCourseDialog}
        courseTitle={course.title}
        isDeleting={isDeletingCourse}
        onConfirm={handleDeleteCourse}
      />

      <Dialog open={editCourseDialog} onOpenChange={setEditCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
            <DialogDescription>
              Cập nhật nhanh thông tin chính của khóa học.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Tiêu đề</Label>
              <Input
                id="edit-title"
                value={editTitle ?? course.title ?? ""}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={editDescription ?? course.description ?? ""}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Giá (VNĐ)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                value={editPrice ?? String(course.price ?? 0)}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Trình độ JLPT</Label>
              <Select
                value={editJlptLevel ?? course.jlptLevel ?? "N5"}
                onValueChange={setEditJlptLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trình độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N5">N5</SelectItem>
                  <SelectItem value="N4">N4</SelectItem>
                  <SelectItem value="N3">N3</SelectItem>
                  <SelectItem value="N2">N2</SelectItem>
                  <SelectItem value="N1">N1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Xuất bản</p>
                <p className="text-xs text-muted-foreground">
                  Bật để hiển thị cho học viên
                </p>
              </div>
              <Switch
                checked={editPublished ?? course.isPublished}
                onCheckedChange={setEditPublished}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCourseDialog(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isUpdatingCourse}>
                {isUpdatingCourse ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
