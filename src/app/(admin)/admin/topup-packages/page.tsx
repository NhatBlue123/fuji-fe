"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  Gem,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTopupPackageMutation,
  useDeleteTopupPackageMutation,
  useGetAdminTopupPackagesQuery,
  useUpdateTopupPackageMutation,
  type AdminTopupPackage,
  type TopupPackagePayload,
} from "@/store/services/admin/topupPackageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getTopupTransferAmountVnd } from "@/lib/topup";
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

const emptyForm: TopupPackagePayload = {
  price: 0,
  flowers: 0,
  bonusFlowers: 0,
  isPopular: false,
  sortOrder: 0,
  isActive: true,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  return fallback;
};

export default function AdminTopupPackagesPage() {
  const {
    data: packages = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminTopupPackagesQuery();
  const [createTopupPackage, { isLoading: isCreating }] =
    useCreateTopupPackageMutation();
  const [updateTopupPackage, { isLoading: isUpdating }] =
    useUpdateTopupPackageMutation();
  const [deleteTopupPackage, { isLoading: isDeleting }] =
    useDeleteTopupPackageMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<AdminTopupPackage | null>(null);
  const [formData, setFormData] = useState<TopupPackagePayload>(emptyForm);

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [packages],
  );

  const handleCreate = () => {
    setSelectedPackage(null);
    setFormData({ ...emptyForm, sortOrder: sortedPackages.length + 1 });
    setIsModalOpen(true);
  };

  const handleEdit = (pkg: AdminTopupPackage) => {
    setSelectedPackage(pkg);
    setFormData({
      price: getTopupTransferAmountVnd(pkg.price),
      flowers: pkg.flowers,
      bonusFlowers: pkg.bonusFlowers,
      isPopular: pkg.isPopular,
      sortOrder: pkg.sortOrder,
      isActive: pkg.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (pkg: AdminTopupPackage) => {
    setSelectedPackage(pkg);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.price || !formData.flowers) {
      toast.error("Vui lòng nhập đầy đủ giá và số hoa");
      return;
    }
    if (formData.price < 1000 || formData.price % 1000 !== 0) {
      toast.error("Giá chuyển khoản phải là bội số 1.000đ");
      return;
    }

    try {
      if (selectedPackage) {
        await updateTopupPackage({
          id: selectedPackage.id,
          data: formData,
        }).unwrap();
        toast.success("Đã cập nhật gói nạp");
      } else {
        await createTopupPackage(formData).unwrap();
        toast.success("Đã tạo gói nạp mới");
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Thao tác thất bại"));
    }
  };

  const confirmDelete = async () => {
    if (!selectedPackage) return;

    try {
      await deleteTopupPackage(selectedPackage.id).unwrap();
      toast.success("Đã xóa gói nạp");
      setIsDeleteOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể xóa gói nạp"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          Quản lý gói nạp hoa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cấu hình danh sách gói nạp hiển thị ở tab Nạp Hoa Anh Đào cho người dùng.
        </p>
        <div className="mt-4 flex gap-3">
          <Button onClick={handleCreate} className="rounded-xl font-bold">
            <Plus className="mr-2 h-4 w-4" /> Thêm gói mới
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            disabled={isFetching}
            className="rounded-xl font-bold"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Tổng gói nạp</p>
            <span className="rounded-lg border border-secondary/30 bg-secondary/20 px-2 py-1">
              <Gem className="text-primary" size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">{packages.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Đang hoạt động</p>
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2 py-1">
              <Sparkles className="text-emerald-500" size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {packages.filter((item) => item.isActive).length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Gói nổi bật</p>
            <span className="rounded-lg border border-pink-500/30 bg-pink-500/20 px-2 py-1">
              <Sparkles className="text-pink-500" size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {packages.find((item) => item.isPopular)?.flowers?.toLocaleString() || 0} hoa
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Gói</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{pkg.flowers.toLocaleString()} hoa</span>
                      {pkg.isPopular && <Badge>Nổi bật</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTopupTransferAmountVnd(pkg.price).toLocaleString()}đ
                  </TableCell>
                  <TableCell>{pkg.bonusFlowers?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    {pkg.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      >
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Tắt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(pkg)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPackage ? "Cập nhật gói nạp" : "Tạo gói nạp mới"}
            </DialogTitle>
            <DialogDescription>
              Điều chỉnh giá, số hoa, bonus, thứ tự hiển thị và trạng thái hoạt động.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá chuyển khoản (VND) *</Label>
                <Input
                  type="number"
                  min={1000}
                  step={1000}
                  value={formData.price || 0}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="VD: 10000"
                />
              </div>
              <div className="space-y-2">
                <Label>Số hoa *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.flowers || 0}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      flowers: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bonus hoa</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bonusFlowers || 0}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bonusFlowers: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sortOrder || 0}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-6 rounded-xl border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  id="active-topup"
                />
                <Label htmlFor="active-topup">Kích hoạt</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!formData.isPopular}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPopular: checked }))
                  }
                  id="popular-topup"
                />
                <Label htmlFor="popular-topup">Nổi bật</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedPackage ? "Lưu thay đổi" : "Tạo gói"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa gói nạp {selectedPackage?.flowers?.toLocaleString()} hoa?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
