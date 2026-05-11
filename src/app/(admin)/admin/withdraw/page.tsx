"use client";

/**
 * [I18N PAGE - QUẢN LÝ RÚT TIỀN]
 * Thực hiện:
 * - Chuyển đổi toàn bộ bảng quản lý yêu cầu rút tiền sang đa ngôn ngữ.
 * - Localize các trạng thái (Chờ duyệt, Đang xử lý, Thành công, Từ chối).
 * - Tích hợp i18n cho các stats cards và các hộp thoại xác nhận chuyển khoản.
 */

import React, { useEffect, useState } from "react";
import {
  XCircle,
  Eye,
  Search,
  Download,
  Banknote,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { PaymentSocketProvider, usePaymentSocket } from "@/providers/PaymentSocketProvider";
import { useTranslation } from "react-i18next";

import {
  useGetAllWithdrawRequestsQuery,
  useApproveWithdrawRequestMutation,
  useRejectWithdrawRequestMutation,
  type WithdrawRequestData,
} from "@/store/services/withdrawApi";

import { TransferModal } from "./TransferModal";

function AdminWithdrawManagementInner() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequestData | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { onPaymentStatusChange } = usePaymentSocket();
  const {
    data: response,
    isLoading,
    refetch,
  } = useGetAllWithdrawRequestsQuery();
  const [approveRequest] = useApproveWithdrawRequestMutation();
  const [rejectRequest] = useRejectWithdrawRequestMutation();

  const requests = response?.data || [];

  // Lấy trạng thái mới nhất của request đang được chọn
  const activeRequest = selectedRequest
    ? requests.find((r) => r.id === selectedRequest.id) || selectedRequest
    : null;

  useEffect(() => {
    const unsub = onPaymentStatusChange((data) => {
      if (data.transactionType !== "PAYOUT") return;

      void refetch();

      if (!selectedRequest || data.withdrawRequestId !== selectedRequest.id) return;

      if (data.newStatus === "SUCCESS") {
        setIsTransferModalOpen(false);
        setSelectedRequest(null);
      }
    });

    return () => unsub();
  }, [onPaymentStatusChange, refetch, selectedRequest]);

  const handleOpenTransferModal = (req: WithdrawRequestData) => {
    setSelectedRequest(req);
    setIsTransferModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      await approveRequest(selectedRequest.id).unwrap();
      toast.success(
        t("admin.withdraw.toast.approveSuccess", { id: selectedRequest.id }),
      );
      setIsTransferModalOpen(false);
      setSelectedRequest(null);
      refetch();
    } catch (error) {
      const message = (error as { data?: { message?: string } } | undefined)?.data?.message;
      toast.error(
        message || t("admin.withdraw.toast.approveError", { id: selectedRequest.id }),
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt(t("admin.withdraw.prompt.rejectReason"));
    if (reason) {
      try {
        await rejectRequest(id).unwrap();
        toast.error(t("admin.withdraw.toast.rejectSuccess", { id, reason }));
        refetch();
      } catch (error) {
        const message = (error as { data?: { message?: string } } | undefined)?.data?.message;
        toast.error(message || t("admin.withdraw.toast.rejectError", { id }));
      }
    }
  };

  // Tính toán Stats
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const processingCount = requests.filter(
    (r) => r.status === "PROCESSING",
  ).length;
  const totalPaid = requests
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + r.amount, 0);
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  // Lọc dữ liệu
  const filteredRequests = requests.filter((req) => {
    const matchFilter =
      filter === "all"
        ? true
        : filter === "pending"
          ? req.status === "PENDING"
          : filter === "processing"
            ? req.status === "PROCESSING"
            : filter === "completed"
              ? req.status === "COMPLETED"
              : req.status === "REJECTED";

    const searchLower = search.toLowerCase();
    const matchSearch =
      req.id.toString().includes(searchLower) ||
      (req.fullName || "").toLowerCase().includes(searchLower);

    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.withdraw.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.withdraw.desc")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> {t("common.exportExcel")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.withdraw.stat.waiting")}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            {processingCount > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                ({processingCount} {t("admin.withdraw.stat.processing")})
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.withdraw.stat.toProcess")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.withdraw.stat.totalPaid")}
            </CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPaid.toLocaleString()} 🌸
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.withdraw.stat.successTx")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.withdraw.stat.rejected")}
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rejectedCount.toString().padStart(2, "0")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.withdraw.stat.refunded")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.withdraw.placeholder.search")}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                {t("admin.withdraw.filter.all")}
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                {t("admin.withdraw.filter.pending")}
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                {t("admin.withdraw.filter.completed")}
              </Button>
              <Button
                variant={filter === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("processing")}
              >
                {t("admin.withdraw.filter.processing")}
              </Button>
              <Button
                variant={filter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("rejected")}
              >
                {t("admin.withdraw.filter.rejected")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Cảnh báo cho Admin */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-muted/50 rounded-lg text-sm border">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong>{t("admin.withdraw.alert.note")}</strong> {t("admin.withdraw.alert.desc")}
            </p>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {t("admin.withdraw.table.idDate")}
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {t("admin.user.table.user")}
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {t("admin.withdraw.table.amount")}
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {t("admin.withdraw.table.bank")}
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {t("admin.user.table.status")}
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      {t("admin.user.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-4 text-center text-muted-foreground h-24"
                      >
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-4 text-center text-muted-foreground h-24"
                      >
                        {t("admin.withdraw.table.empty")}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">
                          <div className="font-medium whitespace-nowrap">
                            #{req.id}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleString(i18n.language === "vi" ? "vi-VN" : i18n.language)}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="font-medium">
                            {req.fullName || t("common.anonymous")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("admin.user.table.id")}: {req.userId}
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="font-semibold">
                            {req.amount.toLocaleString()} 🌸
                          </div>
                          {req.netPayoutAmount != null ? (
                            <div className="text-xs text-muted-foreground">
                              Net: {req.netPayoutAmount.toLocaleString()} 🌸
                            </div>
                          ) : null}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="font-semibold text-xs"
                            >
                              {req.bankName}
                            </Badge>
                            <div className="text-sm font-mono">
                              {req.accountNumber}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {req.accountHolder}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {req.status === "PENDING" ? (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100"
                            >
                              {t("admin.withdraw.status.pending")}
                            </Badge>
                          ) : req.status === "PROCESSING" ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 animate-pulse"
                            >
                              {t("admin.withdraw.status.processing")}
                            </Badge>
                          ) : req.status === "COMPLETED" ? (
                            <Badge
                              variant="default"
                              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100"
                            >
                              {t("admin.withdraw.status.completed")}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">{t("admin.withdraw.status.rejected")}</Badge>
                          )}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.status === "PENDING" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950 px-3"
                                  title={t("admin.withdraw.btn.transfer")}
                                  onClick={() => handleOpenTransferModal(req)}
                                >
                                  <Banknote className="h-4 w-4 mr-1" /> {t("admin.withdraw.btn.transfer")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title={t("admin.user.btn.reject")}
                                  onClick={() => handleReject(req.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {req.status === "PROCESSING" && (
                              <Badge
                                variant="outline"
                                className="text-blue-600 border-blue-300 animate-pulse"
                              >
                                <Clock className="h-3 w-3 mr-1" /> {t("admin.withdraw.status.transferring")}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {isTransferModalOpen && (
        <TransferModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            onConfirm={handleApprove}
            onPayoutCreated={() => {
              refetch();
            }}
            onSuccess={() => {
              setIsTransferModalOpen(false);
              setSelectedRequest(null);
              refetch();
            }}
            isConfirming={isApproving}
            request={activeRequest}
          />
              )}
    </div>
  );
}

export default function AdminWithdrawManagement() {
  return (
    <PaymentSocketProvider>
      <AdminWithdrawManagementInner />
    </PaymentSocketProvider>
  );
}
