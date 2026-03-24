"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminUser } from "./UserTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Lock,
  ShieldCheck as ShieldStatus,
  AlertTriangle,
  Activity,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
  History,
  MessageSquareWarning,
  UserX,
  UserCheck,
  X,
  Calendar,
  Settings,
  FileDown,
  Filter
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { exportViolationLogsToExcel } from "@/lib/excelUtils";

export const renderPaginationItems = (currentPage: number, totalPages: number, setCurrentPage: (page: number) => void) => {
  const items = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 0; i < totalPages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={currentPage === i}
            onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    items.push(
      <PaginationItem key={0}>
        <PaginationLink
          isActive={currentPage === 0}
          onClick={(e) => { e.preventDefault(); setCurrentPage(0); }}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (currentPage > 2) items.push(<PaginationEllipsis key="left-ellipsis" />);

    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 3) items.push(<PaginationEllipsis key="right-ellipsis" />);

    items.push(
      <PaginationItem key={totalPages - 1}>
        <PaginationLink
          isActive={currentPage === totalPages - 1}
          onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages - 1); }}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );
  }
  return items;
};

const getRoleName = (r: string) => {
  switch (r) {
    case 'STUDENT': return 'Học viên';
    case 'INSTRUCTOR': return 'Giảng viên';
    case 'ADMIN': return 'Quản trị viên';
    default: return r;
  }
};

interface UserDetailModalProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

/**
 * Component Modal hiển thị và chỉnh sửa chi tiết người dùng
 * Bao gồm: Thông tin cá nhân, phân quyền truy cập, và nhật ký vi phạm/hoạt động
 */
export function UserDetailModal({ user, open, onOpenChange, onUserUpdated }: UserDetailModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    isActive: true,
    examAccess: true,
    contentAccess: true,
    chatAccess: true,
    expiryDate: "",
    deviceLimit: 1,
    courseCreateAccess: true,
    gradeAccess: true,
    analyticsAccess: true,
  });
  const [chartRange, setChartRange] = useState<'day' | 'week' | 'month'>('week');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [roleChangeWarning, setRoleChangeWarning] = useState<string | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logSeverity, setLogSeverity] = useState("all");
  const [logStatus, setLogStatus] = useState("all");
  const [showSendWarning, setShowSendWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showConfirmHandleLog, setShowConfirmHandleLog] = useState<{ id: number, description: string } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<string[]>([]);
  const [newTemplate, setNewTemplate] = useState("");
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [showConfirmRoleChange, setShowConfirmRoleChange] = useState(false);
  const [pendingRole, setPendingRole] = useState("");
  const [showConfirmSendWarningDialog, setShowConfirmSendWarningDialog] = useState(false);
  const [instructorLogSearch, setInstructorLogSearch] = useState("");
  const [instructorLogSeverity, setInstructorLogSeverity] = useState("all");
  const [instructorLogStatus, setInstructorLogStatus] = useState("all");
  const [selectedInstructorLogs, setSelectedInstructorLogs] = useState<number[]>([]);
  const [studentLogPage, setStudentLogPage] = useState(0);
  const [instructorLogPage, setInstructorLogPage] = useState(0);
  const [adminLogPage, setAdminLogPage] = useState(0);
  const PAGE_SIZE = 5;

  useEffect(() => {
    const saved = localStorage.getItem("warning_templates");
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (e) {
        setCustomTemplates([]);
      }
    }
  }, []);

  const saveTemplate = () => {
    if (!warningMessage.trim() || customTemplates.includes(warningMessage.trim())) return;
    const updated = [...customTemplates, warningMessage.trim()];
    setCustomTemplates(updated);
    localStorage.setItem("warning_templates", JSON.stringify(updated));
    toast.success("Đã lưu mẫu cảnh báo mới");
  };

  const removeTemplate = (t: string) => {
    const updated = customTemplates.filter(item => item !== t);
    setCustomTemplates(updated);
    localStorage.setItem("warning_templates", JSON.stringify(updated));
  };

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "STUDENT",
        isActive: user.isActive,
        examAccess: user.examAccess ?? true,
        contentAccess: user.contentAccess ?? true,
        chatAccess: user.chatAccess ?? true,
        expiryDate: user.expiryDate || "",
        deviceLimit: user.deviceLimit ?? 1,
        courseCreateAccess: user.courseCreateAccess ?? true,
        gradeAccess: user.gradeAccess ?? true,
        analyticsAccess: user.analyticsAccess ?? true,
      });
      setRoleChangeWarning(null);
      setWarningMessage("");
      setInstructorLogSearch("");
      setSelectedInstructorLogs([]);
      setStudentLogPage(0);
      setInstructorLogPage(0);
      setAdminLogPage(0);
    }
  }, [user]);

  const riskLevel = useMemo(() => {
    const violationsCount = user?.violationLogs?.length || 0;

    if (violationsCount === 0) return { label: "Thấp", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: <ShieldStatus className="size-4" /> };
    if (violationsCount <= 2) return { label: "Trung bình", color: "text-amber-500", bg: "bg-amber-500/10", icon: <Activity className="size-4" /> };
    return { label: "Cao", color: "text-rose-500", bg: "bg-rose-500/10", icon: <AlertTriangle className="size-4" /> };
  }, [user?.violationLogs]);

  const filteredLogs = useMemo(() => {
    if (!user?.violationLogs) return [];

    // First apply filters
    const filtered = (user?.violationLogs || []).filter(log => {
      const searchTerms = [
        log.description,
        log.testId,
        log.type,
        log.ipAddress,
        log.browser,
        log.device
      ].filter(Boolean).map(s => s?.toLowerCase());
      
      const matchesSearch = logSearch.trim() === "" || searchTerms.some(term => term?.includes(logSearch.toLowerCase()));
      const matchesSeverity = logSeverity === "all" || log.severity === logSeverity;
      const matchesStatus = logStatus === "all" || (logStatus === "HANDLED" ? log.isHandled : !log.isHandled);
      return matchesSearch && matchesSeverity && matchesStatus;
    });

    // Then group identical logs occurring close in time (within same hour for same description)
    const grouped: any[] = [];
    filtered.forEach(log => {
      const last = grouped[grouped.length - 1];
      const logTime = new Date(log.createdAt).getTime();
      const lastTime = last ? new Date(last.createdAt).getTime() : 0;

      if (last && last.description === log.description && last.testId === log.testId && (lastTime - logTime) < 3600000) {
        last.count = (last.count || 1) + 1;
        // Keep the newest ID or some reference if needed
      } else {
        grouped.push({ ...log, count: 1 });
      }
    });

    return grouped;
  }, [user?.violationLogs, logSearch, logSeverity]);

  const filteredInstructorLogs = useMemo(() => {
    if (!user?.violationLogs) return [];

    return (user?.violationLogs || []).filter(log => {
      const isInstructorLog = log.type?.startsWith('LATE') || log.type?.startsWith('MISSING');
      if (!isInstructorLog) return false;

      const searchTerms = [
        log.description,
        log.type,
        log.ipAddress,
        log.browser,
        log.device
      ].filter(Boolean).map(s => s?.toLowerCase());

      const matchesSearch = instructorLogSearch.trim() === "" || searchTerms.some(term => term?.includes(instructorLogSearch.toLowerCase()));
      const matchesSeverity = instructorLogSeverity === "all" || log.severity === instructorLogSeverity;
      const matchesStatus = instructorLogStatus === "all" || (instructorLogStatus === "HANDLED" ? log.isHandled : !log.isHandled);
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [user?.violationLogs, instructorLogSearch, instructorLogSeverity, instructorLogStatus]);

  const trendData = useMemo(() => {
    if (!user?.violationLogs) return [];
    const counts: Record<string, number> = {};
    const rangeInDays = chartRange === 'day' ? 1 : chartRange === 'week' ? 7 : 30;

    for (let i = rangeInDays - 1; i >= 0; i--) {
      const date = format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'dd/MM');
      counts[date] = 0;
    }

    user.violationLogs.forEach(log => {
      const date = format(new Date(log.createdAt), 'dd/MM');
      if (counts[date] !== undefined) counts[date]++;
    });

    return Object.entries(counts).map(([date, value]) => ({ date, value }));
  }, [user?.violationLogs, chartRange]);

  const handleRoleChange = (newRole: string) => {
    if (!user) return;
    setFormData(prev => ({ ...prev, role: newRole }));
    if (newRole !== user.role) {
      setRoleChangeWarning(`Bạn đang thay đổi vai trò. Người dùng này sẽ buộc phải đăng nhập lại.`);
    } else {
      setRoleChangeWarning(null);
    }
  };

  const handleRoleChangeIntent = (newRole: string) => {
    if (newRole === user?.role) {
      handleRoleChange(newRole);
      return;
    }
    setPendingRole(newRole);
    setShowConfirmRoleChange(true);
  };

  const confirmRoleChange = () => {
    handleRoleChange(pendingRole);
    setShowConfirmRoleChange(false);
  };

  const handleBulkHandleLogs = async () => {
    if (selectedLogs.length === 0 || !user) return;
    setIsSubmitting(true);
    try {
      await Promise.all(selectedLogs.map(id => api.post(`/users/me/violations/${id}/handle`)));
      toast.success(`Đã xử lý thành công ${selectedLogs.length} sự cố`);
      setSelectedLogs([]);
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error("Lỗi khi xử lý hàng loạt sự cố");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsHandled = async (id: number) => {
    setIsSubmitting(true);
    try {
      const response = await api.post(`/users/me/violations/${id}/handle`);
      if (response.data.success) {
        toast.success("Đã xử lý sự cố thành công");
        setShowConfirmHandleLog(null);
        if (onUserUpdated) onUserUpdated();
      } else {
        toast.error(response.data.message || "Không thể xử lý vi phạm");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xử lý sự cố");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      toast.error("Họ tên phải có ít nhất 3 ký tự");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      toast.error("Email không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(`/users/me/${user.id}`, {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        examAccess: formData.examAccess,
        contentAccess: formData.contentAccess,
        chatAccess: formData.chatAccess,
        expiryDate: formData.expiryDate || null,
        deviceLimit: formData.deviceLimit,
        courseCreateAccess: formData.courseCreateAccess,
        gradeAccess: formData.gradeAccess,
        analyticsAccess: formData.analyticsAccess,
      });
      if (response.data.success) {
        toast.success("Cập nhật thông tin thành công");
        if (onUserUpdated) onUserUpdated();
        onOpenChange(false);
      } else {
        toast.error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi hệ thống khi cập nhật");
    } finally {
      setIsSubmitting(false);
      setShowConfirmSave(false);
    }
  };

  const handleResetViolations = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await api.post(`/users/me/${user.id}/reset-violations`);
      toast.success("Đã xóa toàn bộ lịch sử vi phạm");
      if (onUserUpdated) onUserUpdated();
      setShowConfirmReset(false);
      onOpenChange(false);
    } catch (err) {
      toast.error("Lỗi khi reset vi phạm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockAccount = async () => {
    if (!user) return;
    if (user.role === 'ADMIN') {
      toast.error("Không thể khóa tài khoản QUẢN TRỊ VIÊN.");
      return;
    }
    setShowConfirmLock(true);
  };

  const handleLockAccountConfirm = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const response = await api.put(`/users/me/${user.id}`, { isActive: !user.isActive });
      if (response.data.success) {
        toast.success(user.isActive ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công");
        // Update user list and close
        if (onUserUpdated) onUserUpdated();
        onOpenChange(false);
      } else {
        toast.error(response.data.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi hệ thống khi thay đổi trạng thái");
    } finally {
      setIsSubmitting(false);
      setShowConfirmLock(false);
    }
  };

  const handleSendWarning = async () => {
    if (!user || !warningMessage.trim()) {
      toast.error("Vui lòng nhập nội dung cảnh báo");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/users/me/${user.id}/warning`, { message: warningMessage });
      toast.success("Đã gửi cảnh báo tới người dùng");
      setShowSendWarning(false);
      setWarningMessage("");
    } catch (err) {
      toast.error("Lỗi khi gửi cảnh báo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudent = user?.role === "STUDENT";
  const isInstructor = user?.role === "INSTRUCTOR";

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl sm:rounded-2xl lg:max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-card font-sans">
          {/* Header Section */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Chi tiết người dùng
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground tracking-tight leading-none">
                  {user.identificationCode || `UID-${user.id.toString().padStart(6, '0')}`}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`px-3 py-1 text-[11px] font-semibold ${riskLevel.bg} ${riskLevel.color} border-none`}>
                  Mức độ rủi ro: {riskLevel.label}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content Areas */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/5">
              {/* Section 1: Identity & Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 shadow-sm border-border rounded-xl overflow-hidden bg-card">
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <Avatar className="size-28 rounded-full border-2 border-border shadow-sm">
                        <AvatarImage src={user.avatarUrl || ""} alt={user.username} className="object-cover" />
                        <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full text-[10px] font-bold border-2 border-card shadow-sm ${user.isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {user.isActive ? "ONLINE" : "LOCKED"}
                      </div>
                    </div>
                    <h4 className="font-bold text-xl text-foreground mb-1">{user.username}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-medium">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  <Card className="col-span-2 shadow-sm border-border rounded-xl bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                          {formData.role === "STUDENT" ? "Tần suất vi phạm" :
                            formData.role === "INSTRUCTOR" ? "Tỉ lệ chuyên cần" :
                              "Tác vụ hệ thống"}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {['day', 'week', 'month'].map((r) => (
                            <button
                              key={r}
                              onClick={() => setChartRange(r as any)}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${chartRange === r ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                            >
                              {r === 'day' ? '24h' : r === 'week' ? 'Tuần' : 'Tháng'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-24 w-full flex-1 ml-4 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <XAxis dataKey="date" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                            <Tooltip
                              cursor={{ stroke: '#eee', strokeWidth: 1 }}
                              contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', padding: '8px' }}
                              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={formData.role === "STUDENT" ? (trendData.some(d => d.value > 5) ? "#f43f5e" : "#f59e0b") : "#3b82f6"}
                              strokeWidth={3}
                              dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Card>

                  <Card className="shadow-sm border-border rounded-xl bg-card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">Ngày gia nhập</span>
                      <Activity className="size-3 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-bold">{user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : "Chưa có dữ liệu"}</div>
                  </Card>

                  <Card className="shadow-sm border-border rounded-xl bg-card p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">Lần cuối truy cập</span>
                      <RotateCcw className="size-3 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground tabular-nums">
                      {user.lastActiveAt ? format(new Date(user.lastActiveAt), 'HH:mm dd/MM') : "Chưa có dữ liệu"}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Section 2: Management & Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b bg-muted/20">
                    <CardTitle className="text-xs font-bold text-foreground tracking-wider flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary" />
                      Cấp bậc & Vai trò
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground">Vai trò quản lý</Label>
                        <Select value={formData.role} onValueChange={handleRoleChangeIntent}>
                          <SelectTrigger className="h-9 border-border rounded-lg text-xs font-bold bg-muted/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STUDENT">Học viên</SelectItem>
                            <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
                            <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {roleChangeWarning && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                          {roleChangeWarning}
                        </p>
                      </div>
                    )}

                    {formData.role === "INSTRUCTOR" && (
                      <div className="py-2 text-center border-t border-border/50 italic text-[10px] text-muted-foreground">
                        Sử dụng khung hiển thị chi tiết bên dưới để quản lý chuyên cần của giảng viên.
                      </div>
                    )}

                    {formData.role === "STUDENT" && (
                      <div className="py-4 text-center border-t border-border/50 italic text-[11px] text-muted-foreground">
                        Sử dụng tab Bảo mật & Chống gian lận bên dưới để quản lý các quyền truy cập đặc biệt của học viên.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b bg-muted/20">
                    <CardTitle className="text-xs font-bold text-foreground tracking-wider flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-blue-500" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Họ và tên đầy đủ</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="h-10 border-border rounded-lg text-sm bg-background"
                        placeholder="Nhập họ và tên..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Địa chỉ Email</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10 border-border rounded-lg text-sm bg-background"
                        placeholder="example@fuji.edu.vn"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 3: Role-Specific Details */}

              {/* Case: STUDENT */}
              {formData.role === "STUDENT" && (
                <div className="space-y-6">
                  <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold tracking-wider flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-rose-500" />
                        Nhật ký bảo mật & Chống gian lận
                      </CardTitle>
                    </CardHeader>

                    {/* Student Toolbar */}
                    <div className="p-4 border-b bg-muted/5 flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setShowSendWarning(true)}
                            className="h-9 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] hover:bg-amber-500/20 gap-2 shadow-sm"
                          >
                            <MessageSquareWarning className="size-3.5" />
                            Gửi cảnh báo cho người dùng
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => exportViolationLogsToExcel(filteredLogs, user?.username || 'Student')}
                            className="h-9 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] hover:bg-emerald-500/20 gap-2 shadow-sm"
                          >
                            <FileDown className="size-3.5" />
                            Xuất Excel
                          </Button>
                          {selectedLogs.length > 0 && (
                            <Button
                              onClick={handleBulkHandleLogs}
                              disabled={isSubmitting}
                              className="h-8 px-3 rounded-full font-bold text-[9px] bg-primary text-white shadow-sm animate-in fade-in slide-in-from-left-1 transition-all"
                            >
                              Xử lý {selectedLogs.length} mục
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Tìm theo mô tả, IP, loại..."
                              className="h-9 w-[280px] pl-9 border-border bg-background text-[11px] rounded-full shadow-sm"
                              value={logSearch}
                              onChange={(e) => setLogSearch(e.target.value)}
                            />
                          </div>
                          <Select value={logSeverity} onValueChange={(val) => { setLogSeverity(val); setStudentLogPage(0); }}>
                            <SelectTrigger className="h-9 w-[130px] bg-background border-border text-[11px] font-bold rounded-full shadow-sm">
                              <SelectValue placeholder="Mức độ" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-2xl">
                              <SelectItem value="all" className="text-[11px] font-bold">Tất cả mức độ</SelectItem>
                              <SelectItem value="LOW" className="text-[11px] font-bold">Mức độ: Thấp</SelectItem>
                              <SelectItem value="MEDIUM" className="text-[11px] font-bold">Mức độ: T.bình</SelectItem>
                              <SelectItem value="HIGH" className="text-[11px] font-bold">Mức độ: Cao</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={logStatus} onValueChange={(val) => { setLogStatus(val); setStudentLogPage(0); }}>
                            <SelectTrigger className="h-9 w-[140px] bg-background border-border text-[11px] font-bold rounded-full shadow-sm">
                              <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-2xl">
                              <SelectItem value="all" className="text-[11px] font-bold">Tất cả trạng thái</SelectItem>
                              <SelectItem value="HANDLED" className="text-[11px] font-bold">Đã xử lý</SelectItem>
                              <SelectItem value="UNHANDLED" className="text-[11px] font-bold">Chưa xử lý</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border">
                              <th className="p-4 w-10">
                                <Checkbox
                                  checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) setSelectedLogs(filteredLogs.map(l => l.id));
                                    else setSelectedLogs([]);
                                  }}
                                />
                              </th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider">Thời gian</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider">Mô tả</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider text-center">Mức độ</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider text-center">Trạng thái</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredLogs.length > 0 ? (
                              filteredLogs.slice(studentLogPage * PAGE_SIZE, (studentLogPage + 1) * PAGE_SIZE).map((log) => (
                                <tr key={log.id} className={`hover:bg-muted/20 transition-all cursor-default group ${selectedLogs.includes(log.id) ? 'bg-primary/5' : ''}`}>
                                  <td className="p-4 align-middle">
                                    <Checkbox
                                      checked={selectedLogs.includes(log.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) setSelectedLogs([...selectedLogs, log.id]);
                                        else setSelectedLogs(selectedLogs.filter(id => id !== log.id));
                                      }}
                                    />
                                  </td>
                                  <td className="p-4 align-top">
                                    <div className="text-xs font-bold text-foreground tabular-nums">{format(new Date(log.createdAt), 'dd/MM/yyyy')}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium">{format(new Date(log.createdAt), 'HH:mm')}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-xs font-bold text-foreground/80 leading-tight flex items-center gap-2">
                                      {log.description}
                                      {log.count > 1 && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-bold bg-muted/50 text-muted-foreground rounded-full">
                                          x{log.count}
                                        </Badge>
                                      )}
                                    </div>
                                    {log.testId && (
                                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                        Bài thi: <span className="font-bold">{log.testId}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center align-middle">
                                    <Badge variant="outline" className={`h-5 text-[9px] font-bold border-none shadow-none px-2.5 rounded-full ${log.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                                        log.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500'
                                      }`}>
                                      {log.severity === 'HIGH' ? "Cao" : log.severity === 'MEDIUM' ? "Trung bình" : "Thấp"}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-center align-middle">
                                    <Badge variant="secondary" className={`h-5 text-[9px] font-bold px-2 rounded-full border-none ${log.isHandled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                      }`}>
                                      {log.isHandled ? "Đã xử lý" : "Chưa xử lý"}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-right align-middle">
                                    <div className="flex justify-end items-center">
                                      {log.isHandled ? (
                                        <div className="h-8 w-[110px] flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-sm select-none">
                                          <CheckCircle2 className="size-3" />
                                          <span className="text-[9px] font-bold">Đã giải quyết</span>
                                        </div>
                                      ) : (
                                        <Button
                                          onClick={() => setShowConfirmHandleLog({ id: log.id, description: log.description })}
                                          className="h-8 w-[110px] text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-all hover:bg-amber-500/20"
                                        >
                                          <CheckCircle2 className="size-3" />
                                          Xử lý ngay
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-16 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <ShieldStatus className="size-10 text-muted/30" />
                                    <span className="text-xs font-semibold text-muted-foreground tracking-wider">Không tìm thấy dữ liệu vi phạm</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {Math.ceil(filteredLogs.length / PAGE_SIZE) > 1 && (
                        <div className="p-4 border-t border-border flex justify-between items-center bg-muted/5">
                          <span className="text-[10px] font-bold text-muted-foreground tracking-widest pl-2 whitespace-nowrap">
                            {filteredLogs.length} kết quả
                          </span>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); setStudentLogPage(p => Math.max(0, p - 1)); }}
                                  aria-disabled={studentLogPage === 0}
                                  className={studentLogPage === 0 ? "pointer-events-none opacity-50" : ""}
                                />
                              </PaginationItem>
                              {renderPaginationItems(studentLogPage, Math.ceil(filteredLogs.length / PAGE_SIZE), setStudentLogPage)}
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); setStudentLogPage(p => Math.min(Math.ceil(filteredLogs.length / PAGE_SIZE) - 1, p + 1)); }}
                                  aria-disabled={studentLogPage >= Math.ceil(filteredLogs.length / PAGE_SIZE) - 1}
                                  className={studentLogPage >= Math.ceil(filteredLogs.length / PAGE_SIZE) - 1 ? "pointer-events-none opacity-50" : ""}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold tracking-wider flex items-center gap-2 text-foreground">
                        <Lock className="size-4 text-rose-500" />
                        Quyền truy cập & Giới hạn
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] font-bold bg-rose-50 text-rose-600 border-none h-5">Cấu hình nâng cao</Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="exam-access" className="text-sm font-medium text-foreground">Truy cập bài thi</Label>
                            <Switch
                              id="exam-access"
                              checked={formData.examAccess}
                              onCheckedChange={(checked) => setFormData({ ...formData, examAccess: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="content-access" className="text-sm font-medium text-foreground">Truy cập nội dung</Label>
                            <Switch
                              id="content-access"
                              checked={formData.contentAccess}
                              onCheckedChange={(checked) => setFormData({ ...formData, contentAccess: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="chat-access" className="text-sm font-medium text-foreground">Truy cập trò chuyện</Label>
                            <Switch
                              id="chat-access"
                              checked={formData.chatAccess}
                              onCheckedChange={(checked) => setFormData({ ...formData, chatAccess: checked })}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="device-limit" className="text-sm font-medium text-foreground">Giới hạn thiết bị</Label>
                            <Input
                              id="device-limit"
                              type="number"
                              min="1"
                              value={formData.deviceLimit}
                              onChange={(e) => setFormData({ ...formData, deviceLimit: parseInt(e.target.value) || 1 })}
                              className="h-10 border-border rounded-lg text-sm bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expiry-date" className="text-sm font-medium text-foreground">Ngày hết hạn tài khoản</Label>
                            <Input
                              id="expiry-date"
                              type="date"
                              value={formData.expiryDate}
                              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                              className="h-10 border-border rounded-lg text-sm bg-background"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Case: INSTRUCTOR */}
              {formData.role === "INSTRUCTOR" && (
                <div className="space-y-6">
                  <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold tracking-wider flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-blue-500" />
                        Nhật ký giảng dạy & Chuyên cần
                      </CardTitle>
                    </CardHeader>

                    {/* Instructor Toolbar */}
                    <div className="p-4 border-b bg-muted/5 flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setShowSendWarning(true)}
                            className="h-9 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] hover:bg-amber-500/20 gap-2 shadow-sm"
                          >
                            <MessageSquareWarning className="size-3.5" />
                            Gửi cảnh báo cho người dùng
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => exportViolationLogsToExcel(filteredInstructorLogs, user?.username || 'Instructor')}
                            className="h-9 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] hover:bg-emerald-500/20 gap-2 shadow-sm"
                          >
                            <FileDown className="size-3.5" />
                            Xuất Excel
                          </Button>
                          {selectedInstructorLogs.length > 0 && (
                            <Button
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  await Promise.all(selectedInstructorLogs.map(id => api.post(`/users/me/violations/${id}/handle`)));
                                  toast.success(`Đã xử lý ${selectedInstructorLogs.length} sự cố`);
                                  setSelectedInstructorLogs([]);
                                  if (onUserUpdated) onUserUpdated();
                                } catch (e) {
                                  toast.error("Lỗi khi xử lý hàng loạt");
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="h-8 px-3 rounded-full font-bold text-[9px] bg-primary text-white shadow-sm animate-in fade-in slide-in-from-left-1 transition-all"
                            >
                              Xử lý {selectedInstructorLogs.length} mục
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Tìm theo mô tả, IP, loại..."
                              className="h-9 w-[280px] pl-9 border-border bg-background text-[11px] rounded-full shadow-sm"
                              value={instructorLogSearch}
                              onChange={(e) => setInstructorLogSearch(e.target.value)}
                            />
                          </div>
                          <Select value={instructorLogSeverity} onValueChange={(val) => { setInstructorLogSeverity(val); setInstructorLogPage(0); }}>
                            <SelectTrigger className="h-9 w-[130px] bg-background border-border text-[11px] font-bold rounded-full shadow-sm">
                              <SelectValue placeholder="Mức độ" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-2xl">
                              <SelectItem value="all" className="text-[11px] font-bold">Tất cả mức độ</SelectItem>
                              <SelectItem value="LOW" className="text-[11px] font-bold">Mức độ: Thấp</SelectItem>
                              <SelectItem value="MEDIUM" className="text-[11px] font-bold">Mức độ: T.bình</SelectItem>
                              <SelectItem value="HIGH" className="text-[11px] font-bold">Mức độ: Cao</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={instructorLogStatus} onValueChange={(val) => { setInstructorLogStatus(val); setInstructorLogPage(0); }}>
                            <SelectTrigger className="h-9 w-[140px] bg-background border-border text-[11px] font-bold rounded-full shadow-sm">
                              <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-2xl">
                              <SelectItem value="all" className="text-[11px] font-bold">Tất cả trạng thái</SelectItem>
                              <SelectItem value="HANDLED" className="text-[11px] font-bold">Đã xử lý</SelectItem>
                              <SelectItem value="UNHANDLED" className="text-[11px] font-bold">Chưa xử lý</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border">
                              <th className="p-4 w-10">
                                <Checkbox
                                  checked={selectedInstructorLogs.length === filteredInstructorLogs.length && filteredInstructorLogs.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) setSelectedInstructorLogs(filteredInstructorLogs.map(l => l.id));
                                    else setSelectedInstructorLogs([]);
                                  }}
                                />
                              </th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider">Thời gian</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider">Hành động</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider text-center">Mức độ</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider text-center">Trạng thái</th>
                              <th className="p-4 text-[10px] font-bold text-muted-foreground tracking-wider text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredInstructorLogs.length > 0 ? (
                              filteredInstructorLogs.slice(instructorLogPage * PAGE_SIZE, (instructorLogPage + 1) * PAGE_SIZE).map((log) => (
                                <tr key={log.id} className={`hover:bg-muted/20 transition-all cursor-default group ${selectedInstructorLogs.includes(log.id) ? 'bg-primary/5' : ''}`}>
                                  <td className="p-4 align-middle">
                                    <Checkbox
                                      checked={selectedInstructorLogs.includes(log.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) setSelectedInstructorLogs([...selectedInstructorLogs, log.id]);
                                        else setSelectedInstructorLogs(selectedInstructorLogs.filter(id => id !== log.id));
                                      }}
                                    />
                                  </td>
                                  <td className="p-4 align-top">
                                    <div className="text-xs font-bold text-foreground tabular-nums">{format(new Date(log.createdAt), 'dd/MM/yyyy')}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium">{format(new Date(log.createdAt), 'HH:mm')}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-xs font-bold text-foreground/80 leading-tight flex items-center gap-2">
                                      {log.description}
                                    </div>
                                  </td>
                                  <td className="p-4 text-center align-middle">
                                    <Badge variant="outline" className={`h-5 text-[9px] font-bold border-none shadow-none px-2.5 rounded-full ${log.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                                        log.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500'
                                      }`}>
                                      {log.severity === 'HIGH' ? "Cao" : log.severity === 'MEDIUM' ? "Trung bình" : "Thấp"}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-center align-middle">
                                    <Badge variant="secondary" className={`h-5 text-[9px] font-bold px-2 rounded-full border-none ${log.isHandled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                      }`}>
                                      {log.isHandled ? "Đã xử lý" : "Chưa xử lý"}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-right align-middle">
                                    <div className="flex justify-end items-center">
                                      {log.isHandled ? (
                                        <div className="h-8 w-[110px] flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-sm select-none">
                                          <CheckCircle2 className="size-3" />
                                          <span className="text-[9px] font-bold">Đã giải quyết</span>
                                        </div>
                                      ) : (
                                        <Button
                                          onClick={() => setShowConfirmHandleLog({ id: log.id, description: log.description })}
                                          className="h-8 w-[110px] text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-all hover:bg-amber-500/20"
                                        >
                                          <CheckCircle2 className="size-3" />
                                          Xử lý ngay
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-16 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <ShieldStatus className="size-10 text-muted/30" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Không tìm thấy dữ liệu vi phạm</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {Math.ceil(filteredInstructorLogs.length / PAGE_SIZE) > 1 && (
                        <div className="p-4 border-t border-border flex justify-between items-center bg-muted/5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2 whitespace-nowrap">
                            {filteredInstructorLogs.length} kết quả
                          </span>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); setInstructorLogPage(p => Math.max(0, p - 1)); }}
                                  aria-disabled={instructorLogPage === 0}
                                  className={instructorLogPage === 0 ? "pointer-events-none opacity-50" : ""}
                                />
                              </PaginationItem>
                              {renderPaginationItems(instructorLogPage, Math.ceil(filteredInstructorLogs.length / PAGE_SIZE), setInstructorLogPage)}
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); setInstructorLogPage(p => Math.min(Math.ceil(filteredInstructorLogs.length / PAGE_SIZE) - 1, p + 1)); }}
                                  aria-disabled={instructorLogPage >= Math.ceil(filteredInstructorLogs.length / PAGE_SIZE) - 1}
                                  className={instructorLogPage >= Math.ceil(filteredInstructorLogs.length / PAGE_SIZE) - 1 ? "pointer-events-none opacity-50" : ""}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                        <TrendingUp className="size-4 text-emerald-500" />
                        Chỉ số chuyên cần & Hiệu suất giảng dạy
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border-none h-5">Dữ liệu thời gian thực</Badge>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div className="md:col-span-2 space-y-6">
                          <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-100 flex items-start gap-4">
                            <div className="size-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-200 shrink-0">
                              <Calendar className="size-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-orange-900">Thống kê tự động</p>
                              <p className="text-[11px] text-orange-800/70 leading-relaxed font-medium">
                                Các chỉ số như <b>Vào lớp muộn, Thiếu giáo án, Sai lộ trình</b> được hệ thống đào tạo cập nhật tự động hàng giờ.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-muted/30 border border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/40 transition-all cursor-default group">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Số buổi muộn / Nghỉ</span>
                              <span className="text-3xl font-black text-rose-500 tabular-nums">
                                {(user?.violationLogs?.filter(l => l.type?.startsWith('LATE') || l.type?.startsWith('MISSING')).length ?? 0).toString().padStart(2, '0')}
                              </span>
                              <div className="text-[9px] font-bold py-0.5 px-2 bg-rose-500/10 text-rose-600 rounded-full">Dữ liệu từ hệ thống đào tạo</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-muted/30 border border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/40 transition-all cursor-default group">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Tỉ lệ chuyên cần</span>
                              <span className="text-3xl font-black text-emerald-500 tabular-nums">
                                {(() => {
                                  const lateCount = user?.violationLogs?.filter(l => l.type?.startsWith('LATE') || l.type?.startsWith('MISSING')).length ?? 0;
                                  if (lateCount === 0) return "100%";
                                  if (lateCount < 3) return "98%";
                                  if (lateCount < 5) return "95%";
                                  return "90%";
                                })()}
                              </span>
                              <div className="text-[9px] font-bold py-0.5 px-2 bg-emerald-500/10 text-emerald-600 rounded-full">Dự kiến dựa trên nhật ký</div>
                            </div>
                          </div>
                        </div>

                        <div className="w-full flex flex-col justify-center items-center py-10 px-6 rounded-3xl bg-primary/5 border border-primary/10 shadow-inner">
                          <div className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-6">Đánh giá chung</div>
                          <div className="relative size-40 flex items-center justify-center">
                            <svg className="size-full -rotate-90">
                              <circle cx="80" cy="80" r="70" className="stroke-primary/10 stroke-[12] fill-none" />
                              <circle cx="80" cy="80" r="70" className="stroke-primary stroke-[12] fill-none" strokeDasharray="440" strokeDashoffset="66" strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-4xl font-black text-primary tracking-tighter">8.5</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Điểm KPI</span>
                            </div>
                          </div>
                          <div className="mt-8 text-[11px] font-bold text-muted-foreground bg-white/50 px-4 py-1.5 rounded-full border border-primary/5">Giảng viên tiêu biểu</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Case: ADMIN */}
              {formData.role === "ADMIN" && (
                <Card className="shadow-sm border-border rounded-xl bg-card overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <History className="size-4 text-blue-500" />
                      LỊCH SỬ TÁC VỤ & QUẢN TRỊ HỆ THỐNG
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-600 border-blue-100 uppercase scroll-px-3 h-5">Nhật ký hoạt động</Badge>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                          <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hành động</th>
                          <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đối tượng</th>
                          <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(user?.auditLogs || []).length > 0 ? (
                          (user?.auditLogs || []).slice(adminLogPage * PAGE_SIZE, (adminLogPage + 1) * PAGE_SIZE).map((log: any) => (
                            <tr key={log.id} className="hover:bg-muted/20 transition-all cursor-default group">
                              <td className="p-4 text-[11px] font-medium tabular-nums text-muted-foreground">
                                {format(new Date(log.createdAt), 'HH:mm dd/MM/yyyy')}
                              </td>
                              <td className="p-4">
                                <Badge variant="secondary" className="text-[9px] font-bold bg-muted border-none px-2 h-5 group-hover:bg-primary/10 transition-colors">
                                  {log.action}
                                </Badge>
                              </td>
                              <td className="p-4 text-[11px] font-bold text-foreground/80">
                                {log.entityType} <span className="text-muted-foreground font-medium">#{log.entityId}</span>
                              </td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                                  <Search className="size-3" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-16 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <Settings className="size-10 text-muted-foreground/30" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Không có lịch sử hành động nào</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {Math.ceil((user?.auditLogs || []).length / PAGE_SIZE) > 1 && (
                    <div className="p-4 border-t border-border flex justify-between items-center bg-muted/5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2 whitespace-nowrap">
                        {(user?.auditLogs || []).length} kết quả
                      </span>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => { e.preventDefault(); setAdminLogPage(p => Math.max(0, p - 1)); }}
                              aria-disabled={adminLogPage === 0}
                              className={adminLogPage === 0 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {renderPaginationItems(adminLogPage, Math.ceil((user?.auditLogs || []).length / PAGE_SIZE), setAdminLogPage)}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => { e.preventDefault(); setAdminLogPage(p => Math.min(Math.ceil((user?.auditLogs || []).length / PAGE_SIZE) - 1, p + 1)); }}
                              aria-disabled={adminLogPage >= Math.ceil((user?.auditLogs || []).length / PAGE_SIZE) - 1}
                              className={adminLogPage >= Math.ceil((user?.auditLogs || []).length / PAGE_SIZE) - 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Footer Section */}
          <div className="p-6 border-t bg-muted/10 flex justify-end shrink-0 gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 px-6 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Đóng
            </Button>
            <Button
              onClick={() => setShowConfirmSave(true)}
              disabled={isSubmitting}
              className="h-10 px-8 bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <Dialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi</DialogTitle>
            <DialogDescription>
              Hành động này sẽ cập nhật các thông tin bảo mật và phân quyền cho người dùng <strong>{user?.username}</strong>.
              Mọi phiên đăng nhập hiện tại sẽ bị vô hiệu hóa để áp dụng quyền mới.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmSave(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : "Xác nhận cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Làm mới lịch sử vi phạm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ nhật ký bảo mật của người dùng này?
              <strong> Hành động này không thể hoàn tác.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmReset(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleResetViolations} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : "Đồng ý xóa sạch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmLock} onOpenChange={setShowConfirmLock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user?.isActive ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa"}</DialogTitle>
            <DialogDescription>
              {user?.isActive
                ? `Hành động này sẽ ngăn chặn người dùng ${user?.username} truy cập vào hệ thống ngay lập tức.`
                : `Hành động này sẽ khôi phục quyền truy cập vào hệ thống cho người dùng ${user?.username}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmLock(false)}>Hủy</Button>
            <Button
              variant={user?.isActive ? "destructive" : "default"}
              className={user?.isActive ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              onClick={handleLockAccountConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : (user?.isActive ? "Khóa tài khoản" : "Mở khóa ngay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendWarning} onOpenChange={setShowSendWarning}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-amber-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                <MessageSquareWarning className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Gửi cảnh báo cho người dùng</DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground">
                  Gửi thông báo nhắc nhở tới <strong>{user?.username}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-8 py-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  Mẫu cảnh báo thông minh
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 px-2 rounded-lg"
                  onClick={() => setShowAddTemplate(!showAddTemplate)}
                >
                  {showAddTemplate ? "Hủy" : "+ Thêm mẫu mới"}
                </Button>
              </div>

              {showAddTemplate && (
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex gap-2 animate-in zoom-in-95 duration-200">
                  <Input
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value)}
                    placeholder="Nhập nội dung mẫu mới..."
                    className="h-8 text-xs border-primary/20 bg-white"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3 text-[10px] font-bold rounded-lg"
                    onClick={() => {
                      if (newTemplate.trim()) {
                        setCustomTemplates([...customTemplates, newTemplate.trim()]);
                        localStorage.setItem("warning_templates", JSON.stringify([...customTemplates, newTemplate.trim()]));
                        setNewTemplate("");
                        setShowAddTemplate(false);
                        toast.success("Đã thêm mẫu mới");
                      }
                    }}
                  >
                    Lưu
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { text: "Chào {{name}}, Hệ thống phát hiện gian lận trong bài thi.", icon: "⚠️" },
                  { text: "Vui lòng sử dụng ngôn từ phù hợp trên hệ thống.", icon: "🚫" },
                  { text: "Tài khoản của bạn có dấu hiệu đăng nhập bất thường.", icon: "🔐" },
                  { text: "Cần chú ý tuân thủ quy trình thi cử hệ thống.", icon: "📝" },
                  ...customTemplates.map(t => ({ text: t, icon: "💬" }))
                ].map((preset, idx) => {
                  const processedText = preset.text.replace("{{name}}", user?.username || "Bạn");
                  const isActive = warningMessage === processedText;
                  return (
                    <div key={idx} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-[10px] h-auto py-2.5 px-4 w-full rounded-2xl border-border/60 transition-all hover:border-amber-500/50 hover:bg-amber-50/50 justify-start text-left whitespace-normal ${isActive ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-md' : 'bg-background'
                          }`}
                        onClick={() => {
                          const separator = warningMessage && !warningMessage.endsWith(".") ? ". " : "";
                          setWarningMessage(prev => prev ? `${prev}${separator}${processedText}` : processedText);
                        }}
                      >
                        <span className="mr-2 opacity-80 shrink-0">{preset.icon}</span>
                        <span className="flex-1 leading-relaxed">{preset.text}</span>
                        {idx >= 4 && (
                          <button
                            type="button"
                            className="size-5 ml-2 shrink-0 flex items-center justify-center rounded-full hover:bg-rose-500 hover:text-white transition-all"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeTemplate(preset.text);
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Nội dung thông báo
                </Label>
                <span className={`text-[10px] font-bold ${warningMessage.length >= 450 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                  {warningMessage.length}/500
                </span>
              </div>
              <div className="relative group">
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value.substring(0, 500))}
                  className="w-full min-h-[140px] rounded-2xl border-2 border-border/80 bg-muted/5 p-5 text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all resize-none font-medium placeholder:text-muted-foreground/50 shadow-inner"
                  placeholder="Chọn mẫu nhanh phía trên hoặc tự nhập nội dung..."
                />
                <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-30 group-focus-within:opacity-100 transition-opacity">
                  <div className="size-1.5 rounded-full bg-amber-500" />
                  <div className="size-1.5 rounded-full bg-amber-500/40" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => { setShowSendWarning(false); setWarningMessage(""); }}
              className="text-muted-foreground font-bold hover:bg-transparent hover:text-foreground"
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-slate-900 hover:bg-black text-white font-bold px-10 h-11 rounded-2xl shadow-xl shadow-slate-200"
              onClick={() => setShowConfirmSendWarningDialog(true)}
              disabled={isSubmitting || !warningMessage.trim()}
            >
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : "Gửi thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roles change confirmation */}
      <Dialog open={showConfirmRoleChange} onOpenChange={setShowConfirmRoleChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="p-8 pb-4 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center gap-4 mb-3">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-lg border border-primary/10 group-hover:rotate-6 transition-transform">
                <ShieldStatus className="size-7" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Xác nhận đổi vai trò</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quyền hạn hệ thống</DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-8 py-2 space-y-4">
            <div className="p-6 rounded-2xl bg-muted/20 border border-border flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <Badge variant="outline" className="h-7 px-4 rounded-full border-2 border-primary/20 text-xs font-bold text-muted-foreground">
                  {getRoleName(user?.role || "")}
                </Badge>
                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">Hiện tại</span>
              </div>

              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="size-4 text-primary animate-pulse" />
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <Badge className="h-7 px-4 rounded-full bg-primary text-white text-xs font-bold shadow-md shadow-primary/20">
                  {getRoleName(pendingRole)}
                </Badge>
                <span className="text-[9px] font-bold text-primary uppercase">Cấp mới</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/50 flex items-start gap-4">
              <div className="size-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Lock className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-orange-900">Lưu ý quan trọng</p>
                <p className="text-[11px] text-orange-800/70 leading-relaxed font-medium">Để cập nhật phân vùng quyền hạn mới, hệ thống sẽ <b>tự động vô hiệu hóa</b> mọi phiên đăng nhập của <strong>{user?.username}</strong> ngay sau khi xác nhận.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmRoleChange(false)}
              className="text-muted-foreground font-bold hover:bg-transparent hover:text-foreground hover:scale-105 transition-all"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={confirmRoleChange}
              className="bg-slate-900 hover:bg-black text-white font-bold px-8 h-11 rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.03] active:scale-95 transition-all"
            >
              Xác nhận & Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send warning final confirmation */}
      <Dialog open={showConfirmSendWarningDialog} onOpenChange={setShowConfirmSendWarningDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận gửi thông báo?</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ gửi cảnh báo này tới trung tâm thông báo của học viên <strong>{user?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmSendWarningDialog(false)}>Xem lại</Button>
            <Button onClick={() => { setShowConfirmSendWarningDialog(false); handleSendWarning(); }} className="bg-slate-900 text-white font-bold">
              Xác nhận gửi ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showConfirmHandleLog} onOpenChange={(open) => !open && setShowConfirmHandleLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đã xử lý</DialogTitle>
            <DialogDescription>
              Bạn xác nhận đã kiểm tra và giải quyết sự cố vi phạm: <br />
              <strong>{showConfirmHandleLog?.description}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmHandleLog(null)}>Hủy</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => showConfirmHandleLog && handleMarkAsHandled(showConfirmHandleLog.id)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : "Xác nhận đã xử lý"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
