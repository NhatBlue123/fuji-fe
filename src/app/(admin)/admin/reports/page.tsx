"use client";

import { useMemo, useState } from "react";
import {
  useGetSystemReportsQuery,
  useUpdateSystemReportMutation,
  useGetSystemReportNotesQuery,
  useAddSystemReportNoteMutation,
} from "@/store/services/adminReportApi";
import {
  useGetJlptQuestionReportsQuery,
  useUpdateJlptQuestionReportMutation,
} from "@/store/services/adminJlptApi";
import type {
  ReportCategory,
  ReportPriority,
  SystemReport,
  SystemReportStatus,
} from "@/types/admin-reports";
import type { QuestionReport } from "@/types/jlpt-review";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

type ReportTab = "jlpt" | "jlpt_feedback" | "payment" | "course" | "other";

const STATUS_OPTIONS: { value: SystemReportStatus; label: string }[] = [
  { value: "OPEN", label: "Mở" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "REJECTED", label: "Từ chối" },
];

const PRIORITY_OPTIONS: { value: ReportPriority; label: string }[] = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

function fmtDate(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("vi-VN");
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "OPEN":
      return "destructive";
    case "IN_PROGRESS":
    case "IN_REVIEW":
      return "secondary";
    case "RESOLVED":
      return "default";
    case "REJECTED":
      return "outline";
    default:
      return "secondary";
  }
}

function priorityBadgeVariant(priority: string) {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "secondary";
    case "MEDIUM":
      return "default";
    case "LOW":
      return "outline";
    default:
      return "secondary";
  }
}

function TabLabel({ tab }: { tab: ReportTab }) {
  switch (tab) {
    case "jlpt":
      return "JLPT (câu hỏi sai)";
    case "jlpt_feedback":
      return "Phản hồi hệ thống";
    case "payment":
      return "Thanh toán";
    case "course":
      return "Khóa học";
    case "other":
      return "Khác";
  }
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("jlpt");

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SystemReportStatus | undefined>();
  const [priority, setPriority] = useState<ReportPriority | undefined>();
  const [page, setPage] = useState(0);

  // drawer state
  const [open, setOpen] = useState(false);
  const [selectedSystemReport, setSelectedSystemReport] =
    useState<SystemReport | null>(null);
  const [selectedJlptReport, setSelectedJlptReport] =
    useState<QuestionReport | null>(null);

  const systemCategory: ReportCategory | undefined = useMemo(() => {
    if (tab === "jlpt_feedback") return undefined;
    if (tab === "payment") return "PAYMENT";
    if (tab === "course") return "COURSE";
    if (tab === "other") return "OTHER";
    return undefined;
  }, [tab]);
  const systemSubjectType = undefined;

  const shouldLoadSystem = tab !== "jlpt";
  const shouldLoadJlpt = tab === "jlpt";

  const systemQuery = useGetSystemReportsQuery(
    {
      category: systemCategory,
      subjectType: systemSubjectType,
      status,
      priority,
      search: search.trim() || undefined,
      page,
      size: 20,
      sortBy: "createdAt",
      sortDir: "desc",
    },
    { skip: !shouldLoadSystem },
  );

  const jlptStatus = useMemo(() => {
    // JLPT uses IN_REVIEW rather than IN_PROGRESS
    if (!status) return undefined;
    if (status === "IN_PROGRESS") return "IN_REVIEW";
    return status;
  }, [status]);

  const jlptQuery = useGetJlptQuestionReportsQuery(
    { status: jlptStatus as QuestionReport["status"] | undefined, page, size: 20 },
    { skip: !shouldLoadJlpt },
  );

  const [updateSystemReport, updateSystemState] =
    useUpdateSystemReportMutation();
  const [updateJlptReport, updateJlptState] =
    useUpdateJlptQuestionReportMutation();

  const activeSystemReportId = selectedSystemReport?.id;
  const notesQuery = useGetSystemReportNotesQuery(activeSystemReportId ?? 0, {
    skip: !activeSystemReportId,
  });
  const [addNote, addNoteState] = useAddSystemReportNoteMutation();
  const [noteDraft, setNoteDraft] = useState("");

  const isLoading = systemQuery.isLoading || jlptQuery.isLoading;
  const isError = systemQuery.isError || jlptQuery.isError;

  const pageInfo = shouldLoadSystem ? systemQuery.data : jlptQuery.data;
  const rows = shouldLoadSystem ? systemQuery.data?.content : jlptQuery.data?.content;

  const resetForTab = (nextTab: ReportTab) => {
    setTab(nextTab);
    setPage(0);
    setSearch("");
    setStatus(undefined);
    setPriority(undefined);
    setOpen(false);
    setSelectedJlptReport(null);
    setSelectedSystemReport(null);
    setNoteDraft("");
  };

  const openSystem = (r: SystemReport) => {
    setSelectedSystemReport(r);
    setSelectedJlptReport(null);
    setNoteDraft("");
    setOpen(true);
  };

  const openJlpt = (r: QuestionReport) => {
    setSelectedJlptReport(r);
    setSelectedSystemReport(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Quản lý báo cáo và phản hồi</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => resetForTab(v as ReportTab)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="jlpt">
              <TabLabel tab="jlpt" />
            </TabsTrigger>
            <TabsTrigger value="jlpt_feedback">
              <TabLabel tab="jlpt_feedback" />
            </TabsTrigger>
            <TabsTrigger value="payment">
              <TabLabel tab="payment" />
            </TabsTrigger>
            <TabsTrigger value="course">
              <TabLabel tab="course" />
            </TabsTrigger>
            <TabsTrigger value="other">
              <TabLabel tab="other" />
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Tìm theo tiêu đề / mô tả"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="md:w-[340px]"
            />

            <Select
              value={status ?? "ALL"}
              onValueChange={(v) => {
                setPage(0);
                if (v === "ALL") setStatus(undefined);
                else setStatus(v as SystemReportStatus);
              }}
            >
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priority ?? "ALL"}
              onValueChange={(v) => {
                setPage(0);
                if (v === "ALL") setPriority(undefined);
                else setPriority(v as ReportPriority);
              }}
              disabled={tab === "jlpt"}
            >
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả ưu tiên</SelectItem>
                {PRIORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                if (shouldLoadSystem) systemQuery.refetch();
                else jlptQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={tab} className="mt-2">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Tiêu đề</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Phản hồi người dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7}>Đang tải…</TableCell>
                  </TableRow>
                )}
                {!isLoading && isError && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      Không tải được dữ liệu. Hãy thử lại.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && (!rows || rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7}>Không có báo cáo.</TableCell>
                  </TableRow>
                )}

                {shouldLoadSystem &&
                  (rows as SystemReport[] | undefined)?.map((r) => (
                    <TableRow
                      key={`sys-${r.id}`}
                      className="cursor-pointer"
                      onClick={() => openSystem(r)}
                    >
                      <TableCell className="font-medium">
                        {r.title}
                        {r.description ? (
                          <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {r.description}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {r.subjectType || "-"} {r.subjectId ? `#${r.subjectId}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="line-clamp-2 text-sm text-muted-foreground">
                          {r.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityBadgeVariant(r.priority)}>
                          {r.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{fmtDate(r.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSystem(r);
                          }}
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                {shouldLoadJlpt &&
                  (rows as QuestionReport[] | undefined)?.map((r) => (
                    <TableRow
                      key={`jlpt-${r.id}`}
                      className="cursor-pointer"
                      onClick={() => openJlpt(r)}
                    >
                      <TableCell className="font-medium">
                        {r.testTitle}
                        <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {r.questionContent}
                        </div>
                      </TableCell>
                      <TableCell>Question #{r.questionId}</TableCell>
                      <TableCell>
                        <div className="line-clamp-2 text-sm text-muted-foreground">
                          {r.reason || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{fmtDate(r.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openJlpt(r);
                          }}
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Trang {((pageInfo?.number ?? 0) + 1).toString()} /{" "}
                {(pageInfo?.totalPages ?? 1).toString()} • Tổng{" "}
                {(pageInfo?.totalElements ?? 0).toString()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(pageInfo?.last)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setSelectedSystemReport(null);
            setSelectedJlptReport(null);
            setNoteDraft("");
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Chi tiết báo cáo</SheetTitle>
          </SheetHeader>

          {selectedSystemReport ? (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Tiêu đề</div>
                <div className="font-semibold">{selectedSystemReport.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-muted-foreground">Trạng thái</div>
                  <Select
                    value={selectedSystemReport.status}
                    onValueChange={(v) =>
                      setSelectedSystemReport((prev) =>
                        prev ? { ...prev, status: v as SystemReportStatus } : prev,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Ưu tiên</div>
                  <Select
                    value={selectedSystemReport.priority}
                    onValueChange={(v) =>
                      setSelectedSystemReport((prev) =>
                        prev ? { ...prev, priority: v as ReportPriority } : prev,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Mô tả</div>
                <div className="whitespace-pre-wrap text-sm">
                  {selectedSystemReport.description || "-"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Đối tượng</div>
                <div className="text-sm">
                  {selectedSystemReport.subjectType || "-"}{" "}
                  {selectedSystemReport.subjectId
                    ? `#${selectedSystemReport.subjectId}`
                    : ""}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Ghi chú admin</div>
                <Textarea
                  value={selectedSystemReport.adminNote ?? ""}
                  onChange={(e) =>
                    setSelectedSystemReport((prev) =>
                      prev ? { ...prev, adminNote: e.target.value } : prev,
                    )
                  }
                  placeholder="Ghi chú nội bộ…"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const updated = await updateSystemReport({
                        id: selectedSystemReport.id,
                        data: {
                          status: selectedSystemReport.status,
                          priority: selectedSystemReport.priority,
                          adminNote: selectedSystemReport.adminNote ?? "",
                        },
                      }).unwrap();
                      setSelectedSystemReport(updated);
                      toast.success("Đã cập nhật báo cáo");
                    } catch (e: any) {
                      toast.error(e?.message || "Cập nhật thất bại");
                    }
                  }}
                  disabled={updateSystemState.isLoading}
                >
                  Lưu
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Đóng
                </Button>
              </div>

              <div className="rounded-md border p-3">
                <div className="mb-2 font-semibold">Ghi chú (history)</div>
                <div className="space-y-2">
                  {(notesQuery.data ?? []).map((n) => (
                    <div key={n.id} className="rounded-md border p-2 text-sm">
                      <div className="text-muted-foreground">
                        {n.authorName || "System"} • {fmtDate(n.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap">{n.note}</div>
                    </div>
                  ))}
                  {!notesQuery.isLoading &&
                    (notesQuery.data?.length ?? 0) === 0 && (
                      <div className="text-sm text-muted-foreground">
                        Chưa có ghi chú.
                      </div>
                    )}
                </div>

                <div className="mt-3 space-y-2">
                  <Textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Thêm ghi chú…"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!noteDraft.trim()) return;
                      try {
                        await addNote({
                          reportId: selectedSystemReport.id,
                          data: { note: noteDraft.trim() },
                        }).unwrap();
                        setNoteDraft("");
                        toast.success("Đã thêm ghi chú");
                      } catch (e: any) {
                        toast.error(e?.message || "Thêm ghi chú thất bại");
                      }
                    }}
                    disabled={addNoteState.isLoading}
                  >
                    Thêm ghi chú
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {selectedJlptReport ? (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Đề thi</div>
                <div className="font-semibold">{selectedJlptReport.testTitle}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Câu hỏi</div>
                <div className="whitespace-pre-wrap text-sm">
                  {selectedJlptReport.questionContent}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Lý do báo cáo</div>
                <div className="whitespace-pre-wrap text-sm">
                  {selectedJlptReport.reason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-muted-foreground">Trạng thái</div>
                  <Select
                    value={selectedJlptReport.status}
                    onValueChange={(v) =>
                      setSelectedJlptReport((prev) =>
                        prev ? { ...prev, status: v as QuestionReport["status"] } : prev,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">OPEN</SelectItem>
                      <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                      <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                      <SelectItem value="REJECTED">REJECTED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Người báo cáo</div>
                  <div className="text-sm">{selectedJlptReport.reporterName}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Ghi chú admin</div>
                <Textarea
                  value={selectedJlptReport.adminNote ?? ""}
                  onChange={(e) =>
                    setSelectedJlptReport((prev) =>
                      prev ? { ...prev, adminNote: e.target.value } : prev,
                    )
                  }
                  placeholder="Ghi chú nội bộ…"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const updated = await updateJlptReport({
                        id: selectedJlptReport.id,
                        data: {
                          status: selectedJlptReport.status,
                          adminNote: selectedJlptReport.adminNote,
                        },
                      }).unwrap();
                      setSelectedJlptReport(updated);
                      toast.success("Đã cập nhật báo cáo");
                    } catch (e: any) {
                      toast.error(e?.message || "Cập nhật thất bại");
                    }
                  }}
                  disabled={updateJlptState.isLoading}
                >
                  Lưu
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

