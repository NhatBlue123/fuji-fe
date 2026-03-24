"use client";

import React, { useState } from "react";
import { 
  CheckCircle, XCircle, Eye, Search, 
  Filter, Download, Banknote, Clock, 
  MoreVertical, ExternalLink, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

import { 
  useGetAllWithdrawRequestsQuery,
  useApproveWithdrawRequestMutation,
  useRejectWithdrawRequestMutation,
} from "@/store/services/withdrawApi";

import { TransferModal } from "./TransferModal";

export default function AdminWithdrawManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { data: response, isLoading, refetch } = useGetAllWithdrawRequestsQuery();
  const [approveRequest] = useApproveWithdrawRequestMutation();
  const [rejectRequest] = useRejectWithdrawRequestMutation();

  const requests = response?.data || [];

  const handleOpenTransferModal = (req: any) => {
    setSelectedRequest(req);
    setIsTransferModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      await approveRequest(selectedRequest.id).unwrap();
      toast.success(`✅ Đã chuyển tiền thành công cho yêu cầu #${selectedRequest.id}! Trạng thái đã được cập nhật.`);
      setIsTransferModalOpen(false);
      setSelectedRequest(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || `Lỗi khi duyệt yêu cầu #${selectedRequest.id}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Lý do từ chối rút tiền:");
    if (reason) {
      try {
        await rejectRequest(id).unwrap();
        toast.error(`Đã từ chối yêu cầu #${id}. Lý do: ${reason}`);
        refetch();
      } catch (error: any) {
        toast.error(error?.data?.message || `Lỗi khi từ chối yêu cầu #${id}`);
      }
    }
  };

  // Tính toán Stats
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const processingCount = requests.filter(r => r.status === 'PROCESSING').length;
  const totalPaid = requests
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.amount, 0);
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Lọc dữ liệu
  const filteredRequests = requests.filter(req => {
    const matchFilter = filter === 'all' 
      ? true 
      : filter === 'pending' ? req.status === 'PENDING' 
      : filter === 'processing' ? req.status === 'PROCESSING'
      : filter === 'completed' ? req.status === 'COMPLETED' : req.status === 'REJECTED';
      
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
          <h1 className="text-3xl font-bold tracking-tight">Rút tiền</h1>
          <p className="text-muted-foreground">
            Phê duyệt và quản lý các yêu cầu rút tiền từ ví của giảng viên.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang chờ duyệt
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            {processingCount > 0 && (
              <p className="text-xs text-blue-600 mt-1">({processingCount} đang xử lý)</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Yêu cầu cần xử lý</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng đã chi
            </CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toLocaleString()}đ</div>
            <p className="text-xs text-muted-foreground mt-1">Các giao dịch thành công</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bị từ chối
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount.toString().padStart(2, '0')}</div>
            <p className="text-xs text-muted-foreground mt-1">Giao dịch đã hoàn tiền</p>
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
                placeholder="Tìm giao dịch, tên, email..."
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filter === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tất cả
              </Button>
              <Button 
                variant={filter === 'pending' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Chờ duyệt
              </Button>
              <Button 
                variant={filter === 'completed' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Đã duyệt
              </Button>
              <Button 
                variant={filter === 'processing' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('processing')}
              >
                Đang xử lý
              </Button>
              <Button 
                variant={filter === 'rejected' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Từ chối
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Cảnh báo cho Admin */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-muted/50 rounded-lg text-sm border">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong>Lưu ý:</strong> Hệ thống hiện chưa tự động chuyển tiền qua Ngân hàng số. Sau khi kiểm tra tài khoản nhận hợp lệ và bấm <span className="font-semibold">Duyệt</span>, bạn vui lòng chuyển khoản thủ công cho người dùng qua app Ngân hàng thực tế.
            </p>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mã / Ngày</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Người dùng</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Số tiền</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ngân hàng thụ hưởng</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Trạng thái</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground h-24">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground h-24">
                        Không tìm thấy yêu cầu rút tiền nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          <div className="font-medium whitespace-nowrap">#{req.id}</div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="font-medium">{req.fullName || "Người dùng ẩn danh"}</div>
                          <div className="text-xs text-muted-foreground">Mã ID: {req.userId}</div>
                        </td>
                        <td className="p-4 align-middle font-semibold whitespace-nowrap">
                          {req.amount.toLocaleString()}đ
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <Badge variant="outline" className="font-semibold text-xs">{req.bankName}</Badge>
                            <div className="text-sm font-mono">{req.accountNumber}</div>
                            <div className="text-xs text-muted-foreground uppercase">{req.accountHolder}</div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {req.status === 'PENDING' ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100">Chờ duyệt</Badge>
                          ) : req.status === 'PROCESSING' ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 animate-pulse">Đang xử lý</Badge>
                          ) : req.status === 'COMPLETED' ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100">Đã chuyển</Badge>
                          ) : (
                            <Badge variant="destructive">Đã từ chối</Badge>
                          )}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.status === 'PENDING' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950 px-3"
                                  title="Chuyển tiền"
                                  onClick={() => handleOpenTransferModal(req)}
                                >
                                  <Banknote className="h-4 w-4 mr-1" /> Chuyển tiền
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Từ chối (Hoàn tiền)"
                                  onClick={() => handleReject(req.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {req.status === 'PROCESSING' && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 animate-pulse">
                                <Clock className="h-3 w-3 mr-1" /> Đang chuyển...
                              </Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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

      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirm={handleApprove}
        onSuccess={() => {
          setIsTransferModalOpen(false);
          setSelectedRequest(null);
          refetch();
        }}
        isConfirming={isApproving}
        request={selectedRequest}
      />
    </div>
  );
}