import React from "react";
import { RefreshCw, Download, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SystemErrorHeaderProps {
  onRefresh: () => void;
  totalErrors: number;
  isLoading: boolean;
}

/**
 * Header section for System Error page.
 * Displays title, stats, and global actions like Refresh or Export.
 */
export const SystemErrorHeader = ({ onRefresh, totalErrors, isLoading }: SystemErrorHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
          <Bug className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Nhật ký lỗi hệ thống
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">LIVE</Badge>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Có <span className="text-foreground">{totalErrors}</span> lỗi ghi nhận trong 24h qua.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 font-bold uppercase tracking-tight text-[11px]"
          onClick={() => toast.info("Tính năng Export CSV đang được phát triển")}
        >
          <Download className="h-3.5 w-3.5" /> Xuất báo cáo
        </Button>
        <Button 
          onClick={onRefresh} 
          disabled={isLoading}
          size="sm"
          className="h-9 gap-2 font-bold uppercase tracking-tight text-[11px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> 
          Làm mới dữ liệu
        </Button>
      </div>
    </div>
  );
};

import { toast } from "sonner";
