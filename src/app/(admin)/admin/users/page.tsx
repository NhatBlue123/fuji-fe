"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { UserHeader } from "@/components/admin/user/UserHeader";
import { UserFilter } from "@/components/admin/user/UserFilter";
import { UserTable, AdminUser } from "@/components/admin/user/UserTable";
import { UserDetailModal } from "@/components/admin/user/UserDetailModal";
import {
  Loader2,
  Users,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldCheck,
  SearchX,
  Server,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<AdminUser> | null>(null);
  
  // Real stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    students: 0,
    instructors: 0,
    online: 0,
    locked: 0,
    violations: 0,
    openClasses: 0,
    completionRate: 0,
  });

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [securityFilter, setSecurityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const PAGE_SIZE = 10;

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const response = await api.get<ApiResponse<any>>("/users/me/stats");
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          total: data.totalUsers || 0,
          active: data.activeUsers || 0,
          admins: data.admins || 0,
          students: data.totalStudents || 0,
          instructors: data.totalInstructors || 0,
          online: data.onlineUsers || 0,
          locked: data.lockedUsers || 0,
          violations: data.totalViolations || 0,
          openClasses: data.openClasses || 0,
          completionRate: data.completionRate || 0,
        });
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [sortField, sortDirection] = sortBy.split(",");
      const params: any = {
        page: currentPage,
        size: PAGE_SIZE,
        sortBy: sortField,
        sortDir: sortDirection,
      };

      if (search.trim()) {
        params.keyword = search.trim();
      }

      if (role !== "all") {
        params.role = role;
      }

      if (status !== "all") {
        params.isActive = status === "ACTIVE";
      } else {
        params.isActive = null;
      }

      if (securityFilter === "VIOLATIONS") {
        params.hasViolations = true;
      }

      const response = await api.get<ApiResponse<PaginatedResponse<AdminUser>>>("/users/me/all", { params });
      
      if (response.data.success) {
        setUsers(response.data.data.content);
        setPagination(response.data.data);
      } else {
        throw new Error(response.data.message || "Lỗi tải dữ liệu");
      }
    } catch (error: any) {
      console.error("Fetch users error:", error);
      setIsError(true);
      toast.error(error.message || "Không thể kết nối tới server");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, role, status, securityFilter, sortBy]);

  const handleRefresh = useCallback(async () => {
    toast.promise(Promise.all([fetchUsers(), fetchStats()]), {
      loading: "Đang làm mới dữ liệu...",
      success: "Dữ liệu đã được làm mới",
      error: "Làm mới thất bại",
    });
  }, [fetchUsers, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUser) {
      const updated = users.find(u => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  }, [users]);

  const handleOpenDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const totalPages = pagination?.totalPages ?? 1;

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              href="#" 
              isActive={currentPage === i}
              onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={0}>
          <PaginationLink 
            isActive={currentPage === 0}
            onClick={(e) => { e.preventDefault(); setCurrentPage(0); }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 2) items.push(<PaginationEllipsis key="left-ellipsis" />);

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i}
              onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 3) items.push(<PaginationEllipsis key="right-ellipsis" />);

      items.push(
        <PaginationItem key={totalPages - 1}>
          <PaginationLink 
            isActive={currentPage === totalPages - 1}
            onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages - 1); }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  const totalElements = pagination?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      <UserHeader 
        onRefresh={handleRefresh} 
        totalUsers={stats.total} 
        isLoading={isLoading || isStatsLoading} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng quan", value: stats.total, unit: "Người dùng", sub: `${stats.online} đang trực tuyến`, icon: Server, color: "text-blue-600" },
          { label: "Học tập", value: stats.students, unit: "Học viên", sub: `${stats.completionRate}% hoàn thành bài`, icon: BookOpen, color: "text-emerald-600" },
          { label: "Giảng dạy", value: stats.instructors, unit: "Giáo viên", sub: `${stats.openClasses} khóa học đang mở`, icon: GraduationCap, color: "text-amber-600" },
          { label: "Bảo mật", value: stats.violations, unit: "Cảnh báo", sub: `${stats.locked} tài khoản bị khóa`, icon: ShieldAlert, color: "text-rose-600" }
        ].map((item, index) => (
          <Card key={index} className="shadow-sm border-muted-foreground/10 rounded-2xl overflow-hidden bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <div className={item.color}>
                <item.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight">{(item.value || 0).toLocaleString()}</span>
                <span className="text-[10px] font-medium text-muted-foreground">{item.unit}</span>
              </div>
              <p className={`text-[10px] font-bold mt-1 ${item.color}`}>
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <UserFilter
        search={search}
        role={role}
        status={status}
        securityFilter={securityFilter}
        sortBy={sortBy}
        onSearchChange={(v) => { setSearch(v); setCurrentPage(0); }}
        onRoleChange={(v) => { setRole(v); setCurrentPage(0); }}
        onStatusChange={(v) => { setStatus(v); setCurrentPage(0); }}
        onSecurityFilterChange={(v) => { setSecurityFilter(v); setCurrentPage(0); }}
        onSortChange={(v) => { setSortBy(v); setCurrentPage(0); }}
      />

      <Card>
        <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Danh sách tài khoản</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px] px-2.5 py-1 rounded-full">
              {totalElements} kết quả
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          {isLoading && users.length === 0 ? (
            <div className="flex h-[40vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg bg-muted/20">
              <AlertCircle className="size-10 text-destructive/50" />
              <p className="text-muted-foreground font-medium">Không thể tải dữ liệu</p>
              <Button onClick={() => handleRefresh()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="size-4" /> Thử lại
              </Button>
            </div>
          ) : users.length > 0 ? (
            <>
              <UserTable 
                users={users} 
                onViewDetail={handleOpenDetail} 
                isLoading={isLoading} 
              />
              {totalPages > 1 && (
                <div className="mt-6 border-t pt-6 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2 whitespace-nowrap">
                    {totalElements} kết quả
                  </span>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); if (currentPage > 0) setCurrentPage(p => p - 1); }}
                          aria-disabled={currentPage === 0}
                          className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); }}
                          aria-disabled={currentPage === totalPages - 1}
                          className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-[40vh] flex-col items-center justify-center text-center border-2 border-dashed rounded-lg bg-muted/20 py-12">
              <SearchX className="size-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Không tìm thấy người dùng</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 px-4">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để có kết quả khác.
              </p>
              <Button 
                variant="link" 
                size="sm"
                className="mt-2 text-primary"
                onClick={() => { setSearch(""); setRole("all"); setStatus("all"); setCurrentPage(0); }}
              >
                Đặt lại tất cả bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailModal
        user={selectedUser}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onUserUpdated={() => { fetchUsers(); fetchStats(); }}
      />
    </div>
  );
}
