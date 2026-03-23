"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface UserFilterProps {
  search: string;
  role: string;
  status: string;
  securityFilter: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSecurityFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export const UserFilter: React.FC<UserFilterProps> = ({
  search,
  role,
  status,
  securityFilter,
  sortBy,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onSecurityFilterChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 bg-muted/20 p-3 rounded-2xl border border-muted-foreground/10">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên đăng nhập hoặc email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-xl border-none bg-white dark:bg-card/50 focus-visible:ring-primary h-10 shadow-sm"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="STUDENT">Học viên</SelectItem>
            <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
            <SelectItem value="ADMIN">Quản trị</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Bị khóa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={securityFilter} onValueChange={onSecurityFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue placeholder="Bảo mật" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">Tất cả hồ sơ</SelectItem>
            <SelectItem value="VIOLATIONS">Hành vi vi phạm</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="createdAt,desc">Tài khoản mới nhất</SelectItem>
            <SelectItem value="createdAt,asc">Tài khoản cũ nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
