import React from "react";
import { Search, Filter, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SystemErrorFilterProps {
  filters: any;
  setFilters: (f: any) => void;
  handleResetFilters: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (b: boolean) => void;
}

/**
 * Bộ lọc tìm kiếm cho Nhật ký lỗi.
 * Cho phép lọc theo mức độ (Level), dịch vụ (Service), từ khóa và trạng thái xử lý.
 */
export const SystemErrorFilter = ({ 
  filters, 
  setFilters, 
  handleResetFilters,
  autoRefresh,
  setAutoRefresh 
}: SystemErrorFilterProps) => {
  return (
    <div className="p-3 border-b bg-card">
      <div className="flex flex-col xl:flex-row items-center gap-3">
        {/* Search */}
        <div className="flex-1 w-full min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm theo lỗi, URL hoặc Request ID..." 
            className="pl-9 h-9 bg-background text-xs"
            value={filters.keyword}
            onChange={(e) => setFilters({...filters, keyword: e.target.value})}
          />
        </div>

        {/* Action Filters Line */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto">
          <Select value={filters.level} onValueChange={(v) => { setFilters({...filters, level: v}); }}>
            <SelectTrigger className="h-9 bg-background w-[140px] shrink-0 text-xs font-semibold">
              <SelectValue placeholder="Mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Tất cả Level</SelectItem>
              <SelectItem value="ERROR" className="text-xs">ERROR (Lỗi)</SelectItem>
              <SelectItem value="WARN" className="text-xs">WARN (Cảnh báo)</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.service} onValueChange={(v) => { setFilters({...filters, service: v}); }}>
            <SelectTrigger className="h-9 bg-background w-[140px] shrink-0 text-xs font-semibold">
              <SelectValue placeholder="Dịch vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Toàn hệ thống</SelectItem>
              <SelectItem value="Backend-API" className="text-xs">Backend-API</SelectItem>
              <SelectItem value="Frontend-Client" className="text-xs">Frontend-Client</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.resolved} onValueChange={(v) => { setFilters({...filters, resolved: v}); }}>
            <SelectTrigger className="h-9 bg-background w-[140px] shrink-0 text-xs font-semibold">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Mọi trạng thái</SelectItem>
              <SelectItem value="true" className="text-xs">Đã xử lý</SelectItem>
              <SelectItem value="false" className="text-xs">Đang chờ</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 bg-background border px-3 h-9 rounded-md shrink-0">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto-refresh" className="text-[10px] font-bold uppercase cursor-pointer text-muted-foreground shrink-0">Auto</Label>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleResetFilters} className="h-9 w-9 shrink-0 bg-background text-muted-foreground">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Khôi phục mặc định</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
