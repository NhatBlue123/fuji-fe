"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface UserHeaderProps {
  onRefresh?: () => void;
  totalUsers?: number;
  isLoading?: boolean;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  onRefresh,
  totalUsers,
  isLoading,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-muted-foreground">
          {totalUsers !== undefined ? `${totalUsers} tài khoản — ` : ""}Cấu hình hệ thống, bảo mật & Quản lý phân quyền người dùng.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onRefresh} 
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        )}
      </div>
    </div>
  );
};
