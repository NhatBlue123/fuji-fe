"use client";

/**
 * ReportDetailPage.tsx
 * 
 * Hiển thị chi tiết của một báo cáo hệ thống với quy trình quản lý trạng thái.
 * Người dùng có thể xem phản hồi của admin, các tệp đính kèm và gửi yêu cầu khiếu nại nếu chưa hài lòng.
 */

import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  useGetSystemReportQuery,
  useUpdateSystemReportMutation,
  useAddSystemReportNoteMutation
} from "@/store/services/adminReportApi"; 
import { 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Paperclip,
  Undo2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

const REASON_OPTIONS = [
  { id: "not_resolved", label: "Vấn đề vẫn chưa được giải quyết" },
  { id: "unclear", label: "Câu trả lời chưa rõ ràng" },
  { id: "still_buggy", label: "Lỗi vẫn còn xảy ra" },
  { id: "other", label: "Khác" }
];

export default function ReportDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [followupReason, setFollowupReason] = useState("");
  const [followupComment, setFollowupComment] = useState("");
  const [followupFiles, setFollowupFiles] = useState<File[]>([]);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  // RTK Query hooks để tương tác với API báo cáo
  const { data: report, isLoading, isError, refetch } = useGetSystemReportQuery(Number(id));
  const [updateReport] = useUpdateSystemReportMutation();
  const [addNote] = useAddSystemReportNoteMutation();

  /**
   * Xử lý luồng 'Mở lại' (Gửi khiếu nại).
   * Gửi tệp đính kèm đến hệ thống quản lý tệp qua API và cập nhật trạng thái báo cáo.
   */
  const handleFollowupSubmit = async () => {
    if (!followupReason) {
       toast.error("Vui lòng chọn lý do chưa hài lòng");
       return;
    }
    
    // Yêu cầu mô tả cụ thể nếu chọn "Khác"
    if (followupReason === "other" && !followupComment.trim()) {
       toast.error("Vui lòng nhập mô tả cụ thể lý do của bạn");
       return;
    }

    setIsSubmittingFollowup(true);
    try {
      await updateReport({
        id: Number(id),
        data: { status: "REOPENED" as any }
      }).unwrap();

      let attachmentUrls = "";
      if (followupFiles.length > 0) {
        const formData = new FormData();
        followupFiles.forEach(f => formData.append("files", f));
        const uploadRes = await api.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        attachmentUrls = uploadRes.data.data.join(",");
      }

      const reasonLabel = REASON_OPTIONS.find(r => r.id === followupReason)?.label;
      const noteContent = `[REOPEN YÊU CẦU]\nLý do: ${reasonLabel}\nChi tiết: ${followupComment || "Không có"}\n${attachmentUrls ? "Ảnh đính kèm: " + attachmentUrls : ""}`;
      
      await addNote({
        reportId: Number(id),
        data: { note: noteContent }
      }).unwrap();

      toast.success("Cảm ơn bạn đã phản hồi. Chúng tôi đã tiếp nhận yêu cầu mở lại báo cáo này.");
      router.push('/notifications');
    } catch (e) {
      toast.error("Không thể gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="size-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="size-8 text-destructive opacity-30" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('auto._id__page_1')}</h2>
        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-widest">{t('auto._id__page_2')}</Button>
      </div>
    );
  }

  // Cấu hình màu sắc và icon cho từng trạng thái báo cáo
  const statusMap = {
    OPEN: { label: "Đang chờ", icon: Clock, color: "bg-blue-500/10 text-blue-500 border-blue-500/10" },
    IN_PROGRESS: { label: "Đang xử lý", icon: AlertCircle, color: "bg-amber-500/10 text-amber-500 border-amber-500/10" },
    RESOLVED: { label: "Đã xử lý", icon: CheckCircle2, color: "bg-emerald-500 text-white border-transparent hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20" },
    REJECTED: { label: "Đã từ chối", icon: XCircle, color: "bg-rose-500/10 text-rose-500 border-rose-500/10 hover:bg-rose-500/20" },
    REOPENED: { label: "Đã khiếu nại", icon: Undo2, color: "bg-purple-500/10 text-purple-500 border-purple-500/10" },
  };

  const currentStatusString = String(report.status);
  const status = statusMap[currentStatusString as keyof typeof statusMap] || statusMap.OPEN;
  const StatusIcon = status.icon;

  const canReopen = currentStatusString === "RESOLVED" || currentStatusString === "REJECTED";

  return (
    <div className="w-full px-4 sm:px-4 py-4 font-sans antialiased animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* PHẦN TIÊU ĐỀ */}
      <div className="flex items-center gap-3 mb-4 px-2">
         <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-secondary/10 hover:text-secondary group transition-all shrink-0"
            onClick={() => router.push('/notifications')}
         >
            <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
         </Button>
         <h1 className="text-lg font-black tracking-tight uppercase cursor-default">{t('auto._id__page_3')}</h1>
         <div className="flex-1" />
         <Badge className={cn("px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] border shadow-none transition-all", status.color)}>
            <StatusIcon className="size-2.5 mr-2" />
            {status.label}
         </Badge>
      </div>

      <div className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden flex flex-col min-h-[480px]">
        <div className="p-8 space-y-10 flex-1">
           {/* PHẦN NỘI DUNG SỰ CỐ */}
           <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1 underline underline-offset-4 decoration-secondary/30">{t('auto._id__page_4')}</span>
                <h2 className="text-xl font-black tracking-tight leading-tight">{report.title}</h2>
              </div>
              <div className="text-[13px] font-bold leading-relaxed text-slate-700 dark:text-slate-200 bg-muted/15 p-6 rounded-2xl whitespace-pre-wrap selection:bg-secondary/30">
                {report.description}
              </div>
           </div>

           {/* PHẦN TỆP ĐÍNH KÈM (Dùng API để hiển thị tệp an toàn) */}
           {report.attachmentUrls && (
              <div className="space-y-4">
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border pb-1 block w-fit">Minh chứng đính kèm ({report.attachmentUrls.split(',').length})</span>
                 <div className="flex flex-wrap gap-4 pt-1">
                    {report.attachmentUrls.split(',').map((url, idx) => {
                      const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov');
                      return (
                         <div key={idx} className="group relative size-20 rounded-2xl overflow-hidden border-2 border-border bg-muted/20 hover:border-secondary transition-all cursor-pointer shadow-sm">
                            {isVideo ? <video src={url} className="size-full object-cover" /> : <img src={url} alt="attachment" className="size-full object-cover group-hover:scale-110 transition-transform duration-500" onDoubleClick={() => window.open(url, '_blank')} />}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Paperclip className="size-4 text-white" />
                            </div>
                         </div>
                      );
                    })}
                 </div>
              </div>
           )}

           {/* PHẦN GHI CHÚ CỦA ADMIN */}
           <div className="bg-secondary/[0.04] rounded-[2.5rem] p-8 border border-secondary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Undo2 className="size-20 -rotate-12" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4 block">{t('auto._id__page_5')}</span>
              {report.adminNote ? (
                <div className="text-[14px] font-black text-slate-800 dark:text-slate-100 leading-relaxed italic border-l-4 border-secondary/30 pl-6 py-1">
                  "{report.adminNote}"
                </div>
              ) : (
                <div className="text-[11px] font-bold text-muted-foreground italic pl-6 border-l-2 border-muted/30 py-1 opacity-60">
                   Vấn đề đã được ghi nhận. Kỹ thuật viên sẽ phản hồi kết quả tại đây.
                </div>
              )}
           </div>
        </div>

        {/* PHẦN HÀNH ĐỘNG KHIẾU NẠI */}
        <div className="p-8 border-t border-border bg-muted/10">
           {!isFollowupOpen ? (
              <div className="flex flex-col gap-4">
                {canReopen ? (
                  <div className="flex items-center justify-center">
                    <Button 
                        onClick={() => setIsFollowupOpen(true)}
                        className="w-full sm:w-[320px] h-12 rounded-2xl bg-slate-900 border-2 border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white text-white font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all"
                    >
                        Chưa hài lòng / Khiếu nại lại
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-5 bg-muted/30 rounded-[2rem] border border-dashed border-muted text-center animate-in fade-in zoom-in-95">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                      Bản ghi này đang được xử lý. Vui lòng đợi thông báo tiếp theo.
                    </span>
                  </div>
                )}
              </div>
           ) : (
              <div className="animate-in slide-in-from-bottom-4 duration-500 py-2 space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight">{t('auto._id__page_6')}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground opacity-60 tracking-tight">{t('auto._id__page_7')}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsFollowupOpen(false)} className="rounded-full size-8">
                       <X className="size-4 text-muted-foreground" />
                    </Button>
                 </div>

                 {/* Các tùy chọn lý do khiếu nại */}
                 <RadioGroup onValueChange={setFollowupReason} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {REASON_OPTIONS.map((opt) => (
                       <Label key={opt.id} htmlFor={opt.id} className={cn(
                         "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                         followupReason === opt.id 
                           ? "border-secondary bg-secondary/5 text-secondary shadow-sm shadow-secondary/10" 
                           : "border-muted-foreground/10 text-muted-foreground hover:border-muted hover:bg-muted/10 hover:text-foreground"
                       )}>
                          <div className={cn(
                            "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                            followupReason === opt.id ? "border-secondary" : "border-muted-foreground/30"
                          )}>
                             {followupReason === opt.id && <div className="size-2 rounded-full bg-[#FF007A] animate-in zoom-in-50" />}
                          </div>
                          <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                          <span className="text-[11px] font-black uppercase tracking-tight">{opt.label}</span>
                       </Label>
                    ))}
                 </RadioGroup>

                 <div className="space-y-4">
                    <Textarea 
                       placeholder={followupReason === "other" ? "Bắt buộc: Vui lòng mô tả cụ thể lý do bạn muốn khiếu nại lại..." : "Mô tả thêm lý do bạn muốn mở lại yêu cầu hỗ trợ (nếu có)..."}
                       className={cn(
                          "min-h-[140px] p-5 bg-background border-2 transition-all text-xs font-bold leading-relaxed shadow-inner rounded-2xl",
                          followupReason === "other" && !followupComment.trim() ? "border-amber-500/50" : "border-muted/50 focus:border-secondary"
                       )}
                       onChange={(e) => setFollowupComment(e.target.value)}
                    />
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                       <div 
                          onClick={() => document.getElementById('followup-file')?.click()}
                          className="flex-1 flex items-center justify-center gap-3 bg-white dark:bg-slate-900 h-14 rounded-[1.25rem] border-2 border-muted-foreground/10 hover:border-secondary transition-all cursor-pointer shadow-sm group/upload"
                       >
                          <input type="file" id="followup-file" className="hidden" multiple accept="image/*" onChange={(e) => e.target.files && setFollowupFiles(Array.from(e.target.files))} />
                          <Paperclip className={cn("size-4", followupFiles.length > 0 ? "text-secondary" : "text-muted-foreground group-hover/upload:text-secondary")} />
                          <span className={cn("text-[11px] font-black uppercase tracking-widest", followupFiles.length > 0 ? "text-secondary" : "text-muted-foreground group-hover/upload:text-secondary")}>
                             {followupFiles.length > 0 ? `Đã chọn ${followupFiles.length} tệp` : "Đính kèm thêm minh chứng"}
                          </span>
                       </div>
                       
                       <Button 
                          disabled={isSubmittingFollowup || !followupReason}
                          onClick={handleFollowupSubmit}
                          className="flex-1 bg-secondary hover:bg-secondary/90 text-white h-14 rounded-[1.25rem] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-secondary/20 active:scale-95 transition-all"
                       >
                          {isSubmittingFollowup ? "🚀 Đang gửi lại..." : "Gửi yêu cầu mở lại"}
                       </Button>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
