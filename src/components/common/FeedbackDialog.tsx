"use client";

/**
 * [I18N COMPONENT - DẢI PHẢN HỒI (FEEDBACK)]
 * Thực hiện:
 * - Bản địa hóa toàn bộ giao diện báo lỗi và đóng góp ý kiến.
 * - Localize các thông báo xác nhận khi bỏ dở (Abandonment Alert) và trạng thái đang gửi.
 * - Tích hợp i18next cho các banner hướng dẫn và nhãn tải lên tệp đính kèm.
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Paperclip,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Bug,
  Info,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialType?: "bug" | "suggest" | "other";
}

export function FeedbackDialog({
  isOpen,
  onClose,
  onSuccess,
  initialType = "bug",
}: FeedbackDialogProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [isAbandonAlertOpen, setIsAbandonAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (content.trim().length > 0) {
      setIsAbandonAlertOpen(true);
    } else {
      onClose();
    }
  };

  const confirmAbandon = () => {
    setContent("");
    setIsAbandonAlertOpen(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error(t("feedback.toast.errorInput"));
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentUrls = "";

      // 1. Tải lên các tệp trước nếu có
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const uploadRes = await api.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.data?.data) {
          attachmentUrls = uploadRes.data.data.join(",");
        }
      }

      // 2. Gửi báo cáo kèm URL tệp đính kèm
      await api.post("/reports", {
        category: "NOTIFICATION",
        title: t("feedback.defaultReportTitle"),
        description: content.trim(),
        priority: "MEDIUM",
        attachmentUrls: attachmentUrls,
      });

      toast.success(t("feedback.toast.success"));
      setContent("");
      setFiles([]);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(t("feedback.toast.errorSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-[550px] p-0 overflow-hidden rounded-[1.25rem] border-none shadow-2xl bg-background font-sans">
          {/* Header */}
          <div className="flex items-center justify-between relative px-6 py-4 border-b border-muted/50 bg-muted/5">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-secondary/10 hover:text-secondary group transition-all"
                onClick={handleClose}
              >
                <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
              </Button>
              <DialogTitle className="text-base font-black uppercase tracking-tight">
                {t("feedback.title")}
              </DialogTitle>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="space-y-3.5">
              <h3 className="text-lg font-black tracking-tight text-foreground">
                {t("feedback.improveTitle")}
              </h3>

              <div className="relative group/textarea">
                <div className="absolute top-2.5 left-4 text-[9px] font-black text-secondary uppercase tracking-widest z-10 opacity-70 group-focus-within/textarea:opacity-100 transition-opacity">
                  {t("feedback.detailLabel")}
                </div>
                <Textarea
                  placeholder={t("feedback.placeholder")}
                  className="min-h-[140px] pt-8 pb-3 px-4 bg-muted/15 border-2 border-muted/50 hover:border-secondary/30 focus:border-secondary focus:ring-0 rounded-xl resize-none transition-all text-xs font-bold leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  className="w-full h-auto py-3 px-4 bg-muted/20 border-2 border-dashed border-muted hover:border-secondary/30 hover:bg-secondary/5 rounded-xl flex items-center justify-center gap-2 transition-all group/btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-3.5 text-muted-foreground group-hover/btn:text-secondary" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/btn:text-secondary">
                    {t("feedback.uploadBtn")}
                  </span>
                </Button>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="group relative size-14 rounded-lg border border-muted bg-muted/20 overflow-hidden animate-in zoom-in-50"
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground bg-muted/10">
                            <Paperclip className="size-5" />
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 size-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="p-3.5 rounded-xl bg-muted/10 border border-muted/20 space-y-1.5">
              <p className="text-[11px] font-bold leading-relaxed text-muted-foreground">
                {t("feedback.disclaimer")}
                <Link
                  href="/help"
                  className="text-secondary font-black hover:underline uppercase tracking-tight"
                >
                  {t("feedback.helpCenter")}
                </Link>
                .
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                className="text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:text-[#FF007A] hover:bg-[#FF007A]/5 px-8 h-10 rounded-xl transition-all"
                onClick={handleClose}
              >
                {t("feedback.btnCancel")}
              </Button>
              <Button
                className={cn(
                  "px-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 h-10",
                  content.trim().length > 0
                    ? "bg-secondary hover:bg-secondary/90 hover:shadow-secondary/20"
                    : "bg-muted text-muted-foreground pointer-events-none opacity-50",
                )}
                disabled={isSubmitting || content.trim().length === 0}
                onClick={handleSubmit}
              >
                {isSubmitting ? t("feedback.sending") : t("feedback.btnSubmit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Abandon Confirmation Alert */}
      <AlertDialog
        open={isAbandonAlertOpen}
        onOpenChange={setIsAbandonAlertOpen}
      >
        <AlertDialogContent className="rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-[400px]">
          <div className="relative flex items-center justify-center py-4 border-b border-muted/50 bg-muted/10">
            <AlertDialogTitle className="text-base font-black uppercase tracking-tight">
              {t("feedback.abandonTitle")}
            </AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-2.5 rounded-full hover:bg-muted/60 size-8 transition-colors"
              onClick={() => setIsAbandonAlertOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="p-5 space-y-5">
            <AlertDialogDescription className="text-sm font-bold text-muted-foreground text-center px-4 leading-relaxed">
              {t("feedback.abandonDesc")}
            </AlertDialogDescription>

            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                variant="ghost"
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-[#FF007A] hover:bg-[#FF007A]/5 h-11 rounded-xl"
                onClick={() => setIsAbandonAlertOpen(false)}
              >
                {t("feedback.btnContinue")}
              </Button>
              <Button
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-widest text-[10px] h-11 rounded-xl shadow-lg shadow-secondary/20 transition-all active:scale-95"
                onClick={confirmAbandon}
              >
                {t("feedback.btnDiscard")}
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
