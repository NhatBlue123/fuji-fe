"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin.user.title")}
        </h1>
        <p className="text-muted-foreground">
          {totalUsers !== undefined
            ? `${totalUsers} ${t("common.accounts")} — `
            : ""}
          {t("admin.user.desc")}
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
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
        )}
      </div>
    </div>
  );
};
