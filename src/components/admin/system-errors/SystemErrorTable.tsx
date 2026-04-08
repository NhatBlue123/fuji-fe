import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, CheckCircle2, Activity, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { SystemErrorLog } from "@/store/services/adminSystemErrorApi";

interface SystemErrorTableProps {
  logs: SystemErrorLog[];
  onViewDetail: (id: number) => void;
  isLoading: boolean;
}

/**
 * Bảng hiển thị nhật ký lỗi hệ thống.
 * Cung cấp thông tin tổng quan: Thời gian, Mức độ, Nội dung, Context (User/Path), Trạng thái.
 */
export const SystemErrorTable = ({ logs, onViewDetail, isLoading }: SystemErrorTableProps) => {
  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900 border-y dark:border-border">
            <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Thời gian</TableHead>
            <TableHead className="w-[90px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Mức độ</TableHead>
            <TableHead className="min-w-[250px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Thông báo (Message)</TableHead>
            <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Module / Path</TableHead>
            <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Context</TableHead>
            <TableHead className="w-[110px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3 text-center">Trạng thái</TableHead>
            <TableHead className="w-[80px] text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-3">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="border-b dark:border-border transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <TableCell className="py-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Badge 
                  variant="outline" 
                  className={`
                    font-bold text-[9px] px-2 py-0 rounded-full
                    ${log.level === 'ERROR' ? 'border-red-200 text-red-600 dark:border-red-900/50 dark:text-red-400' : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'}
                  `}
                >
                  {log.level}
                </Badge>
              </TableCell>
              <TableCell className="py-3 max-w-[320px]">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{log.messageShort}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">ID: {log.requestId}</span>
                </div>
              </TableCell>
              <TableCell className="py-3 text-[10px]">
                <div className="flex flex-col opacity-80">
                  <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">{log.service}</span>
                  <span className="text-muted-foreground font-mono truncate">{log.method} {log.path}</span>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex flex-col gap-0.5">
                  {log.userId ? (
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">UID: {log.userId}</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground uppercase italic px-1 bg-slate-100 dark:bg-slate-800 w-max rounded">Guest</span>
                  )}
                  {log.bookingId && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Booking: {log.bookingId}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-3 text-center text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {log.resolved ? (
                  <span className="text-emerald-600 dark:text-emerald-400">[RESOLVED]</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">[UNRESOLVED]</span>
                )}
              </TableCell>
              <TableCell className="py-3 text-right">
                <div className="flex items-center justify-end whitespace-nowrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 p-2 font-bold text-[10px] uppercase gap-1"
                    onClick={() => onViewDetail(log.id)}
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" /> Chi tiết
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground font-medium">
                Không tìm thấy nhật ký lỗi nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
           <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  );
};
