"use client";

import { useMemo, useState } from "react";
import {
  useGetBansQuery,
  useGetViolationsQuery,
  useDeleteBanMutation,
  useDeleteAllBansMutation,
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
import { toast } from "sonner";
import { AlertTriangle, Shield } from "lucide-react";

type ChatModerationTab = "violations" | "bans";

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v ?? "-";
  return d.toLocaleString("vi-VN");
}

export default function AdminChatModerationPage() {
  const [tab, setTab] = useState<ChatModerationTab>("violations");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [banPage, setBanPage] = useState(0);

  const violationsQuery = useGetViolationsQuery({ page, size });
  const bansQuery = useGetBansQuery({ page: banPage, size });
  const [deleteBan, deleteBanState] = useDeleteBanMutation();
  const [deleteAllBans, deleteAllBansState] = useDeleteAllBansMutation();

  const violations = violationsQuery.data?.content ?? [];
  const bans = bansQuery.data?.content ?? [];

  const violationTypeBadgeVariant = useMemo(() => {
    return (t: string) => {
      switch (t) {
        case "VIETNAMESE":
        case "ENGLISH":
          return "destructive";
        default:
          return "secondary";
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {tab === "violations" ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Shield className="h-5 w-5" />
        )}
        <h1 className="text-2xl font-bold">Chat Moderation</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ChatModerationTab)}>
        <TabsList>
          <TabsTrigger value="violations">Vi phạm</TabsTrigger>
          <TabsTrigger value="bans">Cấm chat</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="mt-2">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tìm theo userId / nội dung (TODO)"
                  disabled
                  className="md:w-[340px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}/page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violationsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Đang tải…</TableCell>
                  </TableRow>
                )}
                {!violationsQuery.isLoading && violationsQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      Không tải được dữ liệu. Hãy thử lại.
                    </TableCell>
                  </TableRow>
                )}
                {!violationsQuery.isLoading &&
                  !violationsQuery.isError &&
                  violations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>Không có vi phạm.</TableCell>
                    </TableRow>
                  )}

                {violations.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.userId}</TableCell>
                    <TableCell className="max-w-[360px]">
                      <div className="truncate">{v.messageContent}</div>
                    </TableCell>
                    <TableCell>{fmtDate(v.detectedAt ?? null)}</TableCell>
                    <TableCell>
                      <Badge variant={violationTypeBadgeVariant(v.violationType)}>
                        {v.violationType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.ipAddress ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Trang {((violationsQuery.data?.number ?? 0) + 1).toString()} /{" "}
                {(violationsQuery.data?.totalPages ?? 1).toString()} • Tổng{" "}
                {(violationsQuery.data?.totalElements ?? 0).toString()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(violationsQuery.data?.last)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bans" className="mt-2">
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-end p-3 border-b">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteAllBansState.isLoading}
                onClick={async () => {
                  const ok = window.confirm(
                    "Bạn chắc chắn muốn reset toàn bộ cấm chat cho tất cả user?",
                  );
                  if (!ok) return;
                  try {
                    await deleteAllBans().unwrap();
                    toast.success("Đã reset toàn bộ cấm chat");
                  } catch (err: any) {
                    const msg = String(err?.message || "");
                    // Backward-compatible fallback when backend instance has not reloaded new DELETE /admin/bans endpoint.
                    if (msg.includes("not supported")) {
                      try {
                        await Promise.all(
                          bans.map((b) =>
                            deleteBan({ userId: b.userId }).unwrap(),
                          ),
                        );
                        toast.success(
                          "Backend chưa hỗ trợ endpoint reset-all, đã gỡ ban từng user trong danh sách hiện tại.",
                        );
                        return;
                      } catch (fallbackErr: any) {
                        toast.error(
                          fallbackErr?.message || "Fallback gỡ ban từng user thất bại",
                        );
                        return;
                      }
                    }
                    toast.error(msg || "Reset toàn bộ cấm chat thất bại");
                  }
                }}
              >
                {deleteAllBansState.isLoading
                  ? "Đang reset..."
                  : "Reset toàn bộ cấm chat"}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Loại ban</TableHead>
                  <TableHead>Còn đến</TableHead>
                  <TableHead>Số lần vi phạm</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bansQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Đang tải…</TableCell>
                  </TableRow>
                )}
                {!bansQuery.isLoading && bansQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      Không tải được dữ liệu. Hãy thử lại.
                    </TableCell>
                  </TableRow>
                )}
                {!bansQuery.isLoading && !bansQuery.isError && bans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>Không có user bị ban.</TableCell>
                  </TableRow>
                )}

                {bans.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.userId}</TableCell>
                    <TableCell>
                      <Badge variant={b.banType === "PERMANENT" ? "destructive" : "secondary"}>
                        {b.banType}
                      </Badge>
                    </TableCell>
                    <TableCell>{b.banUntil ? fmtDate(b.banUntil) : "-"}</TableCell>
                    <TableCell>{b.violationCount}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(b.updatedAt ?? null)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleteBanState.isLoading}
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            await deleteBan({ userId: b.userId }).unwrap();
                            toast.success("Gỡ ban thành công");
                          } catch (err: any) {
                            toast.error(err?.message || "Gỡ ban thất bại");
                          }
                        }}
                      >
                        Gỡ ban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Trang {((bansQuery.data?.number ?? 0) + 1).toString()} /{" "}
                {(bansQuery.data?.totalPages ?? 1).toString()} • Tổng{" "}
                {(bansQuery.data?.totalElements ?? 0).toString()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={banPage <= 0}
                  onClick={() => setBanPage((p) => Math.max(0, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(bansQuery.data?.last)}
                  onClick={() => setBanPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

