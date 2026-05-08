"use client";

import React, { useMemo, useState } from "react";
import { Copy, Edit3, Package, Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateSystemPackageMutation,
  useDuplicateSystemPackageMutation,
  useGetAdminPackagesQuery,
  useSetSystemPackageActiveMutation,
  useUpdateSystemPackageMutation,
  type SystemPackage,
  type SystemPackagePayload,
} from "@/store/services/admin/packageAdminApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type CouponDiscountType = "PERCENT" | "FIXED_AMOUNT";

interface PackageForm {
  code: string;
  name: string;
  description: string;
  priceHoa: number;
  durationDays: number;
  active: boolean;
  visible: boolean;
  popular: boolean;
  sortOrder: number;
  aiBasic: number;
  aiDeep: number;
  sensei: number;
  flashcardImages: number;
  couponEnabled: boolean;
  couponDiscountType: CouponDiscountType;
  couponDiscountValue: number;
  couponCount: number;
  couponUses: number;
  couponExpiresDays: number;
}

const emptyForm: PackageForm = {
  code: "",
  name: "",
  description: "",
  priceHoa: 0,
  durationDays: 30,
  active: false,
  visible: true,
  popular: false,
  sortOrder: 0,
  aiBasic: 20,
  aiDeep: 3,
  sensei: 1,
  flashcardImages: 10,
  couponEnabled: false,
  couponDiscountType: "FIXED_AMOUNT",
  couponDiscountValue: 10,
  couponCount: 1,
  couponUses: 1,
  couponExpiresDays: 30,
};

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message || fallback;
  }
  return fallback;
};

const featureValue = (pkg: SystemPackage, key: string) =>
  pkg.features.find((item) => item.featureKey === key)?.quotaAmount ?? 0;

const bookingCouponRule = (pkg: SystemPackage) =>
  pkg.couponRules.find((item) => item.couponScope === "BOOKING");

const couponDiscountLabel = (rule: SystemPackage["couponRules"][number]) =>
  rule.discountType === "PERCENT"
    ? `Giảm ${rule.discountValue}%`
    : `Giảm ${Number(rule.discountValue || 0).toLocaleString()} hoa`;

const toForm = (pkg: SystemPackage): PackageForm => {
  const coupon = bookingCouponRule(pkg);
  const couponDiscountType: CouponDiscountType =
    coupon?.discountType === "PERCENT" ? "PERCENT" : "FIXED_AMOUNT";
  return {
    code: pkg.code,
    name: pkg.name,
    description: pkg.description || "",
    priceHoa: pkg.priceHoa,
    durationDays: pkg.durationDays,
    active: pkg.active,
    visible: pkg.visible,
    popular: pkg.popular,
    sortOrder: pkg.sortOrder,
    aiBasic: featureValue(pkg, "AI_CHAT_BASIC"),
    aiDeep: featureValue(pkg, "AI_CHAT_DEEP"),
    sensei: featureValue(pkg, "AI_SENSEI_SESSION"),
    flashcardImages: featureValue(pkg, "FLASHCARD_IMAGE_OPERATION"),
    couponEnabled: Boolean(coupon),
    couponDiscountType,
    couponDiscountValue: coupon?.discountValue ?? 10,
    couponCount: coupon?.generatedCouponCount ?? 1,
    couponUses: coupon?.usageLimitPerCoupon ?? 1,
    couponExpiresDays: coupon?.expiresAfterDays ?? 30,
  };
};

const toPayload = (form: PackageForm): SystemPackagePayload => ({
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  description: form.description,
  priceHoa: Number(form.priceHoa) || 0,
  durationDays: Number(form.durationDays) || 30,
  active: form.active,
  visible: form.visible,
  popular: form.popular,
  sortOrder: Number(form.sortOrder) || 0,
  features: [
    { featureKey: "AI_CHAT_BASIC", enabled: true, quotaAmount: Number(form.aiBasic) || 0, quotaPeriod: "DAILY", fairUseAmount: (Number(form.aiBasic) || 0) * 2 },
    { featureKey: "AI_CHAT_DEEP", enabled: true, quotaAmount: Number(form.aiDeep) || 0, quotaPeriod: "DAILY", fairUseAmount: (Number(form.aiDeep) || 0) * 2 },
    { featureKey: "AI_SENSEI_SESSION", enabled: true, quotaAmount: Number(form.sensei) || 0, quotaPeriod: "DAILY", fairUseAmount: (Number(form.sensei) || 0) * 2 },
    { featureKey: "FLASHCARD_IMAGE_OPERATION", enabled: true, quotaAmount: Number(form.flashcardImages) || 0, quotaPeriod: "DAILY", fairUseAmount: (Number(form.flashcardImages) || 0) * 2 },
  ],
  couponRules: form.couponEnabled
    ? [{
        couponScope: "BOOKING",
        discountType: form.couponDiscountType,
        discountValue: Number(form.couponDiscountValue) || 0,
        generatedCouponCount: Number(form.couponCount) || 1,
        usageLimitPerCoupon: Number(form.couponUses) || 1,
        usageLimitPerUser: Number(form.couponUses) || 1,
        expiresAfterDays: Number(form.couponExpiresDays) || 30,
        fundedBy: "TEACHER",
        active: true,
      }]
    : [],
});

export default function AdminPackagesPage() {
  const { data: packages = [], isFetching, refetch } = useGetAdminPackagesQuery();
  const [createPackage, { isLoading: isCreating }] = useCreateSystemPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdateSystemPackageMutation();
  const [setActive] = useSetSystemPackageActiveMutation();
  const [duplicatePackage] = useDuplicateSystemPackageMutation();
  const [editing, setEditing] = useState<SystemPackage | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PackageForm>(emptyForm);

  const activeCount = useMemo(() => packages.filter((pkg) => pkg.active).length, [packages]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: packages.length + 1 });
    setOpen(true);
  };

  const openEdit = (pkg: SystemPackage) => {
    setEditing(pkg);
    setForm(toForm(pkg));
    setOpen(true);
  };

  const submit = async () => {
    if (!form.code || !form.name) {
      toast.error("Vui lòng nhập mã và tên gói");
      return;
    }
    if (!editing && form.active && activeCount >= 3) {
      toast.error("Chỉ được mở bán tối đa 3 gói cùng lúc");
      return;
    }
    if (form.couponEnabled) {
      const discountValue = Number(form.couponDiscountValue);
      if (
        form.couponDiscountType === "PERCENT" &&
        (!Number.isFinite(discountValue) || discountValue < 1 || discountValue > 100)
      ) {
        toast.error("Phần trăm giảm phải nằm trong khoảng 1-100");
        return;
      }
      if (
        form.couponDiscountType === "FIXED_AMOUNT" &&
        (!Number.isFinite(discountValue) || discountValue <= 0)
      ) {
        toast.error("Số hoa giảm phải lớn hơn 0");
        return;
      }
    }
    try {
      const payload = toPayload(form);
      if (editing) {
        await updatePackage({ id: editing.id, data: payload }).unwrap();
      } else {
        await createPackage(payload).unwrap();
      }
      toast.success("Đã lưu gói hệ thống");
      setOpen(false);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Không thể lưu gói"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gói hệ thống</h1>
          <p className="text-sm text-muted-foreground">Quản lý quota, tính năng và mã giảm giá sinh ra khi người dùng mua gói.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tạo gói
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Tổng gói</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{packages.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Đang mở bán</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{activeCount}/3</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Gói nổi bật</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{packages.find((pkg) => pkg.popular)?.name || "-"}</CardContent></Card>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gói</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Quota/ngày</TableHead>
              <TableHead>Mã giảm giá</TableHead>
              <TableHead>Đang mở bán</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => {
              const bookingCoupon = bookingCouponRule(pkg);
              return (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="font-semibold">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground">{pkg.code}</div>
                  </TableCell>
                  <TableCell>{pkg.priceHoa.toLocaleString()} hoa / {pkg.durationDays} ngày</TableCell>
                  <TableCell className="text-xs">
                    Trò chuyện {featureValue(pkg, "AI_CHAT_BASIC")} | Suy luận {featureValue(pkg, "AI_CHAT_DEEP")} | Sensei {featureValue(pkg, "AI_SENSEI_SESSION")} | Ảnh {featureValue(pkg, "FLASHCARD_IMAGE_OPERATION")}
                  </TableCell>
                  <TableCell>
                    {bookingCoupon ? (
                      <div className="space-y-1">
                        <Badge>{couponDiscountLabel(bookingCoupon)}</Badge>
                        <div className="text-xs text-muted-foreground">
                          {bookingCoupon.generatedCouponCount} mã · {bookingCoupon.usageLimitPerCoupon} lượt/mã
                        </div>
                      </div>
                    ) : (
                      <Badge variant="secondary">Không</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={pkg.active}
                      disabled={!pkg.active && activeCount >= 3}
                      onCheckedChange={async (active) => {
                        try {
                          await setActive({ id: pkg.id, active }).unwrap();
                        } catch (error: unknown) {
                          toast.error(errorMessage(error, "Không thể đổi trạng thái"));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => duplicatePackage(pkg.id)}><Copy className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> {editing ? "Sửa gói" : "Tạo gói"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Mã gói</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tên gói</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Giá hoa</Label><Input type="number" value={form.priceHoa} onChange={(e) => setForm({ ...form, priceHoa: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Thời hạn (ngày)</Label><Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Trò chuyện AI/ngày</Label><Input type="number" value={form.aiBasic} onChange={(e) => setForm({ ...form, aiBasic: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Suy luận/ngày</Label><Input type="number" value={form.aiDeep} onChange={(e) => setForm({ ...form, aiDeep: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Buổi Sensei/ngày</Label><Input type="number" value={form.sensei} onChange={(e) => setForm({ ...form, sensei: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Ảnh thẻ ghi nhớ/ngày</Label><Input type="number" value={form.flashcardImages} onChange={(e) => setForm({ ...form, flashcardImages: Number(e.target.value) })} /></div>
          </div>
          <div className="grid gap-4 rounded-md border p-4 md:grid-cols-4">
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /> Đang mở bán</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.visible} onCheckedChange={(visible) => setForm({ ...form, visible })} /> Hiển thị</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.popular} onCheckedChange={(popular) => setForm({ ...form, popular })} /> Nổi bật</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.couponEnabled} onCheckedChange={(couponEnabled) => setForm({ ...form, couponEnabled })} /> Tặng mã đặt lịch</label>
          </div>
          {form.couponEnabled && (
            <div className="grid gap-4 md:grid-cols-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Loại giảm</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={form.couponDiscountType === "FIXED_AMOUNT" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, couponDiscountType: "FIXED_AMOUNT" })}
                  >
                    Hoa
                  </Button>
                  <Button
                    type="button"
                    variant={form.couponDiscountType === "PERCENT" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, couponDiscountType: "PERCENT" })}
                  >
                    %
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{form.couponDiscountType === "FIXED_AMOUNT" ? "Giảm hoa" : "Giảm %"}</Label>
                <Input
                  type="number"
                  value={form.couponDiscountValue}
                  onChange={(e) => setForm({ ...form, couponDiscountValue: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2"><Label>Số mã</Label><Input type="number" value={form.couponCount} onChange={(e) => setForm({ ...form, couponCount: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Lượt/mã</Label><Input type="number" value={form.couponUses} onChange={(e) => setForm({ ...form, couponUses: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Hạn ngày</Label><Input type="number" value={form.couponExpiresDays} onChange={(e) => setForm({ ...form, couponExpiresDays: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={submit} disabled={isCreating || isUpdating}><Save className="mr-2 h-4 w-4" /> Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
