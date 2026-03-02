"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGetAllTestsQuery,
  useGetAllTestsStatsQuery,
  useDeleteTestMutation,
  useUpdateTestMutation,
} from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal, Plus, Pencil, Trash2, Eye,
  CheckCircle2, XCircle, Users, TrendingUp, BarChart3, BookOpen,
} from "lucide-react";

// ─── Level color map ──────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  N1: "bg-red-500", N2: "bg-orange-500", N3: "bg-yellow-500", N4: "bg-blue-500", N5: "bg-green-500",
};

export default function AdminJLPTTestsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Paginated query for table
  const { data, isLoading, error } = useGetAllTestsQuery({
    page, size: pageSize, sortBy: "createdAt", sortDir: "desc",
  });

  // All-tests query for aggregate stats
  const { data: allTests = [] } = useGetAllTestsStatsQuery();

  const [deleteTest] = useDeleteTestMutation();
  const [updateTest] = useUpdateTestMutation();

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!allTests.length) return null;
    const totalAttempts = allTests.reduce((s, t) => s + (t.attemptCount || 0), 0);
    const publishedCount = allTests.filter((t) => t.isPublished).length;
    const draftCount = allTests.length - publishedCount;

    const levelAttempts: Record<string, number> = {};
    const levelCount: Record<string, number> = {};
    allTests.forEach((t) => {
      levelAttempts[t.level] = (levelAttempts[t.level] || 0) + (t.attemptCount || 0);
      levelCount[t.level] = (levelCount[t.level] || 0) + 1;
    });
    const mostPopular = Object.entries(levelAttempts).sort((a, b) => b[1] - a[1])[0];

    return {
      total: allTests.length, totalAttempts, publishedCount, draftCount,
      levelAttempts, levelCount,
      mostPopularLevel: mostPopular?.[0] ?? "—",
      mostPopularLevelAttempts: mostPopular?.[1] ?? 0,
    };
  }, [allTests]);

  const tests = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Xác nhận xóa đề thi: "${title}"?`)) {
      try { await deleteTest(id).unwrap(); alert("Xóa đề thi thành công!"); }
      catch { alert("Xóa thất bại!"); }
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try { await updateTest({ id, data: { isPublished: !currentStatus } }).unwrap(); }
    catch { alert("Cập nhật thất bại!"); }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JLPT Tests</h1>
          <p className="text-muted-foreground">Quản lý đề thi JLPT</p>
        </div>
        <Link href="/admin/jlpt-tests/create">
          <Button><Plus className="mr-2 h-4 w-4" />Tạo đề thi mới</Button>
        </Link>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Tổng đề thi</CardDescription>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats?.total ?? data?.totalElements ?? 0}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.publishedCount ?? 0} đã xuất bản · {stats?.draftCount ?? 0} nháp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Tổng lượt thi</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-blue-600">
              {stats?.totalAttempts.toLocaleString() ?? "—"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Tất cả người dùng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Level phổ biến nhất</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-purple-600">{stats?.mostPopularLevel ?? "—"}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.mostPopularLevelAttempts.toLocaleString() ?? 0} lượt thi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Đề đã xuất bản</CardDescription>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-green-600">{stats?.publishedCount ?? 0}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total ? `${Math.round((stats.publishedCount / stats.total) * 100)}% tổng đề` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Level Distribution Bar Chart ── */}
      {stats && Object.keys(stats.levelAttempts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Lượt thi theo Level</CardTitle>
            <CardDescription>Phân bố lượt thi toàn bộ đề thi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.levelAttempts)
                .sort((a, b) => b[1] - a[1])
                .map(([level, attempts]) => {
                  const pct = stats.totalAttempts > 0
                    ? Math.round((attempts / stats.totalAttempts) * 100) : 0;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-bold text-muted-foreground">{level}</span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${LEVEL_COLORS[level] ?? "bg-slate-500"} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-28 text-right text-muted-foreground">
                        {attempts.toLocaleString()} lượt ({pct}%)
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {stats.levelCount[level]} đề
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Table ── */}
      <Card>
        <CardContent className="pt-6">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Đang tải...</div>}
          {!!error && <div className="text-center py-8 text-destructive">Lỗi tải dữ liệu</div>}
          {!isLoading && !error && tests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Chưa có đề thi nào</p>
              <Link href="/admin/jlpt-tests/create">
                <Button><Plus className="mr-2 h-4 w-4" />Tạo đề thi đầu tiên</Button>
              </Link>
            </div>
          )}

          {!isLoading && tests.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead className="w-[110px]">Loại đề</TableHead>
                    <TableHead className="text-center w-[80px]">Câu hỏi</TableHead>
                    <TableHead className="text-center w-[90px]">Lượt thi</TableHead>
                    <TableHead className="w-[160px]">Tỉ lệ đậu/trượt</TableHead>
                    <TableHead className="text-center w-[110px]">Trạng thái</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => {
                    const attempts = test.attemptCount || 0;
                    const avgScore = test.averageScore || 0;
                    const passScore = test.passScore || 100;
                    const estimatedPassPct = attempts === 0
                      ? 0 : Math.min(100, Math.max(0, Math.round((avgScore / passScore) * 60)));

                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">
                          <div>{test.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {test.duration} phút · điểm đậu: {test.passScore}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-bold text-white border-0 ${LEVEL_COLORS[test.level] ?? "bg-slate-500"}`}
                          >
                            {test.level}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm capitalize">{test.testType.replace("_", " ")}</span>
                        </TableCell>

                        <TableCell className="text-center">{test.totalQuestions}</TableCell>

                        <TableCell className="text-center">
                          <div className="font-semibold text-blue-600">{attempts.toLocaleString()}</div>
                          {avgScore > 0 && (
                            <div className="text-[11px] text-muted-foreground">TB: {avgScore.toFixed(1)}</div>
                          )}
                        </TableCell>

                        <TableCell>
                          {attempts === 0 ? (
                            <span className="text-xs text-muted-foreground">Chưa có lượt thi</span>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${estimatedPassPct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-green-600 font-semibold w-8 text-right">
                                  ~{estimatedPassPct}%
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Ước tính · TB {avgScore > 0 ? avgScore.toFixed(1) : "—"}/{test.passScore}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            onClick={() => handleTogglePublish(test.id, test.isPublished)}
                            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                          >
                            {test.isPublished ? (
                              <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-xs text-green-600 font-medium">Published</span></>
                            ) : (
                              <><XCircle className="h-4 w-4 text-orange-500" /><span className="text-xs text-orange-500 font-medium">Draft</span></>
                            )}
                          </button>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/jlpt-tests/${test.id}/questions`}>
                                  <Eye className="mr-2 h-4 w-4" />Quản lý câu hỏi
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/jlpt-tests/${test.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />Chỉnh sửa
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(test.id, test.title)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
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
