"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CourseHeader } from "@/components/admin/course/CourseHeader";
import { CourseFilters } from "@/components/admin/course/CourseFilters";
import { CreateCourseModal } from "@/components/admin/course/CreateCourseModal";
import { DeleteCourseDialog } from "@/components/admin/course/DeleteCourseDialog";
import {
  useGetAllCoursesQuery,
  useGetCoursesByInstructorQuery,
  useDeleteCourseMutation,
  useUpdateCourseMutation,
} from "@/store/services/courseApi";
import { useIngestCoursesRagMutation } from "@/store/services/admin/aiRagApi";
import {
  Loader2,
  BookX,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Users,
  Clock3,
  FileCheck,
  Eye,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/store/hooks";

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop";

function formatDuration(totalMinutes: number): string {
  if (!totalMinutes) return "0 phút";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} phút`;
  return `${h}h ${m}m`;
}

function formatPrice(price: number): string {
  const hoa = Math.round(Number(price) || 0);
  if (hoa <= 0) return "Miễn phí";
  return `${hoa.toLocaleString("vi-VN")} hoa`;
}

export default function CoursesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "students" | "rating" | "price"
  >("newest");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const PAGE_SIZE = 10;
  const currentUserId = Number(user?.id);

  const canCreate = hasPermission("COURSE_CREATE");
  const canEdit = hasPermission("COURSE_EDIT");
  const canDelete = hasPermission("COURSE_DELETE");
  const canToggleStatus = hasPermission("COURSE_EDIT");

  const allCoursesQuery = useGetAllCoursesQuery(
    {
      page: currentPage - 1,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      sortDir: "desc",
    },
    { skip: !isAdmin },
  );
  const ownCoursesQuery = useGetCoursesByInstructorQuery(
    {
      instructorId: currentUserId,
      page: currentPage - 1,
      size: PAGE_SIZE,
    },
    { skip: isAdmin || !currentUserId },
  );
  const activeCoursesQuery = isAdmin ? allCoursesQuery : ownCoursesQuery;
  const { data, isLoading, isError, refetch } = activeCoursesQuery;

  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [ingestCoursesRag, { isLoading: isResettingRag }] =
    useIngestCoursesRagMutation();

  const filteredCourses = useMemo(() => {
    if (!data?.content) return [];
    const filtered = data.content.filter((course) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "PUBLISHED" && course.isPublished) ||
        (filter === "DRAFT" && !course.isPublished);
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && course.price === 0) ||
        (priceFilter === "paid" && course.price > 0);
      return matchesFilter && matchesSearch && matchesPrice;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "students":
          return b.studentCount - a.studentCount;
        case "rating":
          return b.averageRating - a.averageRating;
        case "price":
          return b.price - a.price;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return sorted;
  }, [data, filter, searchQuery, priceFilter, sortBy]);

  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const paginatedCourses = filteredCourses;

  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, -1, totalPages];
    if (currentPage >= totalPages - 2)
      return [
        1,
        -1,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      -1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      -1,
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const overview = useMemo(() => {
    if (!data?.content?.length) {
      return {
        totalCourses: data?.totalElements ?? 0,
        publishedCount: 0,
        draftCount: 0,
        totalStudents: 0,
        avgDuration: 0,
      };
    }

    const publishedCount = data.content.filter((c) => c.isPublished).length;
    const draftCount = data.content.length - publishedCount;
    const totalStudents = data.content.reduce(
      (sum, c) => sum + c.studentCount,
      0,
    );
    const totalDuration = data.content.reduce(
      (sum, c) => sum + c.totalDuration,
      0,
    );

    return {
      totalCourses: data.totalElements,
      publishedCount,
      draftCount,
      totalStudents,
      avgDuration: Math.round(totalDuration / data.content.length),
    };
  }, [data]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id).unwrap();
      
      // Revalidate ISR pages
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "course", action: "delete" }),
      }).catch(() => {
        // Silent fail - revalidation is not critical
      });
      
      toast.success("Xóa khóa học thành công!");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error("Xóa khóa học thất bại");
    }
  };

  const openDeleteDialog = (id: number, title: string) => {
    setDeleteTarget({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/courses/${id}?edit`);
  };

  const handleTogglePublish = async (
    course: NonNullable<typeof data>["content"][number],
  ) => {
    if (!course.instructor?.id) {
      toast.error("Khóa học chưa có giảng viên, không thể cập nhật trạng thái");
      return;
    }

    try {
      const courseData = {
        title: course.title,
        description: course.description,
        instructorId: course.instructor?.id,
        price: course.price,
        isPublished: !course.isPublished,
      };

      const formData = new FormData();
      formData.append(
        "course",
        new Blob([JSON.stringify(courseData)], { type: "application/json" }),
      );

      await updateCourse({ id: course.id, course: formData }).unwrap();
      
      // Revalidate ISR pages when publishing/unpublishing
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "course", 
          action: course.isPublished ? "unpublish" : "publish",
          id: course.id 
        }),
      }).catch(() => {
        // Silent fail - revalidation is not critical
      });
      
      toast.success(
        course.isPublished ? "Đã chuyển về bản nháp" : "Đã xuất bản khóa học",
      );
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleResetRag = async () => {
    const confirmed = window.confirm(
      "Reset RAG sẽ xóa vector khóa học/gói cũ và ingest lại dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?",
    );
    if (!confirmed) return;

    try {
      const res = await ingestCoursesRag().unwrap();
      toast.success(res?.message || "Đã reset và ingest lại RAG khóa học");
    } catch (e: unknown) {
      const error = e as {
        data?: { error?: { message?: string }; message?: string };
      };
      const message =
        error?.data?.error?.message ||
        error?.data?.message ||
        "Reset RAG thất bại";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <CourseHeader
        onCreateCourse={canCreate ? () => setCreateModalOpen(true) : undefined}
        totalCourses={data?.totalElements}
      />

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetRag}
            disabled={isResettingRag}
          >
            {isResettingRag && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reset RAG Khóa học
          </Button>
          <p className="text-sm text-muted-foreground">
            Đẩy lại courses, lessons và subscription plans hiện tại lên RAG.
          </p>
        </div>
      )}

      {/* Overview cards - neutral palette */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Tổng khóa học</CardDescription>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{overview.totalCourses}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin ? "Toàn bộ trong hệ thống" : "Khóa học của bạn"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Đã xuất bản</CardDescription>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">
              {overview.publishedCount}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.draftCount} bản nháp (trang hiện tại)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Tổng học viên</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">
              {overview.totalStudents.toLocaleString()}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Cộng dồn ở dữ liệu hiện đang tải
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Thời lượng TB</CardDescription>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{overview.avgDuration}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              phút / khóa (trang hiện tại)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Tổng quan trạng thái
          </CardTitle>
          <CardDescription>
            Phân bố xuất bản và bản nháp theo dữ liệu hiện tại
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Đã xuất bản", value: overview.publishedCount },
              { label: "Bản nháp", value: overview.draftCount },
            ].map((item) => {
              const total = Math.max(
                overview.publishedCount + overview.draftCount,
                1,
              );
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-muted-foreground">
                    {item.label}
                  </span>
                  <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm text-muted-foreground">
                    {item.value} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CourseFilters
        onTabChange={(value) => {
          setFilter(value);
          setCurrentPage(1);
        }}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="w-[180px]">
            <Select
              value={priceFilter}
              onValueChange={(v: "all" | "free" | "paid") => {
                setPriceFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức giá</SelectItem>
                <SelectItem value="free">Miễn phí</SelectItem>
                <SelectItem value="paid">Có phí</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[220px]">
            <Select
              value={sortBy}
              onValueChange={(
                v: "newest" | "oldest" | "students" | "rating" | "price",
              ) => {
                setSortBy(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="students">Nhiều học viên</SelectItem>
                <SelectItem value="rating">Đánh giá cao</SelectItem>
                <SelectItem value="price">Giá cao đến thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Hiển thị {paginatedCourses.length} / {filteredCourses.length} khóa học
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="size-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">
            Đang tải danh sách khóa học...
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <p className="font-medium mb-1">Không thể tải dữ liệu</p>
          <p className="text-sm text-muted-foreground mb-4">
            Vui lòng kiểm tra kết nối và thử lại.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      )}

      {/* Course management list */}
      {!isLoading && !isError && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Danh sách khóa học</CardTitle>
            <CardDescription>
              Quản lý nhanh khóa học theo bộ lọc hiện tại
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCourses.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[320px]">Khóa học</TableHead>
                      <TableHead className="min-w-[180px]">
                        Giảng viên
                      </TableHead>
                      <TableHead className="text-right">Giá</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-center min-w-[180px]">
                        Chỉ số
                      </TableHead>
                      <TableHead className="text-center">Đánh giá</TableHead>
                      <TableHead className="text-right min-w-[200px]">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                              <Image
                                src={course.thumbnailUrl || DEFAULT_THUMBNAIL}
                                alt={course.title}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold line-clamp-1">
                                {course.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {course.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarImage
                                src={course.instructor?.avatarUrl || undefined}
                                alt={course.instructor?.fullName}
                              />
                              <AvatarFallback className="text-[10px]">
                                {course.instructor?.fullName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[130px]">
                              {course.instructor?.fullName || "Chưa có"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {formatPrice(course.price)}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant={
                              course.isPublished ? "default" : "secondary"
                            }
                            size="sm"
                            disabled={!canToggleStatus || isUpdating}
                            onClick={() => handleTogglePublish(course)}
                            className="h-7"
                          >
                            {course.isPublished ? "Đã xuất bản" : "Nháp"}
                          </Button>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                            <span>{course.studentCount} HV</span>
                            <span>{course.lessonCount} bài</span>
                            <span>{formatDuration(course.totalDuration)}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {course.ratingCount > 0 ? (
                            <div className="inline-flex items-center gap-1 text-sm">
                              <Star className="size-3.5 fill-amber-400 text-amber-400" />
                              <span>
                                {Number(course.averageRating).toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({course.ratingCount})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Chưa có
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/courses/${course.id}`}>
                                <Eye className="mr-1 size-4" />
                                Chi tiết
                              </Link>
                            </Button>

                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(course.id)}
                              >
                                <Pencil className="mr-1 size-4" />
                                Sửa
                              </Button>
                            )}

                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={() =>
                                  openDeleteDialog(course.id, course.title)
                                }
                              >
                                <Trash2 className="mr-1 size-4" />
                                Xóa
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <BookX className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Không tìm thấy khóa học</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Thử tìm kiếm với từ khóa khác."
                    : 'Nhấn "Tạo khóa học" để bắt đầu.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="pt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {visiblePageNumbers.map((p, idx) => (
                    <PaginationItem key={`${p}-${idx}`}>
                      {p === -1 ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={currentPage === p}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      )}

      <CreateCourseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <DeleteCourseDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTarget(null);
        }}
        courseTitle={deleteTarget?.title}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
