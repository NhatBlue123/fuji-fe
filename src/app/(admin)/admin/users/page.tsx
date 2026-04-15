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

      {/* Minimal Overview Cards - Sync with Courses/Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng người dùng", value: stats.total, sub: `${stats.online} online`, icon: Users },
          { label: "Học viên", value: stats.students, sub: `${stats.completionRate}% hoàn thành`, icon: BookOpen },
          { label: "Giảng viên", value: stats.instructors, sub: `${stats.openClasses} khóa học`, icon: GraduationCap },
          { label: "An ninh", value: stats.violations, sub: `${stats.locked} bị khóa`, icon: ShieldAlert }
        ].map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription className="text-xs font-semibold uppercase">{item.label}</CardDescription>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(item.value || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                <span className="text-foreground">{item.sub}</span> đối tượng
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
        <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Danh sách tài khoản</CardTitle>
            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full">
              {totalElements}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 text-[10px] font-bold uppercase tracking-tight gap-1 px-3">
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && users.length === 0 ? (
            <div className="flex h-[40vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="size-10 text-destructive/50" />
              <p className="text-muted-foreground font-medium">Không thể tải dữ liệu</p>
              <Button onClick={() => handleRefresh()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="size-4" /> Thử lại
              </Button>
            </div>
          ) : users.length > 0 ? (
            <div className="p-6">
              <UserTable 
                users={users} 
                onViewDetail={handleOpenDetail} 
                isLoading={isLoading} 
              />
              {totalPages > 1 && (
                <div className="mt-6 border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); if (currentPage > 0) setCurrentPage(p => p - 1); }}
                          className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); }}
                          className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[40vh] flex-col items-center justify-center text-center p-12">
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
