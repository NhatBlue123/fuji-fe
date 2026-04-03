import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Copy, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreatePayoutMutation, useGetPayoutStatusQuery } from "@/store/services/withdrawApi";
import { usePaymentSocket } from "@/providers/PaymentSocketProvider";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
  isConfirming: boolean;
  request: {
    id: number;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
}

export function TransferModal({
  isOpen,
  onClose,
  onConfirm,
  onSuccess,
  isConfirming,
  request,
}: TransferModalProps) {
  const [payoutOrderId, setPayoutOrderId] = useState<string | null>(null);
  const [socketHandled, setSocketHandled] = useState(false);

  const [createPayout, { isLoading: isCreatingPayout }] = useCreatePayoutMutation();
  const { data: payoutStatus } = useGetPayoutStatusQuery(payoutOrderId || "", {
    skip: !payoutOrderId || socketHandled,
    pollingInterval: 10000, // Fallback 10s, socket handles realtime
  });

  // ── Socket.IO realtime: payout-success ─────────────────────
  const { onPayoutSuccess } = usePaymentSocket();

  useEffect(() => {
    const unsub = onPayoutSuccess((data) => {
      // Match by withdrawRequestId với request hiện tại
      if (request && data.withdrawRequestId === request.id) {
        setSocketHandled(true);
        setPayoutOrderId(null);
        toast.success(data.message || "Chuyển tiền tự động thành công!");
        onSuccess();
      }
    });
    return () => unsub();
  }, [request, onPayoutSuccess, onSuccess]);

  // Polling fallback
  useEffect(() => {
    if (socketHandled) return;
    if (payoutStatus?.data?.status === "SUCCESS" || payoutStatus?.data?.status === "COMPLETED") {
      toast.success("Chuyển tiền tự động thành công!");
      setPayoutOrderId(null);
      onSuccess();
    } else if (payoutStatus?.data?.status === "FAILED") {
      toast.error(payoutStatus?.data?.message || "Chuyển khoản thất bại!");
      setPayoutOrderId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutStatus, socketHandled]);

  const handleAutoPayout = async () => {
    try {
      const res = await createPayout(request!.id).unwrap();
      if (res.data?.orderId) {
        setPayoutOrderId(res.data.orderId);
        toast.info("Đang xử lý chuyển tiền tự động, vui lòng chờ...");
      } else {
        toast.success("Đã ghi nhận yêu cầu chuyển tiền tự động!");
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Lỗi khi gọi API chuyển tiền tự động");
    }
  };

  const resetStateAndClose = () => {
    setPayoutOrderId(null);
    setSocketHandled(false);
    onClose();
  };

  if (!request) return null;

  const transferAmount = request.amount;
  // Format để tạo QR vietqr: amount=..., addInfo=..., accountName=...
  const orderId = `RUTTIEN${request.id}`;
  
  // Format lại tên ngân hàng cho VietQR (chuyển đổi danh sách từ form của User sang mã VietQR)
  const getVietQRBankCode = (bankName: string) => {
    const mapping: Record<string, string> = {
      "MB Bank": "mbbank",
      "Vietcombank": "vietcombank",
      "Techcombank": "techcombank",
      "Agribank": "agribank",
      "BIDV": "bidv",
      "VietinBank": "vietinbank",
      "ACB": "acb",
      "TPBank": "tpbank",
      "VPBank": "vpbank",
      "Sacombank": "sacombank",
    };
    return mapping[bankName] || bankName.toLowerCase().replace(/\s+/g, "");
  };
  const bankCode = getVietQRBankCode(request.bankName);

  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${request.accountNumber}-compact2.png?amount=${transferAmount}&addInfo=${orderId}&accountName=${encodeURIComponent(request.accountHolder)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetStateAndClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chuyển tiền cho Giảng viên</DialogTitle>
          <DialogDescription>
            Quét mã QR dưới đây bằng ứng dụng ngân hàng để chuyển khoản. Sau khi chuyển thành công, nhấn &quot;Xác nhận chuyển thành công&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg border">
            <div className="relative bg-white p-2 rounded-xl shadow-sm mb-4">
              <Image 
                src={qrUrl} 
                alt="QR Code" 
                width={200} 
                height={200} 
                className="rounded-lg"
                unoptimized
                priority
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Kiểm tra kỹ thông tin người nhận trước khi chuyển
            </p>
          </div>

          <div className="space-y-4 flex flex-col justify-center">
            <InfoRow label="Ngân hàng" value={request.bankName} onCopy={() => copyToClipboard(request.bankName, "ngân hàng")} />
            <InfoRow label="Số tài khoản" value={request.accountNumber} onCopy={() => copyToClipboard(request.accountNumber, "số tài khoản")} isBold />
            <InfoRow label="Chủ tài khoản" value={request.accountHolder} onCopy={() => copyToClipboard(request.accountHolder, "chủ tài khoản")} />
            <InfoRow label="Số tiền" value={`${transferAmount.toLocaleString("vi-VN")}đ`} onCopy={() => copyToClipboard(transferAmount.toString(), "số tiền")} isBold textClass="text-emerald-600" />
            <InfoRow label="Nội dung" value={orderId} onCopy={() => copyToClipboard(orderId, "nội dung")} />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center w-full mt-4 gap-4 sm:gap-0">
          <div className="w-full sm:w-auto">
            <Button 
              type="button"
              onClick={handleAutoPayout} 
              disabled={isConfirming || isCreatingPayout || !!payoutOrderId} 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              <Zap className="mr-2 h-4 w-4" />
              {payoutOrderId || isCreatingPayout ? "Đang xử lý tự động..." : "Thanh toán tự động qua Cổng Payout"}
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={resetStateAndClose} disabled={isConfirming || !!payoutOrderId}>
              Đóng
            </Button>
            <Button onClick={onConfirm} disabled={isConfirming || !!payoutOrderId} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              {isConfirming ? "Đang xử lý..." : "Xác nhận chuyển tay thành công"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ 
  label, 
  value, 
  onCopy, 
  isBold,
  textClass
}: { 
  label: string; 
  value: string; 
  onCopy?: () => void; 
  isBold?: boolean;
  textClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${isBold ? "font-bold" : ""} ${textClass || ""}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors" title="Sao chép">
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
