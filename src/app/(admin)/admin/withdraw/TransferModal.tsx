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
import {
  useCreatePayoutMutation,
  useGetPayoutStatusQuery,
} from "@/store/services/withdrawApi";
import { usePaymentSocket } from "@/providers/PaymentSocketProvider";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
  onPayoutCreated?: () => void;
  isConfirming: boolean;
  request: Pick<WithdrawRequestData, "id" | "amount" | "bankName" | "accountNumber" | "accountHolder"> | null;
}

export function TransferModal({
  isOpen,
  onClose,
  onConfirm,
  onSuccess,
  onPayoutCreated,
  isConfirming,
  request,
}: TransferModalProps) {
  const [payoutOrderId, setPayoutOrderId] = useState<string | null>(null);
  const [socketHandled, setSocketHandled] = useState(false);

  const [createPayout, { isLoading: isCreatingPayout }] =
    useCreatePayoutMutation();
  const { refetch: refetchPayoutStatus } = useGetPayoutStatusQuery(payoutOrderId || "", {
    skip: !payoutOrderId || socketHandled,
  });

  // ── Socket.IO realtime: payment-status-change ─────────────────────
  const { onPaymentStatusChange } = usePaymentSocket();

  useEffect(() => {
    const unsub = onPaymentStatusChange((data) => {
      // Match by withdrawRequestId với request hiện tại
      if (request && data.withdrawRequestId === request.id) {
        if (data.newStatus === "SUCCESS") {
          setSocketHandled(true);
          setPayoutOrderId(null);
          toast.success(data.message || "Chuyển tiền tự động thành công!");
          onSuccess();
        } else if (data.newStatus === "FAILED") {
          setSocketHandled(true);
          setPayoutOrderId(null);
          toast.error(data.message || "Chuyển khoản tự động thất bại!");
        }
      }
    });
    return () => unsub();
  }, [request, onPaymentStatusChange, onSuccess]);

  // Fallback Check (Phụ thuộc API - Không SetInterval)
  useEffect(() => {
    if (!payoutOrderId || socketHandled) return;

    const timeoutId = setTimeout(async () => {
      try {
        const result = await refetchPayoutStatus();
        const status = result.data?.data?.status;
        if (status === "SUCCESS" || status === "COMPLETED") {
          setSocketHandled(true);
          setPayoutOrderId(null);
          toast.success("Chuyển tiền tự động thành công!");
          onSuccess();
        } else if (status === "FAILED") {
          setSocketHandled(true);
          setPayoutOrderId(null);
          toast.error(result.data?.data?.message || "Chuyển khoản thất bại!");
        } else {
          // Giao dịch có thể thật sự bị delay từ Ngân hàng / XGate
          toast.info("Giao dịch đang chờ xử lý từ ngân hàng...");
        }
      } catch (error) {
        console.error("Fallback check error:", error);
      }
    }, 20000); // Fallback 20s (đủ cho 1 chu kỳ polling 15s + margin)

    return () => clearTimeout(timeoutId);
  }, [payoutOrderId, socketHandled, refetchPayoutStatus, onSuccess]);

  const handleAutoPayout = async () => {
    try {
      const res = await createPayout(request!.id).unwrap();
      if (res.data?.orderId) {
        setPayoutOrderId(res.data.orderId);
        onPayoutCreated?.();
        toast.info("Đang xử lý chuyển tiền tự động, vui lòng chờ...");
      } else {
        toast.success("Đã ghi nhận yêu cầu chuyển tiền tự động!");
        onSuccess();
      }
    } catch (error) {
      const message = error && typeof error === "object" && "data" in error ? error.data?.message : undefined;
      toast.error(
        message || "L???i khi g???i API chuy???n ti???n t??? ?????ng",
      );
    }
  };

  const resetStateAndClose = () => {
    setPayoutOrderId(null);
    setSocketHandled(false);
    onClose();
  };

  if (!request) return null;

  const transferAmountBlossom = request.amount;
  const transferAmountVnd = transferAmountBlossom * 1000;
  // Format để tạo QR vietqr: amount=..., addInfo=..., accountName=...
  const orderId = `RUTTIEN${request.id}`;

  // Format lại tên ngân hàng cho VietQR (chuyển đổi danh sách từ form của User sang mã VietQR)
  const getVietQRBankCode = (bankName: string) => {
    const mapping: Record<string, string> = {
      "MB Bank": "mbbank",
      Vietcombank: "vietcombank",
      Techcombank: "techcombank",
      Agribank: "agribank",
      BIDV: "bidv",
      VietinBank: "vietinbank",
      ACB: "acb",
      TPBank: "tpbank",
      VPBank: "vpbank",
      Sacombank: "sacombank",
    };
    return mapping[bankName] || bankName.toLowerCase().replace(/\s+/g, "");
  };
  const bankCode = getVietQRBankCode(request.bankName);

  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${request.accountNumber}-compact2.png?amount=${transferAmountVnd}&addInfo=${orderId}&accountName=${encodeURIComponent(request.accountHolder)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && resetStateAndClose()}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chuyển tiền cho Giảng viên</DialogTitle>
          <DialogDescription>
            Quét mã QR dưới đây bằng ứng dụng ngân hàng để chuyển khoản. Sau khi
            chuyển thành công, nhấn &quot;Xác nhận chuyển thành công&quot;.
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
            <InfoRow
              label="Ngân hàng"
              value={request.bankName}
              onCopy={() => copyToClipboard(request.bankName, "ngân hàng")}
            />
            <InfoRow
              label="Số tài khoản"
              value={request.accountNumber}
              onCopy={() =>
                copyToClipboard(request.accountNumber, "số tài khoản")
              }
              isBold
            />
            <InfoRow
              label="Chủ tài khoản"
              value={request.accountHolder}
              onCopy={() =>
                copyToClipboard(request.accountHolder, "chủ tài khoản")
              }
            />
            <InfoRow
              label="Số hoa"
              value={`${transferAmountBlossom.toLocaleString("vi-VN")} 🌸`}
              onCopy={() =>
                copyToClipboard(transferAmountBlossom.toString(), "số hoa")
              }
              isBold
              textClass="text-emerald-600"
            />
            <InfoRow
              label="Số tiền chuyển"
              value={`${transferAmountVnd.toLocaleString("vi-VN")}đ`}
              onCopy={() =>
                copyToClipboard(transferAmountVnd.toString(), "số tiền chuyển")
              }
              isBold
            />
            <InfoRow
              label="Nội dung"
              value={orderId}
              onCopy={() => copyToClipboard(orderId, "nội dung")}
            />
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
              {payoutOrderId || isCreatingPayout
                ? "Đang xử lý tự động..."
                : "Thanh toán tự động qua Cổng Payout"}
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={resetStateAndClose}
              disabled={isConfirming || !!payoutOrderId}
            >
              Đóng
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isConfirming || !!payoutOrderId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isConfirming
                ? "Đang xử lý..."
                : "Xác nhận chuyển tay thành công"}
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
  textClass,
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
        <span
          className={`text-sm ${isBold ? "font-bold" : ""} ${textClass || ""}`}
        >
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sao chép"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
