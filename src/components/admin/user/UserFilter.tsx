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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row gap-3 bg-muted/20 p-3 rounded-2xl border border-muted-foreground/10">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.user.filter.placeholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-xl border-none bg-white dark:bg-card/50 focus-visible:ring-primary h-10 shadow-sm"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue placeholder={t("admin.user.filter.rolePlaceholder")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">
              {t("admin.user.filter.allRoles")}
            </SelectItem>
            <SelectItem value="STUDENT">
              {t("admin.user.role.student")}
            </SelectItem>
            <SelectItem value="INSTRUCTOR">
              {t("admin.user.role.instructor")}
            </SelectItem>
            <SelectItem value="ADMIN">{t("admin.user.role.admin")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue
              placeholder={t("admin.user.filter.statusPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">
              {t("admin.user.filter.allStatus")}
            </SelectItem>
            <SelectItem value="ACTIVE">
              {t("admin.user.status.active")}
            </SelectItem>
            <SelectItem value="INACTIVE">
              {t("admin.user.status.lockedLabel")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={securityFilter} onValueChange={onSecurityFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue
              placeholder={t("admin.user.filter.securityPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="all">
              {t("admin.user.filter.allProfiles")}
            </SelectItem>
            <SelectItem value="VIOLATIONS">
              {t("admin.user.filter.violations")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-none bg-white dark:bg-card/50 h-10 shadow-sm font-medium text-xs">
            <SelectValue placeholder={t("admin.user.filter.sortPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-xl">
            <SelectItem value="createdAt,desc">
              {t("admin.user.filter.newest")}
            </SelectItem>
            <SelectItem value="createdAt,asc">
              {t("admin.user.filter.oldest")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
