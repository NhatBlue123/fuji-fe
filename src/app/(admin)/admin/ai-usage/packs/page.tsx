"use client";

import React, { useMemo, useState } from "react";
import { Edit3, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type AiPack,
  type AiPackPayload,
  useCreateAiPackMutation,
  useDeleteAiPackMutation,
  useGetAiPacksQuery,
  useUpdateAiPackMutation,
} from "@/store/services/admin/aiQuotaAdminApi";
import { AI_FEATURE_OPTIONS, featureLabel, isEnabled } from "../helpers";

type PackFormState = {
  code: string;
  name: string;
  featureKey: string;
  basicTurns: string;
  deepTurns: string;
  senseiSessions: string;
  priceHoa: string;
  active: boolean;
  sortOrder: string;
};

const emptyForm: PackFormState = {
  code: "",
  name: "",
  featureKey: "AI_CHAT_BASIC",
  basicTurns: "100",
  deepTurns: "10",
  senseiSessions: "0",
  priceHoa: "30",
  active: true,
  sortOrder: "0",
};

const formFromPack = (pack: AiPack): PackFormState => ({
  code: pack.code,
  name: pack.name,
  featureKey: pack.featureKey || "AI_CHAT_BASIC",
  basicTurns: String(pack.basicTurns ?? 0),
  deepTurns: String(pack.deepTurns ?? 0),
  senseiSessions: String(pack.senseiSessions ?? 0),
  priceHoa: String(pack.priceHoa ?? 0),
  active: isEnabled(pack.active),
  sortOrder: String(pack.sortOrder ?? 0),
});

const payloadFromForm = (form: PackFormState): AiPackPayload => ({
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  featureKey: form.featureKey,
  basicTurns: Math.max(0, Number(form.basicTurns) || 0),
  deepTurns: Math.max(0, Number(form.deepTurns) || 0),
  senseiSessions: Math.max(0, Number(form.senseiSessions) || 0),
  priceHoa: Math.max(0, Number(form.priceHoa) || 0),
  active: form.active,
  sortOrder: Number(form.sortOrder) || 0,
});

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: { message?: string }; message?: string } }).data;
    return data?.error?.message || data?.message || fallback;
  }
  return fallback;
};

export default function AiPacksPage() {
  const { data: packs = [], isFetching, isLoading, isError, refetch } = useGetAiPacksQuery();
  const [createPack, { isLoading: isCreating }] = useCreateAiPackMutation();
  const [updatePack, { isLoading: isUpdating }] = useUpdateAiPackMutation();
  const [deletePack, { isLoading: isDeleting }] = useDeleteAiPackMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<AiPack | null>(null);
  const [deletingPack, setDeletingPack] = useState<AiPack | null>(null);
  const [form, setForm] = useState<PackFormState>(emptyForm);
  const isSaving = isCreating || isUpdating;

  const activeCount = useMemo(
    () => packs.filter((pack) => isEnabled(pack.active)).length,
    [packs],
  );

  const openCreateDialog = () => {
    setEditingPack(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (pack: AiPack) => {
    setEditingPack(pack);
    setForm(formFromPack(pack));
    setDialogOpen(true);
  };

  const updateForm = (patch: Partial<PackFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = payloadFromForm(form);
    if (!payload.code || !payload.name) {
      toast.error("Vui lòng nhập mã và tên gói AI.");
      return;
    }

    try {
      if (editingPack) {
        await updatePack({ id: editingPack.id, data: payload }).unwrap();
        toast.success("Đã lưu gói AI");
      } else {
        await createPack(payload).unwrap();
        toast.success("Đã tạo gói AI");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu gói AI."));
    }
  };

  const handleDelete = async () => {
    if (!deletingPack) return;
    try {
      await deletePack(deletingPack.id).unwrap();
      toast.success("Đã xóa gói AI");
      setDeletingPack(null);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xóa gói AI."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gói AI mua thêm</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và chỉnh các gói lượt AI để dịch vụ ví hoa có thể bán theo gói, không trừ từng câu hỏi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo gói
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Không tải được danh sách gói AI. Kiểm tra dịch vụ AI-FUJI hoặc quyền admin.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói AI</CardTitle>
          <CardDescription>
            Đang bật {activeCount.toLocaleString("vi-VN")} / {packs.length.toLocaleString("vi-VN")} gói.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã gói</TableHead>
                <TableHead>Tên gói</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Chat thường</TableHead>
                <TableHead className="text-right">Suy luận</TableHead>
                <TableHead className="text-right">Buổi Sensei</TableHead>
                <TableHead className="text-right">Giá hoa</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Sắp xếp</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {packs.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell className="font-mono text-xs">{pack.code}</TableCell>
                  <TableCell className="font-medium">{pack.name}</TableCell>
                  <TableCell>{featureLabel(pack.featureKey || "")}</TableCell>
                  <TableCell className="text-right">{Number(pack.basicTurns || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right">{Number(pack.deepTurns || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right">{Number(pack.senseiSessions || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right font-semibold">{Number(pack.priceHoa || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>
                    <Badge variant={isEnabled(pack.active) ? "default" : "secondary"}>
                      {isEnabled(pack.active) ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{Number(pack.sortOrder || 0).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(pack)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Sửa
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingPack(pack)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {packs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    {isLoading || isFetching ? "Đang tải gói AI..." : "Chưa có gói AI mua thêm."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPack ? "Sửa gói AI" : "Tạo gói AI"}</DialogTitle>
              <DialogDescription>
                Mỗi gói nên bán theo cụm lượt đủ rõ ràng cho người dùng, ví dụ 100 lượt chat hoặc 10 buổi Sensei.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ai-pack-code">Mã gói</Label>
                <Input
                  id="ai-pack-code"
                  value={form.code}
                  onChange={(event) => updateForm({ code: event.target.value.toUpperCase() })}
                  placeholder="AI_CHAT_S"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-pack-name">Tên gói</Label>
                <Input
                  id="ai-pack-name"
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  placeholder="Gói AI Chat S"
                />
              </div>
              <div className="space-y-2">
                <Label>Loại gói</Label>
                <Select value={form.featureKey} onValueChange={(value) => updateForm({ featureKey: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại gói" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_FEATURE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-pack-price">Giá hoa</Label>
                <Input
                  id="ai-pack-price"
                  min={0}
                  type="number"
                  value={form.priceHoa}
                  onChange={(event) => updateForm({ priceHoa: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-pack-basic">Lượt chat thường</Label>
                <Input
                  id="ai-pack-basic"
                  min={0}
                  type="number"
                  value={form.basicTurns}
                  onChange={(event) => updateForm({ basicTurns: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-pack-deep">Lượt suy luận</Label>
                <Input
                  id="ai-pack-deep"
                  min={0}
                  type="number"
                  value={form.deepTurns}
                  onChange={(event) => updateForm({ deepTurns: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-pack-sensei">Buổi Sensei</Label>
                <Input
                  id="ai-pack-sensei"
                  min={0}
                  type="number"
                  value={form.senseiSessions}
                  onChange={(event) => updateForm({ senseiSessions: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-pack-sort">Thứ tự hiển thị</Label>
                <Input
                  id="ai-pack-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => updateForm({ sortOrder: event.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Trạng thái</Label>
                <p className="text-xs text-muted-foreground">Bật để gói có thể được bán qua luồng mua gói AI.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(checked) => updateForm({ active: checked })} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Đang lưu..." : "Lưu gói"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingPack)} onOpenChange={(open) => !open && setDeletingPack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa gói AI?</AlertDialogTitle>
            <AlertDialogDescription>
              Gói {deletingPack?.name || deletingPack?.code || ""} sẽ bị xóa khỏi danh sách bán. Log sử dụng và số dư đã cấp cho người dùng không bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
