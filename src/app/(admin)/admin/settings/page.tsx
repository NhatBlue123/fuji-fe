"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Package,
  TrendingUp,
  Loader2,
  RefreshCw,
  Star,
  GripVertical,
  CheckCircle2,
  Clock,
  Infinity,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetAdminPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  type AdminSubscriptionPlan,
  type SubscriptionTier,
} from "@/store/services/admin/subscriptionPlanApi";
import {
  useGetAdminUsersQuery,
  useGrantAdminHoaMutation,
  type AdminUserDTO,
} from "@/store/services/adminUserApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TIER_CONFIG: Record<
  SubscriptionTier,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    colorClass: string;
  }
> = {
  BASIC: {
    label: "Basic",
    variant: "outline",
    colorClass: "text-muted-foreground",
  },
  PRO: { label: "Pro", variant: "secondary", colorClass: "text-blue-500" },
  PREMIUM: {
    label: "Premium",
    variant: "default",
    colorClass: "text-amber-500",
  },
};

const formatDuration = (days: number) => {
  if (days >= 36500) return "Vĩnh viễn";
  if (days >= 365) return `${Math.floor(days / 365)} Năm`;
  if (days >= 30) return `${Math.floor(days / 30)} Tháng`;
  return `${days} Ngày`;
};

const formatHoa = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      data?: { message?: string; messageKey?: string };
      message?: string;
    };

    return (
      candidate.data?.message ||
      candidate.data?.messageKey ||
      candidate.message ||
      fallback
    );
  }

  return fallback;
}

export default function PaymentPackages() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHoaGrantOpen, setIsHoaGrantOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<AdminSubscriptionPlan | null>(null);
  const [hoaSearchTerm, setHoaSearchTerm] = useState("");
  const [selectedHoaUser, setSelectedHoaUser] = useState<AdminUserDTO | null>(
    null,
  );
  const [hoaGrantAmount, setHoaGrantAmount] = useState("");
  const [hoaGrantReason, setHoaGrantReason] = useState("");

  const [formData, setFormData] = useState({
    tier: "BASIC" as SubscriptionTier,
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    active: true,
    popular: false,
    sortOrder: 0,
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState("");

  const {
    data: plans = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminPlansQuery();
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();
  const {
    data: hoaUserPage,
    isFetching: isSearchingHoaUsers,
  } = useGetAdminUsersQuery(
    {
      page: 0,
      size: 8,
      sortBy: "createdAt",
      sortDir: "desc",
      keyword: hoaSearchTerm.trim() || undefined,
    },
    { skip: !isHoaGrantOpen },
  );
  const [grantAdminHoa, { isLoading: isGrantingHoa }] =
    useGrantAdminHoaMutation();

  const hoaUsers = hoaUserPage?.content ?? [];

  const handleEdit = (plan: AdminSubscriptionPlan) => {
    setSelectedPlan(plan);
    let parsedFeatures: string[] = [];
    if (Array.isArray(plan.features)) {
      parsedFeatures = plan.features;
    } else if (typeof plan.features === "string") {
      try {
        parsedFeatures = JSON.parse(plan.features);
      } catch {
        parsedFeatures = [plan.features];
      }
    }

    setFormData({
      tier: plan.tier,
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      durationDays: plan.durationDays,
      active: plan.active,
      popular: plan.popular,
      sortOrder: plan.sortOrder,
      features: parsedFeatures,
    });
    setNewFeature("");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setFormData({
      tier: "BASIC",
      name: "",
      description: "",
      price: 0,
      durationDays: 30,
      active: true,
      popular: false,
      sortOrder: plans.length,
      features: [],
    });
    setNewFeature("");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (plan: AdminSubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const resetHoaGrantForm = () => {
    setHoaSearchTerm("");
    setSelectedHoaUser(null);
    setHoaGrantAmount("");
    setHoaGrantReason("");
  };

  const handleHoaGrantOpenChange = (open: boolean) => {
    setIsHoaGrantOpen(open);
    if (!open) {
      resetHoaGrantForm();
    }
  };

  const handleHoaGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHoaUser) {
      toast.error("Chọn user cần cộng hoa");
      return;
    }

    const amountHoa = Number(hoaGrantAmount);
    if (
      !Number.isFinite(amountHoa) ||
      !Number.isInteger(amountHoa) ||
      amountHoa <= 0
    ) {
      toast.error("Số hoa phải là số nguyên lớn hơn 0");
      return;
    }

    try {
      const result = await grantAdminHoa({
        userId: selectedHoaUser.id,
        amountHoa,
        reason: hoaGrantReason.trim() || undefined,
      }).unwrap();

      toast.success(
        `Đã cộng ${formatHoa(result.amountHoa)} hoa cho ${
          result.fullName || result.username
        }. Số dư mới: ${formatHoa(result.balanceAfterHoa)} hoa`,
      );
      setSelectedHoaUser(null);
      setHoaGrantAmount("");
      setHoaSearchTerm("");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Không thể cộng hoa"));
    }
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;
    try {
      await deletePlan(selectedPlan.id).unwrap();
      toast.success(`Đã xóa gói "${selectedPlan.name}" thành công`);
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Không thể xóa gói này"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Vui lòng nhập tên gói");

    try {
      if (selectedPlan) {
        await updatePlan({
          id: selectedPlan.id,
          data: { ...formData, description: formData.description || undefined },
        }).unwrap();
        toast.success(`Đã cập nhật gói "${formData.name}"`);
      } else {
        await createPlan({
          ...formData,
          description: formData.description || undefined,
        }).unwrap();
        toast.success(`Đã tạo gói "${formData.name}" thành công`);
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Thao tác thất bại"));
    }
  };

  const addFeature = () => {
    const f = newFeature.trim();
    if (f && !formData.features.includes(f)) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, f] }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const activePlans = plans.filter((p) => p.active).length;
  const popularPlan = plans.find((p) => p.popular);

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl border bg-card p-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cộng hoa"
          onClick={() => setIsHoaGrantOpen(true)}
          className="absolute right-4 top-4 h-9 w-9 rounded-full border border-primary/20 bg-background/90 text-primary opacity-0 shadow-sm transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="text-lg leading-none">✿</span>
        </Button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          System Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Quản lý Gói Subscription
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cấu hình gói đăng ký môn học và truy cập AI. Dữ liệu realtime từ
          database.
        </p>

        <div className="mt-4 flex gap-3">
          <Button onClick={handleCreate} className="rounded-xl font-bold">
            <Plus className="w-5 h-5 mr-2" /> Thêm gói mới
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            disabled={isFetching}
            className="rounded-xl font-bold"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Tổng gói đăng ký
            </p>
            <span className="rounded-lg border border-secondary/30 bg-secondary/20 px-2 py-1">
              <Package className="text-primary" size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">{plans.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm ">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Gói phổ biến nhất
            </p>
            <span className="rounded-lg border border-secondary/30 bg-secondary/20 px-2 py-1">
              <TrendingUp className="text-primary" size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {popularPlan?.name || "Chưa đặt"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Đang hoạt động
            </p>
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2 py-1">
              <CheckCircle2 className="text-emerald-500" size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {activePlans}{" "}
            <span className="text-lg text-muted-foreground font-medium">
              / {plans.length}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground font-medium text-sm">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center">
              <Package className="text-muted-foreground" size={40} />
            </div>
            <p className="text-muted-foreground font-bold">Chưa có gói nào</p>
            <Button onClick={handleCreate} className="mt-2 rounded-xl">
              <Plus className="w-5 h-5 mr-2" /> Tạo gói ngay
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Tier</TableHead>
                <TableHead>Tên gói</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Tính năng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...plans]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((plan) => {
                  const tierCfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.BASIC;
                  return (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <Badge variant={tierCfg.variant}>{tierCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{plan.name}</span>
                          {plan.popular && (
                            <Badge
                              variant="default"
                              className="text-[10px] uppercase"
                            >
                              Hot
                            </Badge>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {plan.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.price === 0 ? (
                          <span className="font-bold text-emerald-600">
                            Miễn phí
                          </span>
                        ) : (
                          <span className="font-bold text-primary">
                            {plan.price.toLocaleString()}đ
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          {plan.durationDays >= 36500 ? (
                            <Infinity size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                          {formatDuration(plan.durationDays)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {plan.features?.length || 0} tính năng
                      </TableCell>
                      <TableCell>
                        {plan.active ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          >
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground"
                          >
                            Tắt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit3 className="w-4 h-4 " />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(plan)}
                        >
                          <Trash2 className="w-4 h-4 " />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isHoaGrantOpen} onOpenChange={handleHoaGrantOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cộng hoa thủ công</DialogTitle>
            <DialogDescription>
              Tìm user, nhập số hoa cần cộng và xác nhận giao dịch test.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleHoaGrantSubmit} className="mt-2 space-y-5">
            <div className="space-y-2">
              <Label>Tìm user</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={hoaSearchTerm}
                  onChange={(e) => setHoaSearchTerm(e.target.value)}
                  placeholder="Email, username hoặc tên"
                  className="pl-9"
                />
                {isSearchingHoaUsers && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {hoaUsers.map((user) => {
                const isSelected = selectedHoaUser?.id === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedHoaUser(user)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {user.fullName || user.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{user.username} · {user.email}
                        </p>
                      </div>
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </div>
                  </button>
                );
              })}

              {!isSearchingHoaUsers && hoaUsers.length === 0 && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Không tìm thấy user phù hợp.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Số hoa cộng</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={hoaGrantAmount}
                  onChange={(e) => setHoaGrantAmount(e.target.value)}
                  placeholder="VD: 3000"
                />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input
                  value={hoaGrantReason}
                  onChange={(e) => setHoaGrantReason(e.target.value)}
                  maxLength={180}
                  placeholder="VD: Cộng hoa thủ công"
                />
              </div>
            </div>

            {selectedHoaUser && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <span className="font-semibold">Đích cộng:</span>{" "}
                {selectedHoaUser.fullName || selectedHoaUser.username} ·{" "}
                {selectedHoaUser.email}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleHoaGrantOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isGrantingHoa}>
                {isGrantingHoa && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cộng hoa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedPlan ? "Cập nhật Gói" : "Thiết lập Gói Mới"}
            </DialogTitle>
            <DialogDescription>
              Tùy chỉnh thông tin gói đăng ký, tính năng và giá bán.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {!selectedPlan && (
              <div className="space-y-3">
                <Label>Tier hệ thống</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["BASIC", "PRO", "PREMIUM"] as SubscriptionTier[]).map(
                    (tier) => (
                      <Button
                        key={tier}
                        type="button"
                        variant={formData.tier === tier ? "default" : "outline"}
                        className="w-full"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, tier }))
                        }
                      >
                        {TIER_CONFIG[tier].label}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            )}

            {selectedPlan && (
              <div className="flex items-center gap-2">
                <Label>Tier:</Label>
                <Badge
                  variant={TIER_CONFIG[selectedPlan.tier]?.variant || "outline"}
                >
                  {TIER_CONFIG[selectedPlan.tier]?.label || selectedPlan.tier}
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Tên gói *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="VD: PRO (Phổ biến nhất)"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Mô tả ngắn</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả sẽ hiển thị ở trang báo giá..."
                />
              </div>
              <div className="space-y-2">
                <Label>Giá (VNĐ) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Thời hạn (ngày) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.durationDays}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationDays: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-6 p-4 rounded-xl border bg-muted/50">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(c) =>
                    setFormData((prev) => ({ ...prev, active: c }))
                  }
                  id="active-mode"
                />
                <Label htmlFor="active-mode" className="cursor-pointer">
                  Kích hoạt gói
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.popular}
                  onCheckedChange={(c) =>
                    setFormData((prev) => ({ ...prev, popular: c }))
                  }
                  id="popular-mode"
                />
                <Label
                  htmlFor="popular-mode"
                  className="cursor-pointer flex items-center gap-1"
                >
                  Đánh dấu Nổi Bật{" "}
                  <Star
                    size={14}
                    className={
                      formData.popular
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground"
                    }
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tính năng ({formData.features.length})</Label>
              <div className="space-y-2">
                {formData.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-background border rounded-lg p-2 group"
                  >
                    <GripVertical size={14} className="text-muted-foreground" />
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFeature(idx)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  placeholder="Nhập tính năng mới..."
                />
                <Button type="button" onClick={addFeature} variant="secondary">
                  Thêm
                </Button>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {selectedPlan ? "Lưu thay đổi" : "Xuất bản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa gói{" "}
              <strong>{selectedPlan?.name}</strong>? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xóa ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
