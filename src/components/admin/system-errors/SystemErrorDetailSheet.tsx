import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  useGetSystemErrorDetailQuery,
  useResolveSystemErrorMutation,
  useAddSystemErrorNoteMutation
} from "@/store/services/adminSystemErrorApi";
import { 
  History, 
  Terminal, 
  CheckCircle2, 
  MessageSquarePlus, 
  Send, 
  Activity, 
  Globe, 
  Clock, 
  Bug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

interface SystemErrorDetailSheetProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Giao diện chi tiết điều tra lỗi hệ thống (Side Sheet).
 * Cung cấp stack trace, metadata của request và dòng thời gian ghi chú của Admin.
 */
export const SystemErrorDetailSheet = ({ id, open, onOpenChange }: SystemErrorDetailSheetProps) => {
  const { data: errorDetail, isLoading, isFetching } = useGetSystemErrorDetailQuery(id!, { skip: !id });
  const [resolveError, { isLoading: isResolving }] = useResolveSystemErrorMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddSystemErrorNoteMutation();
  const [noteText, setNoteText] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  const error = errorDetail?.data;

  // Hành động giải quyết lỗi
  const handleResolve = async () => {
    if (!id) return;
    try {
      await resolveError({ id, note: resolutionNote }).unwrap();
      toast.success("Lỗi đã được đánh dấu là đã giải quyết");
      setResolutionNote("");
    } catch (err: any) {
      toast.error(err.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  // Hành động chèn ghi chú điều tra
  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    try {
      await addNote({ id, note: noteText }).unwrap();
      toast.success("Ghi chú đã được thêm thành công");
      setNoteText("");
    } catch (err: any) {
      toast.error(err.data?.message || "Lỗi khi thêm ghi chú");
    }
  };

  if (isLoading && !error) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl md:max-w-2xl p-0 h-full flex flex-col gap-0 border-l border-slate-200 dark:border-border">
        <SheetHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-border relative">
          <div className="flex flex-col gap-3">
            {/* Header: Level, Service, CreatedAt */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider font-bold">
              <span className={error?.level === 'ERROR' ? "text-red-500" : "text-amber-500"}>
                [{error?.level || "UNKNOWN"}]
              </span>
              <span className="text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                MODULE: {error?.service}
              </span>
              <span className="text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                TIME: {error ? format(new Date(error.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : ""}
              </span>
              {error?.resolved ? (
                <span className="text-emerald-600 dark:text-emerald-500 border-l border-slate-300 dark:border-slate-700 pl-2">[RESOLVED]</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-500 border-l border-slate-300 dark:border-slate-700 pl-2">[UNRESOLVED]</span>
              )}
            </div>

            <div>
              <SheetTitle className="text-base font-bold leading-tight flex items-start gap-3 text-slate-800 dark:text-slate-100 font-sans">
                <Bug className="h-5 w-5 mt-0.5 shrink-0 text-slate-700 dark:text-slate-300" />
                <span>{error?.messageShort}</span>
              </SheetTitle>
              <SheetDescription className="mt-2 font-mono text-[10px] text-muted-foreground/80 break-all bg-transparent font-bold">
                REQ_ID: {error?.requestId}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6 font-sans">
          <div className="space-y-6">
            {/* Metadata quan trọng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg">
                <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">MÔI TRƯỜNG (PATH)</div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono break-all line-clamp-2">{error?.method} {error?.path}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg">
                <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">NGỮ CẢNH USER</div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                  {error?.userId ? `UID: ${error.userId}` : "GUEST"}
                  {error?.bookingId ? ` • BOOKING: ${error.bookingId}` : ""}
                </div>
              </div>
            </div>

            {/* Chi tiết Stack Trace */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">STACK TRACE (Chi tiết mã lỗi)</h3>
              <div className="border border-slate-200 dark:border-border bg-slate-900 dark:bg-[#0a0a0a] rounded-lg">
                <ScrollArea className="h-[280px]">
                  <pre className="p-4 text-[10px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap select-all">
                    {error?.stackTrace || "Không có trace của lỗi này."}
                  </pre>
                </ScrollArea>
              </div>
            </div>

            {/* Lịch sử điều tra lỗi */}
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">LỊCH SỬ ĐIỀU TRA</h3>
              <div className="space-y-4 relative pl-5 border-l-2 border-slate-200 dark:border-slate-800 ml-2 py-1">
                {error?.notes && error.notes.length > 0 ? (
                  error.notes.map((note) => (
                    <div key={note.id} className="relative group">
                      <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-card" />
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border p-3 rounded-lg flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{note.authorName}</span>
                          <span className="text-[10px] text-slate-500">
                            {format(new Date(note.createdAt), "dd/MM HH:mm:ss", { locale: vi })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{note.note}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 italic mb-2 relative">
                    <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-card" />
                    Chưa có ghi chú nào được thêm.
                  </div>
                )}
              </div>
            </div>
            
            {/* Form Giải quyết lỗi */}
            {!error?.resolved ? (
              <div className="border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3 mt-6">
                <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">KẾT QUẢ XỬ LÝ (RESOLUTION)</h3>
                <Textarea 
                  placeholder="Nhập nguyên nhân và cách khắc phục..."
                  className="font-sans text-xs min-h-[80px] bg-white dark:bg-black border-slate-200 dark:border-border shadow-none rounded-md"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
                <Button 
                  onClick={handleResolve} 
                  disabled={isResolving}
                  className="w-full font-bold uppercase text-[10px] tracking-widest rounded-md"
                >
                  XÁC NHẬN ĐÃ GIẢI QUYẾT
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg space-y-1 mt-6">
                <h3 className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-500">[RESOLVED] Đã giải quyết</h3>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  {error.resolutionNote || "Không có nội dung giải quyết."}
                </div>
                <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-200 dark:border-border mt-3">
                  Bởi <span className="font-bold text-slate-700 dark:text-slate-300">{error.resolvedByName}</span> lúc {format(new Date(error.resolvedAt!), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer ghi chú nhanh */}
        <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900 flex gap-2 items-center font-sans">
          <span className="font-bold text-[10px] uppercase shrink-0 text-slate-500">Ghi chú nhanh</span>
          <Input 
            placeholder="Nhập nội dung..."
            className="flex-1 h-9 text-xs bg-white dark:bg-black border-slate-200 dark:border-slate-800 shadow-none rounded-md px-3"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          />
          <Button 
            size="sm" 
            className="h-9 rounded-md text-[10px] px-4 font-bold uppercase"
            onClick={handleAddNote}
            disabled={isAddingNote || !noteText.trim()}
          >
            LƯU LẠI
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
