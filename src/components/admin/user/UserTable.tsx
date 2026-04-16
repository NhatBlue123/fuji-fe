"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ViolationLog {
  id: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  testId: string;
  description: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  rawEvent?: string;
  isHandled?: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastActiveAt?: string;
  score?: number;
  antiCheatViolations?: number;
  identificationCode?: string;
  violationLogs?: ViolationLog[];
  auditLogs?: {
    id: number;
    action: string;
    entityType?: string;
    entityId?: number;
    oldValues?: string;
    newValues?: string;
    ipAddress?: string;
    createdAt: string;
  }[];
  updatedAt: string;
  examAccess?: boolean;
  contentAccess?: boolean;
  chatAccess?: boolean;
  expiryDate?: string | null;
  deviceLimit?: number;
  courseCreateAccess?: boolean;
  gradeAccess?: boolean;
  analyticsAccess?: boolean;
}

interface UserTableProps {
  users: AdminUser[];
  onViewDetail: (user: AdminUser) => void;
  isLoading?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onViewDetail,
  isLoading,
}) => {
  const { t } = useTranslation();

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return <Badge variant="outline" className="font-semibold text-rose-600 bg-white border-rose-200 min-w-[100px] justify-center rounded-full px-2 py-0.5 text-[10px] uppercase">{t("admin.user.role.admin")}</Badge>;
      case "INSTRUCTOR":
        return <Badge variant="outline" className="font-semibold border-[#b3d4ff] text-[#0066cc] bg-white min-w-[100px] justify-center rounded-full px-2 py-0.5 text-[10px] uppercase">{t("admin.user.role.instructor")}</Badge>;
      case "STUDENT":
      default:
        return <Badge variant="outline" className="font-semibold border-[#b3d4ff] text-[#0066cc] bg-white min-w-[100px] justify-center rounded-full px-2 py-0.5 text-[10px] uppercase">{t("admin.user.role.student")}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 font-semibold min-w-[90px] justify-center rounded-full px-2 py-0.5 text-[10px]">{t("admin.user.status.active")}</Badge>
    ) : (
      <Badge variant="outline" className="text-rose-600 bg-rose-50 border-rose-100 font-semibold min-w-[90px] justify-center rounded-full px-2 py-0.5 text-[10px]">{t("admin.user.status.lockedLabel")}</Badge>
    );
  };

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[180px] font-bold">{t("admin.user.table.user")}</TableHead>
            <TableHead className="font-bold">{t("admin.user.table.name")}</TableHead>
            <TableHead className="font-bold text-center">{t("admin.user.table.role")}</TableHead>
            <TableHead className="font-bold text-center">{t("admin.user.table.status")}</TableHead>
            <TableHead className="font-bold text-center whitespace-nowrap">{t("admin.user.table.violations")}</TableHead>
            <TableHead className="text-right font-bold w-[120px]">{t("admin.user.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                {t("admin.user.table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/5 transition-colors border-b last:border-0 group">
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 rounded-full border-2 border-background shadow-sm ring-1 ring-border">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {user.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate font-medium">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground/90">{user.fullName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {user.identificationCode || `UID-${user.id}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center py-3">{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-center py-3">{getStatusBadge(user.isActive)}</TableCell>
                <TableCell className="text-center py-3">
                  {(() => {
                    const violationCount = user.violationLogs?.length ?? 0;
                    if (violationCount === 0) return (
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <span className="text-xs font-medium tabular-nums">0</span>
                      </div>
                    );
                    
                    let label = t("admin.user.violation.reminder");
                    let style = "text-amber-600 bg-amber-50 border-amber-200";
                    if (violationCount >= 3 && violationCount <= 5) {
                      label = t("admin.user.violation.serious");
                      style = "text-orange-600 bg-orange-50 border-orange-200";
                    } else if (violationCount > 5) {
                      label = t("admin.user.violation.tooMany");
                      style = "text-rose-600 bg-rose-50 border-rose-200";
                    }

                    return (
                      <Badge variant="outline" className={`h-6 px-3 text-[9px] rounded-full gap-1.5 font-bold uppercase border ${style}`}>
                        <ShieldAlert className="size-3" />
                        {label} ({violationCount})
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right py-3">
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => onViewDetail(user)}
                    className="h-8 p-0 rounded-none text-primary hover:text-primary/80 font-semibold text-xs underline decoration-primary/30 underline-offset-4"
                  >
                    {t("admin.user.btn.viewDetail")}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
