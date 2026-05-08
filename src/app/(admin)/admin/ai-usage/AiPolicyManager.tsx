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
  type AiPolicy,
  type AiPolicyPayload,
  useCreateAiPolicyMutation,
  useDeleteAiPolicyMutation,
  useGetAiPoliciesQuery,
  useUpdateAiPolicyMutation,
} from "@/store/services/admin/aiQuotaAdminApi";
import {
  AI_FEATURE_OPTIONS,
  AI_TIER_OPTIONS,
  featureLabel,
  formatNumber,
  isEnabled,
  tierLabel,
} from "./helpers";

type PolicyFormState = {
  featureKey: string;
  tier: string;
  resetPeriod: string;
  quotaAmount: string;
  fairUseAmount: string;
  active: boolean;
};

type AiPolicyManagerProps = {
  title: string;
  description: string;
  tableTitle: string;
  emptyText: string;
  featureKeys: readonly string[];
  quotaLabel?: string;
};

const resetPeriodOptions = [
  { value: "DAILY", label: "Theo ngày" },
  { value: "MONTHLY", label: "Theo tháng" },
] as const;

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: { message?: string }; message?: string } }).data;
    return data?.error?.message || data?.message || fallback;
  }
  return fallback;
};

const formFromPolicy = (policy: AiPolicy): PolicyFormState => ({
  featureKey: policy.featureKey,
  tier: policy.tier || "BASIC",
  resetPeriod: policy.resetPeriod || "DAILY",
  quotaAmount: String(policy.quotaAmount ?? 0),
  fairUseAmount: policy.fairUseAmount == null ? "" : String(policy.fairUseAmount),
  active: isEnabled(policy.active),
});

const createEmptyForm = (featureKeys: readonly string[]): PolicyFormState => ({
  featureKey: featureKeys[0] || "AI_CHAT_BASIC",
  tier: "BASIC",
  resetPeriod: "DAILY",
  quotaAmount: "0",
  fairUseAmount: "",
  active: true,
});

const payloadFromForm = (form: PolicyFormState): AiPolicyPayload => ({
  featureKey: form.featureKey,
  tier: form.tier,
  resetPeriod: form.resetPeriod,
  quotaAmount: Math.max(0, Number(form.quotaAmount) || 0),
  fairUseAmount: form.fairUseAmount.trim() ? Math.max(0, Number(form.fairUseAmount) || 0) : null,
  active: form.active,
});

export function AiPolicyManager({
  title,
  description,
  tableTitle,
  emptyText,
  featureKeys,
  quotaLabel = "Quota/ngày",
}: AiPolicyManagerProps) {
  const { data: policies = [], isFetching, isLoading, isError, refetch } = useGetAiPoliciesQuery();
  const [createPolicy, { isLoading: isCreating }] = useCreateAiPolicyMutation();
  const [updatePolicy, { isLoading: isUpdating }] = useUpdateAiPolicyMutation();
  const [deletePolicy, { isLoading: isDeleting }] = useDeleteAiPolicyMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AiPolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<AiPolicy | null>(null);
  const [form, setForm] = useState<PolicyFormState>(() => createEmptyForm(featureKeys));
  const isSaving = isCreating || isUpdating;

  const rows = useMemo(
    () => policies.filter((item) => featureKeys.includes(item.featureKey)),
    [featureKeys, policies],
  );

  const updateForm = (patch: Partial<PolicyFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const openCreateDialog = () => {
    setEditingPolicy(null);
    setForm(createEmptyForm(featureKeys));
    setDialogOpen(true);
  };

  const openEditDialog = (policy: AiPolicy) => {
    setEditingPolicy(policy);
    setForm(formFromPolicy(policy));
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = payloadFromForm(form);
    if (!featureKeys.includes(payload.featureKey)) {
      toast.error("Vui lòng chọn đúng loại AI cho trang này.");
      return;
    }

    try {
      if (editingPolicy) {
        await updatePolicy({ id: editingPolicy.id, data: payload }).unwrap();
        toast.success("Đã lưu cấu hình quota AI");
      } else {
        await createPolicy(payload).unwrap();
        toast.success("Đã tạo cấu hình quota AI");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu cấu hình quota AI."));
    }
  };

  const handleDelete = async () => {
    if (!deletingPolicy) return;
    try {
      await deletePolicy(deletingPolicy.id).unwrap();
      toast.success("Đã xóa cấu hình quota AI");
      setDeletingPolicy(null);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xóa cấu hình quota AI."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm cấu hình
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Không tải được cấu hình AI. Kiểm tra dịch vụ AI-FUJI hoặc quyền admin.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tableTitle}</CardTitle>
          <CardDescription>Thêm, sửa hoặc xóa quota theo tính năng và hạng gói.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tính năng</TableHead>
                <TableHead>Hạng gói</TableHead>
                <TableHead>Chu kỳ</TableHead>
                <TableHead className="text-right">{quotaLabel}</TableHead>
                <TableHead className="text-right">Giới hạn hợp lý</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{featureLabel(policy.featureKey)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tierLabel(policy.tier)}</Badge>
                  </TableCell>
                  <TableCell>{policy.resetPeriod || "DAILY"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatNumber(policy.quotaAmount)}</TableCell>
                  <TableCell className="text-right">{formatNumber(policy.fairUseAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={isEnabled(policy.active) ? "default" : "secondary"}>
                      {isEnabled(policy.active) ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(policy)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Sửa
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingPolicy(policy)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    {isLoading || isFetching ? "Đang tải cấu hình..." : emptyText}
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
              <DialogTitle>{editingPolicy ? "Sửa cấu hình quota" : "Thêm cấu hình quota"}</DialogTitle>
              <DialogDescription>Cấu hình áp dụng theo từng tính năng AI và hạng gói người dùng.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tính năng</Label>
                <Select value={form.featureKey} onValueChange={(value) => updateForm({ featureKey: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tính năng" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_FEATURE_OPTIONS.filter((option) => featureKeys.includes(option.value)).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hạng gói</Label>
                <Select value={form.tier} onValueChange={(value) => updateForm({ tier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hạng gói" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_TIER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chu kỳ reset</Label>
                <Select value={form.resetPeriod} onValueChange={(value) => updateForm({ resetPeriod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chu kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    {resetPeriodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-policy-quota">{quotaLabel}</Label>
                <Input
                  id="ai-policy-quota"
                  min={0}
                  type="number"
                  value={form.quotaAmount}
                  onChange={(event) => updateForm({ quotaAmount: event.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ai-policy-fair-use">Giới hạn hợp lý</Label>
                <Input
                  id="ai-policy-fair-use"
                  min={0}
                  type="number"
                  value={form.fairUseAmount}
                  onChange={(event) => updateForm({ fairUseAmount: event.target.value })}
                  placeholder="Để trống nếu không dùng"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Trạng thái</Label>
                <p className="text-xs text-muted-foreground">Tắt cấu hình sẽ làm quota này không còn được áp dụng.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(checked) => updateForm({ active: checked })} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingPolicy)} onOpenChange={(open) => !open && setDeletingPolicy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cấu hình quota?</AlertDialogTitle>
            <AlertDialogDescription>
              Cấu hình {deletingPolicy ? `${featureLabel(deletingPolicy.featureKey)} - ${tierLabel(deletingPolicy.tier)}` : ""}
              {" "}sẽ bị xóa khỏi hệ thống. Thao tác này không xóa log sử dụng đã ghi nhận.
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
