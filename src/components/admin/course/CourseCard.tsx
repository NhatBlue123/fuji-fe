"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Clock,
  BookOpen,
  Star,
  Trash2,
  Pencil,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import type { CourseResponseDTO } from "@/types/course";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface CourseCardProps {
  course: CourseResponseDTO;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  isDeleting?: boolean;
}

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

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onDelete,
  onEdit,
  isDeleting,
}) => {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={course.thumbnailUrl || DEFAULT_THUMBNAIL}
          alt={course.title}
          fill
          sizes="200px"
          className="object-cover"
        />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-1">
              {course.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {course.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/courses/${course.id}`}>
                  <Eye className="size-4 mr-2" />
                  Chi tiết
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(course.id)}>
                  <Pencil className="size-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Xóa khóa học
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Đã xuất bản" : "Bản nháp"}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {formatPrice(course.price)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="size-3.5" />
            <span>{course.studentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            <span>{course.lessonCount} bài</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
          {course.ratingCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
              <span>{Number(course.averageRating).toFixed(1)}</span>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        {/* Instructor */}
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage
              src={course.instructor?.avatarUrl}
              alt={course.instructor?.fullName}
            />
            <AvatarFallback className="text-[10px]">
              {course.instructor?.fullName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            {course.instructor?.fullName || "Chưa có giảng viên"}
          </span>
        </div>

        <Button variant="outline" size="sm" className="w-full mt-3" asChild>
          <Link href={`/admin/courses/${course.id}`}>
            <Eye className="size-4 mr-2" />
            Chi tiết
          </Link>
        </Button>
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khóa học</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khóa học{" "}
              <strong>&quot;{course.title}&quot;</strong>? Tất cả bài học và dữ
              liệu liên quan sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                onDelete?.(course.id);
                setDeleteOpen(false);
              }}
            >
              {isDeleting ? "Đang xóa..." : "Xóa khóa học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
