import React from "react";
import Image from "next/image";
import { Copy, CheckCircle } from "lucide-react";
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

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  isConfirming,
  request,
}: TransferModalProps) {
  if (!request) return null;

  // Giảm 10,000đ phí rút tiền như trong UI
  const transferAmount = request.amount - 10000;
  // Format để tạo QR vietqr: amount=..., addInfo=..., accountName=...
  const orderId = `RUTTIEN${request.id}`;
  const qrUrl = `https://img.vietqr.io/image/${request.bankName}-${request.accountNumber}-compact2.png?amount=${transferAmount}&addInfo=${orderId}&accountName=${encodeURIComponent(request.accountHolder)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
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

        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Đóng
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle className="mr-2 h-4 w-4" />
            {isConfirming ? "Đang xử lý..." : "Xác nhận chuyển thành công"}
          </Button>
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
