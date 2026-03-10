"use client";

import { useState } from "react";
import {
  useGetAdminUsersQuery,
  useGetAdminUserDetailQuery,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
} from "@/store/services/admin/userApi";
import { UserFilters } from "@/components/admin/UserFilters";
import { UserTable } from "@/components/admin/UserTable";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users, UserCheck, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/admin-component/admin-ui/button";

export default function AdminUsersPage() {
  // State phân trang & lọc
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // State chi tiết
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch dữ liệu
  const { data, isLoading, isFetching, error } = useGetAdminUsersQuery({
    page,
    size,
    search: search || undefined,
    role: role === "ALL" ? undefined : role,
    isActive: status === "ALL" ? undefined : status === "ACTIVE",
    sortBy: "id",
    sortDir: "desc",
  });

  const { data: userDetailResponse, isLoading: isLoadingDetail } = useGetAdminUserDetailQuery(
    selectedUserId,
    { skip: !selectedUserId }
  );

  const [updateStatus] = useUpdateUserStatusMutation();
  const [updateRole] = useUpdateUserRoleMutation();

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await updateStatus({ id, isActive }).unwrap();
      toast.success(isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản thành công");
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái người dùng");
    }
  };

  const handleUpdateRole = async (id: number, newRole: string) => {
    try {
      await updateRole({ id, role: newRole }).unwrap();
      toast.success("Đã cập nhật vai trò người dùng");
    } catch (err) {
      toast.error("Không thể cập nhật vai trò");
    }
  };

  const handleViewDetail = (id: number) => {
    setSelectedUserId(id);
    setIsDrawerOpen(true);
  };

  const users = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Theo dõi và quản trị thông tin người dùng hệ thống</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng số User</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalElements}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {users.filter((u: any) => u.isActive).length} (trang này)
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cần chú ý (Vi phạm)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {users.filter((u: any) => u.violationCount > 0).length} (trang này)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table Section */}
      <Card className="border-none shadow-sm outline outline-1 outline-border">
        <CardHeader className="pb-4">
          <UserFilters
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(0); }}
            role={role}
            onRoleChange={(v) => { setRole(v); setPage(0); }}
            status={status}
            onStatusChange={(v) => { setStatus(v); setPage(0); }}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground italic">Đang tải danh sách người dùng...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive bg-destructive/5 rounded-xl border border-destructive/10">
              Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối API.
            </div>
          ) : (
            <>
              <div className="relative">
                {isFetching && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px] transition-opacity">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                )}
                <UserTable
                  users={users}
                  onViewDetail={handleViewDetail}
                  onToggleStatus={handleToggleStatus}
                  onUpdateRole={handleUpdateRole}
                />
              </div>

              {/* Pagination UI - Tránh hardcode logic tương tự JLPT */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-3 mt-6">
                  <span className="text-sm text-muted-foreground mr-auto italic">
                    Hiển thị {users.length} / {totalElements} kết quả
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="h-9 gap-1 font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4" /> TRƯỚC
                  </Button>
                  <div className="flex items-center gap-1.5 px-3">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={page === i ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 text-xs font-bold transition-all ${page === i ? "shadow-md scale-110" : ""}`}
                        onClick={() => setPage(i)}
                      >
                        {i + 1}
                      </Button>
                    )).slice(Math.max(0, page - 2), Math.min(totalPages, page + 3))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="h-9 gap-1 font-semibold"
                  >
                    TIẾP <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        userId={selectedUserId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userDetail={userDetailResponse?.data}
        isLoading={isLoadingDetail}
      />
    </div>
  );
}
