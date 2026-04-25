"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useGetSystemErrorDetailQuery,
  useResolveSystemErrorMutation,
  useAddSystemErrorNoteMutation,
} from "@/store/services/adminSystemErrorApi";
import {
  History,
  Terminal,
  CheckCircle2,
  Send,
  Clock,
  Bug,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Server,
  User,
  FileText,
  Monitor,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { vi, enUS, ja } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SystemErrorDetailSheetProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemErrorDetailSheet = ({
  id,
  open,
  onOpenChange,
}: SystemErrorDetailSheetProps) => {
  const { t, i18n } = useTranslation();
  const dateLocale =
    i18n.language === "vi" ? vi : i18n.language === "ja" ? ja : enUS;

  const { data: errorDetail, isLoading } = useGetSystemErrorDetailQuery(id!, {
    skip: !id,
  });
  const [resolveError, { isLoading: isResolving }] =
    useResolveSystemErrorMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddSystemErrorNoteMutation();
  const [noteText, setNoteText] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["stackTrace"])
  );

  const error = errorDetail?.data;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(t("admin.systemErrors.detail.copied"));
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error(t("common.error"));
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleResolve = async () => {
    if (!id) return;
    try {
      await resolveError({ id, note: resolutionNote }).unwrap();
      toast.success(t("admin.systemErrors.toast.updateSuccess"));
      setResolutionNote("");
    } catch (err: any) {
      toast.error(err.data?.message || t("admin.systemErrors.toast.updateError"));
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    try {
      await addNote({ id, note: noteText }).unwrap();
      toast.success(t("api.success"));
      setNoteText("");
    } catch (err: any) {
      toast.error(err.data?.message || t("api.error"));
    }
  };

  if (isLoading && !error) return null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "WARN":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "INFO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-green-600 dark:text-green-400";
      case "POST":
        return "text-blue-600 dark:text-blue-400";
      case "PUT":
        return "text-amber-600 dark:text-amber-400";
      case "DELETE":
        return "text-red-600 dark:text-red-400";
      case "PATCH":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl md:max-w-3xl p-0 h-full flex flex-col gap-0 border-l">
        <SheetHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Level & Service badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={cn("font-bold text-[10px] px-2 py-0.5", getLevelColor(error?.level || ""))}>
                  {error?.level || "UNKNOWN"}
                </Badge>
                <Badge variant="outline" className="font-semibold text-[10px] px-2 py-0.5">
                  <Server className="h-3 w-3 mr-1" />
                  {error?.service || "Unknown Service"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-bold text-[10px] px-2 py-0.5",
                    error?.resolved
                      ? "border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                      : "border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                  )}
                >
                  {error?.resolved ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {error?.resolved
                    ? t("admin.systemErrors.filter.resolved")
                    : t("admin.systemErrors.filter.pending")}
                </Badge>
              </div>

              {/* Title */}
              <SheetTitle className="text-base font-bold leading-tight text-slate-800 dark:text-slate-100">
                {error?.messageShort}
              </SheetTitle>

              {/* Request ID with copy */}
              <div className="flex items-center gap-2 mt-2">
                <SheetDescription className="font-mono text-[11px] text-muted-foreground break-all">
                  ID: {error?.requestId || "N/A"}
                </SheetDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() =>
                    error?.requestId &&
                    copyToClipboard(error.requestId, "requestId")
                  }
                >
                  {copiedField === "requestId" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error ID */}
            <div className="text-right shrink-0">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                {t("admin.systemErrors.detail.errorId")}
              </div>
              <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                #{error?.id}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Timestamp */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold mb-1">
                  <Clock className="h-3 w-3" />
                  {t("admin.systemErrors.table.timestamp")}
                </div>
                <div className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {error
                    ? format(new Date(error.createdAt), "dd/MM/yyyy", {
                        locale: dateLocale,
                      })
                    : ""}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {error
                    ? format(new Date(error.createdAt), "HH:mm:ss", {
                        locale: dateLocale,
                      })
                    : ""}
                </div>
              </div>

              {/* Method & Path */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg col-span-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold mb-1">
                  <Globe className="h-3 w-3" />
                  {t("admin.systemErrors.detail.path")}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold text-[10px] px-1.5 py-0",
                      getMethodColor(error?.method || "")
                    )}
                  >
                    {error?.method}
                  </Badge>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                    {error?.path}
                  </span>
                </div>
              </div>

              {/* Status Code */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold mb-1">
                  <Terminal className="h-3 w-3" />
                  {t("admin.systemErrors.detail.statusCode")}
                </div>
                <div
                  className={cn(
                    "text-lg font-bold font-mono",
                    (error?.statusCode || 0) >= 500
                      ? "text-red-600 dark:text-red-400"
                      : (error?.statusCode || 0) >= 400
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {error?.statusCode || "N/A"}
                </div>
              </div>
            </div>

            {/* User Context */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold mb-3">
                <User className="h-3 w-3" />
                {t("admin.systemErrors.detail.user")}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground">
                    {t("admin.systemErrors.detail.userId")}:
                  </span>
                  <span className="ml-2 text-xs font-semibold font-mono">
                    {error?.userId || (
                      <span className="italic text-muted-foreground">Anonymous</span>
                    )}
                  </span>
                </div>
                {error?.bookingId && (
                  <div>
                    <span className="text-[10px] text-muted-foreground">
                      {t("admin.systemErrors.detail.bookingId")}:
                    </span>
                    <span className="ml-2 text-xs font-semibold font-mono">
                      #{error.bookingId}
                    </span>
                  </div>
                )}
                {error?.roomId && (
                  <div>
                    <span className="text-[10px] text-muted-foreground">
                      {t("admin.systemErrors.detail.roomId")}:
                    </span>
                    <span className="ml-2 text-xs font-semibold font-mono">
                      #{error.roomId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-2">
              {/* Stack Trace */}
              <div className="border border-slate-200 dark:border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("stackTrace")}
                  className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-red-500" />
                    <span className="font-bold text-xs uppercase">
                      {t("admin.systemErrors.detail.stackTrace")}
                    </span>
                  </div>
                  {expandedSections.has("stackTrace") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.has("stackTrace") && (
                  <div className="bg-slate-900 dark:bg-[#0a0a0a]">
                    <div className="flex justify-end p-2 border-b border-slate-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-slate-400 hover:text-white"
                        onClick={() =>
                          error?.stackTrace &&
                          copyToClipboard(error.stackTrace, "stackTrace")
                        }
                      >
                        {copiedField === "stackTrace" ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            {t("admin.systemErrors.detail.copied")}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            {t("admin.systemErrors.detail.copyToClipboard")}
                          </>
                        )}
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <pre className="p-4 text-[10px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap select-all">
                        {error?.stackTrace || t("admin.systemErrors.detail.noRequestBody")}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Full Message */}
              <div className="border border-slate-200 dark:border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("fullMessage")}
                  className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-bold text-xs uppercase">
                      {t("admin.systemErrors.detail.fullMessage")}
                    </span>
                  </div>
                  {expandedSections.has("fullMessage") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.has("fullMessage") && (
                  <div className="p-4">
                    <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                      {error?.messageFull || error?.messageShort || "N/A"}
                    </pre>
                  </div>
                )}
              </div>

              {/* Request Body */}
              <div className="border border-slate-200 dark:border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("requestBody")}
                  className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-xs uppercase">
                      {t("admin.systemErrors.detail.requestBody")}
                    </span>
                  </div>
                  {expandedSections.has("requestBody") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.has("requestBody") && (
                  <div className="bg-slate-900 dark:bg-[#0a0a0a]">
                    <div className="flex justify-end p-2 border-b border-slate-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-slate-400 hover:text-white"
                        onClick={() =>
                          error?.requestBody &&
                          copyToClipboard(
                            typeof error.requestBody === "string"
                              ? error.requestBody
                              : JSON.stringify(error.requestBody, null, 2),
                            "requestBody"
                          )
                        }
                        disabled={!error?.requestBody}
                      >
                        {copiedField === "requestBody" ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            {t("admin.systemErrors.detail.copied")}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            {t("admin.systemErrors.detail.copyToClipboard")}
                          </>
                        )}
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <pre className="p-4 text-[10px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap select-all">
                        {error?.requestBody
                          ? typeof error.requestBody === "string"
                            ? error.requestBody
                            : JSON.stringify(error.requestBody, null, 2)
                          : t("admin.systemErrors.detail.noRequestBody")}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Environment */}
              <div className="border border-slate-200 dark:border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("environment")}
                  className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-500" />
                    <span className="font-bold text-xs uppercase">
                      {t("admin.systemErrors.detail.environment")}
                    </span>
                  </div>
                  {expandedSections.has("environment") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.has("environment") && (
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">
                          {t("admin.systemErrors.detail.environment")}:
                        </span>
                        <p className="text-xs font-mono mt-1">
                          {error?.environment || "production"}
                        </p>
                      </div>
                      {error?.userAgent && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">
                            {t("admin.systemErrors.detail.userAgent")}:
                          </span>
                          <p className="text-[10px] font-mono mt-1 break-all">
                            {error.userAgent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Investigation Notes Timeline */}
            <div className="border border-slate-200 dark:border-border rounded-lg overflow-hidden">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-border">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  <span className="font-bold text-xs uppercase">
                    {t("admin.systemErrors.detail.investigationNotes")}
                  </span>
                  {error?.notes && error.notes.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {error.notes.length}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-4 relative pl-5 border-l-2 border-slate-200 dark:border-slate-800 ml-2 py-1">
                  {error?.notes && error.notes.length > 0 ? (
                    error.notes.map((note) => (
                      <div key={note.id} className="relative group">
                        <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-card" />
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border p-3 rounded-lg flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {note.authorName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {format(new Date(note.createdAt), "dd/MM HH:mm:ss", {
                                locale: dateLocale,
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {note.note}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-card" />
                      No investigation notes yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resolution Section */}
            {!error?.resolved ? (
              <div className="border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
                <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                  {t("admin.systemErrors.detail.resolutionNote")}
                </h3>
                <Textarea
                  placeholder={t("admin.systemErrors.detail.resolutionPlaceholder")}
                  className="text-xs min-h-[80px] bg-white dark:bg-black border-slate-200 dark:border-border shadow-none rounded-md"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
                <Button
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="w-full font-bold uppercase text-[10px] tracking-widest rounded-md"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("admin.systemErrors.detail.resolve")}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400">
                    {t("admin.systemErrors.filter.resolved")}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {error.resolutionNote || "No resolution notes provided"}
                </p>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                  {t("common.me")}{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {error.resolvedByName}
                  </span>{" "}
                  {t("common.at")}{" "}
                  {format(
                    new Date(error.resolvedAt!),
                    "dd/MM/yyyy HH:mm:ss",
                    { locale: dateLocale }
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Note Footer */}
        <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900 flex gap-2 items-center">
          <Input
            placeholder={t("admin.systemErrors.detail.addInvestigationNote")}
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
            <Send className="h-3 w-3 mr-1" />
            {t("admin.systemErrors.detail.saveNote")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
