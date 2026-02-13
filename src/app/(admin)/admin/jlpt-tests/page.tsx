"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetAllTestsQuery, useDeleteTestMutation, useUpdateTestMutation } from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Plus, Pencil, Trash2, Eye, CheckCircle2, XCircle } from "lucide-react";

export default function AdminJLPTTestsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, error } = useGetAllTestsQuery({
    page,
    size: pageSize,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const [deleteTest] = useDeleteTestMutation();
  const [updateTest] = useUpdateTestMutation();

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Xác nhận xóa đề thi: "${title}"?`)) {
      try {
        await deleteTest(id).unwrap();
        alert("Xóa đề thi thành công!");
      } catch (err) {
        alert("Xóa thất bại!");
        console.error(err);
      }
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await updateTest({
        id,
        data: { isPublished: !currentStatus },
      }).unwrap();
    } catch (err) {
      alert("Cập nhật thất bại!");
      console.error(err);
    }
  };

  const tests = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JLPT Tests</h1>
          <p className="text-muted-foreground">
            Quản lý đề thi JLPT
          </p>
        </div>
        <Link href="/admin/jlpt-tests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo đề thi mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng đề thi</CardDescription>
            <CardTitle className="text-3xl">{data?.totalElements || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đã xuất bản</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {tests.filter(t => t.isPublished).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nháp</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {tests.filter(t => !t.isPublished).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Lỗi tải dữ liệu
            </div>
          )}

          {!isLoading && !error && tests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Chưa có đề thi nào</p>
              <Link href="/admin/jlpt-tests/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo đề thi đầu tiên
                </Button>
              </Link>
            </div>
          )}

          {!isLoading && tests.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead className="w-[120px]">Loại đề</TableHead>
                    <TableHead className="text-center w-[100px]">Câu hỏi</TableHead>
                    <TableHead className="text-center w-[120px]">Trạng thái</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{test.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {test.duration} phút • {test.attemptCount} lượt thi
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{test.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {test.testType.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {test.totalQuestions}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleTogglePublish(test.id, test.isPublished)}
                          className="inline-flex items-center gap-1"
                        >
                          {test.isPublished ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-green-600">Published</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-xs text-orange-600">Draft</span>
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/jlpt-tests/${test.id}/questions`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Quản lý câu hỏi
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/jlpt-tests/${test.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(test.id, test.title)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
