"use client";

import { useMemo, useState } from "react";
import {
  useGetBansQuery,
  useGetViolationsQuery,
  useDeleteBanMutation,
  useDeleteAllBansMutation,
  useDeleteViolationMutation,
  useDeleteAllViolationsMutation,
} from "@/store/services/adminChatModerationApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Shield,
  Users,
  Ban,
  Search,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Volume2,
  Trash,
} from "lucide-react";

type ChatModerationTab = "violations" | "bans";

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v ?? "-";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`rounded-2xl p-3 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ViolationTypeBadge({ type }: { type: string }) {
  const config: Record<string, { variant: string; label: string; icon: React.ElementType }> = {
    VIETNAMESE: { variant: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Tiếng Việt", icon: AlertCircle },
    ENGLISH: { variant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Tiếng Anh", icon: AlertCircle },
  };
  const { variant, label, icon: Icon } = config[type] || {
    variant: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    label: type || "Khác",
    icon: AlertCircle,
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${variant}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function AdminChatModerationPage() {
  const [tab, setTab] = useState<ChatModerationTab>("violations");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [banPage, setBanPage] = useState(0);
  const [selectedViolation, setSelectedViolation] = useState<typeof violations[0] | null>(null);
  const [deleteViolationConfirm, setDeleteViolationConfirm] = useState<typeof violations[0] | null>(null);
  const [deleteAllViolationsConfirm, setDeleteAllViolationsConfirm] = useState(false);
  const [deleteAllBansConfirm, setDeleteAllBansConfirm] = useState(false);

  const violationsQuery = useGetViolationsQuery({ page, size });
  const bansQuery = useGetBansQuery({ page: banPage, size });
  const [deleteBan, deleteBanState] = useDeleteBanMutation();
  const [deleteAllBans, deleteAllBansState] = useDeleteAllBansMutation();
  const [deleteViolation, deleteViolationState] = useDeleteViolationMutation();
  const [deleteAllViolations, deleteAllViolationsState] = useDeleteAllViolationsMutation();

  const violations = violationsQuery.data?.content ?? [];
  const bans = bansQuery.data?.content ?? [];

  // Stats
  const totalViolations = violationsQuery.data?.totalElements ?? 0;
  const totalBans = bansQuery.data?.totalElements ?? 0;
  const permanentBans = bans.filter((b) => b.banType === "PERMANENT").length;
  const tempBans = bans.filter((b) => b.banType === "TEMPORARY").length;

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesKeyword =
        !searchKeyword ||
        v.userId?.toString().includes(searchKeyword) ||
        v.username?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        v.messageContent?.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesType = filterType === "all" || v.violationType === filterType;
      return matchesKeyword && matchesType;
    });
  }, [violations, searchKeyword, filterType]);

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chat Moderation</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý vi phạm chat và cấm người dùng
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Tổng vi phạm"
          value={totalViolations}
          icon={AlertTriangle}
          color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
        />
        <StatCard
          title="Đang bị cấm"
          value={totalBans}
          icon={Ban}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
        <StatCard
          title="Cấm vĩnh viễn"
          value={permanentBans}
          icon={XCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          title="Cấm tạm thời"
          value={tempBans}
          icon={Clock}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as ChatModerationTab)}>
        <div className="mb-4">
          <TabsList className="grid w-full grid-cols-2 gap-1 p-1 lg:w-[400px]">
            <TabsTrigger
              value="violations"
              className="flex items-center gap-2 data-[state=active]:shadow-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              Vi phạm
              {totalViolations > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {totalViolations}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="bans"
              className="flex items-center gap-2 data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4" />
              Cấm chat
              {totalBans > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {totalBans}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm username, user ID, nội dung..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Loại vi phạm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="VIETNAMESE">Tiếng Việt</SelectItem>
                      <SelectItem value="ENGLISH">Tiếng Anh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => violationsQuery.refetch()}
                    disabled={violationsQuery.isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Làm mới
                  </Button>
                  <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s} / trang
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleteAllViolationsState.isLoading || totalViolations === 0}
                    onClick={() => setDeleteAllViolationsConfirm(true)}
                    className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa tất cả
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[180px] font-semibold">Người dùng</TableHead>
                      <TableHead className="font-semibold">Nội dung vi phạm</TableHead>
                      <TableHead className="w-[120px] font-semibold">Loại</TableHead>
                      <TableHead className="w-[160px] font-semibold">Thời gian</TableHead>
                      <TableHead className="w-[100px] font-semibold">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violationsQuery.isLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!violationsQuery.isLoading && violationsQuery.isError && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-rose-500">
                          <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                          Không tải được dữ liệu. Hãy thử lại.
                        </TableCell>
                      </TableRow>
                    )}
                    {!violationsQuery.isLoading && !violationsQuery.isError && filteredViolations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                          Không có vi phạm nào được tìm thấy.
                        </TableCell>
                      </TableRow>
                    )}

                    {filteredViolations.map((v, idx) => (
                      <TableRow
                        key={v.id}
                        className="group transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                              {v.username?.slice(0, 2).toUpperCase() || v.userId?.toString().slice(-2) || "??"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{v.username || `#${v.userId}`}</span>
                              <span className="text-xs text-muted-foreground">ID: {v.userId}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-md truncate text-sm" title={v.messageContent}>
                            {v.messageContent}
                          </p>
                        </TableCell>
                        <TableCell>
                          <ViolationTypeBadge type={v.violationType} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {fmtDate(v.detectedAt ?? null)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedViolation(v)}
                              className="h-8 w-8 p-0"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteViolationConfirm(v)}
                              disabled={deleteViolationState.isLoading}
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              title="Xóa vi phạm"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-sm text-muted-foreground">
                  Trang {((violationsQuery.data?.number ?? 0) + 1)} / {(violationsQuery.data?.totalPages ?? 1)} •{" "}
                  Tổng {violationsQuery.data?.totalElements ?? 0} bản ghi
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 0 || violationsQuery.isLoading}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(violationsQuery.data?.last) || violationsQuery.isLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bans Tab */}
        <TabsContent value="bans" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
                    <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Danh sách cấm chat</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {totalBans} người dùng đang bị cấm
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteAllBansState.isLoading || totalBans === 0}
                  onClick={() => setDeleteAllBansConfirm(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteAllBansState.isLoading ? "Đang reset..." : "Reset toàn bộ"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px] font-semibold">Người dùng</TableHead>
                    <TableHead className="w-[140px] font-semibold">Loại ban</TableHead>
                    <TableHead className="w-[180px] font-semibold">Còn đến</TableHead>
                    <TableHead className="w-[130px] font-semibold">Số lần vi phạm</TableHead>
                    <TableHead className="w-[120px] text-right font-semibold">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bansQuery.isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Đang tải dữ liệu...
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!bansQuery.isLoading && bansQuery.isError && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-rose-500">
                        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                        Không tải được dữ liệu. Hãy thử lại.
                      </TableCell>
                    </TableRow>
                  )}
                  {!bansQuery.isLoading && !bansQuery.isError && bans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                        Không có user nào bị cấm chat.
                      </TableCell>
                    </TableRow>
                  )}

                  {bans.map((b) => (
                    <TableRow key={b.id} className="group transition-colors hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            {b.username?.slice(0, 2).toUpperCase() || b.userId?.toString().slice(-2) || "??"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{b.username || `#${b.userId}`}</span>
                            <span className="text-xs text-muted-foreground">ID: {b.userId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={b.banType === "PERMANENT" ? "destructive" : "secondary"}
                          className="gap-1"
                        >
                          {b.banType === "PERMANENT" ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {b.banType === "PERMANENT" ? "Vĩnh viễn" : "Tạm thời"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {b.banUntil ? fmtDate(b.banUntil) : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          {b.violationCount} lần
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                            disabled={deleteBanState.isLoading}
                            onClick={async () => {
                              try {
                                await deleteBan({ userId: b.userId }).unwrap();
                                toast.success("Đã gỡ ban thành công");
                                bansQuery.refetch();
                              } catch (err: any) {
                                toast.error(err?.message || "Gỡ ban thất bại");
                              }
                            }}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Gỡ ban
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-sm text-muted-foreground">
                  Trang {((bansQuery.data?.number ?? 0) + 1)} / {(bansQuery.data?.totalPages ?? 1)} •{" "}
                  Tổng {bansQuery.data?.totalElements ?? 0} bản ghi
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={banPage <= 0 || bansQuery.isLoading}
                    onClick={() => setBanPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(bansQuery.data?.last) || bansQuery.isLoading}
                    onClick={() => setBanPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Single Violation Dialog */}
      <Dialog open={!!deleteViolationConfirm} onOpenChange={() => setDeleteViolationConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa vi phạm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vi phạm này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {deleteViolationConfirm && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="font-medium">{deleteViolationConfirm.username || `#${deleteViolationConfirm.userId}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nội dung</span>
                <span className="text-sm max-w-[250px] truncate">{deleteViolationConfirm.messageContent}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="px-5" onClick={() => setDeleteViolationConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="px-5"
              disabled={deleteViolationState.isLoading}
              onClick={async () => {
                if (!deleteViolationConfirm) return;
                try {
                  await deleteViolation({ id: deleteViolationConfirm.id }).unwrap();
                  toast.success("Đã xóa vi phạm");
                  violationsQuery.refetch();
                  setDeleteViolationConfirm(null);
                } catch (err: any) {
                  toast.error(err?.message || "Xóa thất bại");
                }
              }}
            >
              {deleteViolationState.isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa vi phạm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Violations Dialog */}
      <Dialog open={deleteAllViolationsConfirm} onOpenChange={setDeleteAllViolationsConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa toàn bộ vi phạm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa toàn bộ {totalViolations} vi phạm? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="px-5" onClick={() => setDeleteAllViolationsConfirm(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="px-5"
              disabled={deleteAllViolationsState.isLoading}
              onClick={async () => {
                try {
                  await deleteAllViolations().unwrap();
                  toast.success("Đã xóa toàn bộ vi phạm");
                  violationsQuery.refetch();
                  setDeleteAllViolationsConfirm(false);
                } catch (err: any) {
                  toast.error(err?.message || "Xóa thất bại");
                }
              }}
            >
              {deleteAllViolationsState.isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                `Xóa ${totalViolations} vi phạm`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset All Bans Dialog */}
      <Dialog open={deleteAllBansConfirm} onOpenChange={setDeleteAllBansConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận reset toàn bộ cấm chat</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gỡ cấm chat cho toàn bộ {totalBans} người dùng? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="px-5" onClick={() => setDeleteAllBansConfirm(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="px-5"
              disabled={deleteAllBansState.isLoading}
              onClick={async () => {
                try {
                  await deleteAllBans().unwrap();
                  toast.success("Đã reset toàn bộ cấm chat");
                  bansQuery.refetch();
                  setDeleteAllBansConfirm(false);
                } catch (err: any) {
                  const msg = String(err?.message || "");
                  if (msg.includes("not supported")) {
                    try {
                      await Promise.all(
                        bans.map((b) =>
                          deleteBan({ userId: b.userId }).unwrap(),
                        ),
                      );
                      toast.success("Đã gỡ ban từng user trong danh sách hiện tại.");
                      bansQuery.refetch();
                      setDeleteAllBansConfirm(false);
                      return;
                    } catch (fallbackErr: any) {
                      toast.error(fallbackErr?.message || "Gỡ ban thất bại");
                      return;
                    }
                  }
                  toast.error(msg || "Reset toàn bộ cấm chat thất bại");
                }
              }}
            >
              {deleteAllBansState.isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang reset...
                </>
              ) : (
                `Gỡ cấm ${totalBans} người dùng`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Violation Detail Dialog */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Chi tiết vi phạm
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về vi phạm của người dùng
            </DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid gap-4 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Username</span>
                  <span className="font-semibold">{selectedViolation.username || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <span className="font-semibold">#{selectedViolation.userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Loại vi phạm</span>
                  <ViolationTypeBadge type={selectedViolation.violationType} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Thời gian</span>
                  <span className="text-sm">{fmtDate(selectedViolation.detectedAt ?? null)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IP Address</span>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {selectedViolation.ipAddress ?? "-"}
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Nội dung vi phạm
                </Label>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm leading-relaxed">{selectedViolation.messageContent}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedViolation(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
