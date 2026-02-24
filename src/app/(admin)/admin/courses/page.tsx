"use client";

import React, { useState, useMemo } from "react";
import { CourseHeader } from "@/components/admin/admin-components/CourseHeader";
import { CourseFilters } from "@/components/admin/admin-components/CourseFilters";
import { CourseCard } from "@/components/admin/admin-components/CourseCard";
import { CreateCourseModal } from "@/components/admin/admin-components/CreateCourseModal";
import {
  useGetAllCoursesQuery,
  useDeleteCourseMutation,
} from "@/store/services/courseApi";
import { Loader2, BookX, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CoursesPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useGetAllCoursesQuery({
    page,
    size: 20,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  const filteredCourses = useMemo(() => {
    if (!data?.content) return [];
    return data.content.filter((course) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "PUBLISHED" && course.isPublished) ||
        (filter === "DRAFT" && !course.isPublished);
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [data, filter, searchQuery]);

  const handleDelete = async (id: number) => {
    try {
      await deleteCourse(id).unwrap();
      toast.success("Xóa khóa học thành công!");
    } catch {
      toast.error("Xóa khóa học thất bại");
    }
  };

  const handleEdit = (id: number) => {
    // TODO: Navigate to course edit page
    console.log("Edit course", id);
  };

  return (
    <div className="space-y-6">
      <CourseHeader
        onCreateCourse={() => setCreateModalOpen(true)}
        totalCourses={data?.totalElements}
      />

      <CourseFilters onTabChange={setFilter} onSearchChange={setSearchQuery} />

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

      {/* Course grid */}
      {!isLoading && !isError && (
        <>
          {filteredCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  isDeleting={isDeleting}
                />
              ))}
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
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.first}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                {data.number + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </>
      )}

      <CreateCourseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
