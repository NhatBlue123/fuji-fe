"use client";

import React, { useState } from "react";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import TopupPackageCard from "./TopupPackageCard";
import PaymentStatus from "./PaymentStatus";

import { useGetWalletQuery } from "@/store/services/walletApi";
import { useCreatePaymentMutation } from "@/store/services/paymentApi";

const paymentMethods = [
  {
    id: "bank",
    name: "Ngân hàng",
    icon: <Banknote className="w-5 h-5 text-secondary" />,
  },
];

export default function TopupContent() {
  // API lấy thông tin ví
  const { data: wallet } = useGetWalletQuery();

  // API tạo lệnh nạp tiền
  const [createPayment, { isLoading }] = useCreatePaymentMutation();

  const balance = wallet?.balance || 0;
  const availableBalance = wallet?.availableBalance || 0;
  const [selectedPackage, setSelectedPackage] = useState<number>(4);
  const [selectedPayment, setSelectedPayment] = useState<string>("bank");

  // Payment Status modal state
  const [paymentQrData, setPaymentQrData] = useState<{
    orderId: string;
    amount: number;
    bankId: string;
    accountNo: string;
    accountName: string;
  } | null>(null);

  const packages = [
    { id: 1, price: 10000, flowers: 10 },
    { id: 2, price: 20000, flowers: 20 },
    { id: 3, price: 50000, flowers: 50, bonus: 5 },
    { id: 4, price: 100000, flowers: 100, bonus: 20, isPopular: true },
    { id: 5, price: 200000, flowers: 200, bonus: 60 },
    { id: 6, price: 500000, flowers: 500, bonus: 100 },
  ];

  /**
   * BƯỚC 1: GỌI API TẠO ĐƠN HÀNG
   * Backend trả về thông tin tài khoản từ XGate
   */
  const handleTopupClick = async () => {
    const selectedPkg = packages.find((pkg) => pkg.id === selectedPackage);
    if (!selectedPkg) {
      toast.error("Vui lòng chọn gói nạp");
      return;
    }

    try {
      // Gọi API tạo đơn nạp - Backend trả về bankId, accountNo, accountName
      const orderData = await createPayment({
        amount: selectedPkg.price,
      }).unwrap();

      console.log("Order data from backend:", orderData);

      // Provide fallback values from environment variables or use defaults
      const bankId =
        orderData.bankId || process.env.NEXT_PUBLIC_BANK_ID || "MB";
      const accountNo =
        orderData.accountNo ||
        process.env.NEXT_PUBLIC_ACCOUNT_NO ||
        "0916146446";
      const accountName =
        orderData.accountName ||
        process.env.NEXT_PUBLIC_ACCOUNT_NAME ||
        "NHo huy";

      // Kiểm tra backend có trả về đầy đủ dữ liệu không
      if (!accountNo) {
        console.error(
          "Backend trả về dữ liệu không đầy đủ. Cần account number:",
          {
            orderId: orderData.orderId,
            amount: orderData.amount,
            bankId,
            missingAccountNo: !orderData.accountNo,
            missingAccountName: !orderData.accountName,
          },
        );
        toast.error(
          "❌ Backend chưa cấu hình tài khoản XGate. Hãy thiết lập biến môi trường hoặc liên hệ admin!",
        );
        return;
      }

      // Show PaymentStatus component
      setPaymentQrData({
        orderId: orderData.orderId,
        amount: orderData.amount,
        bankId: bankId,
        accountNo: accountNo,
        accountName: accountName,
      });

      toast.info("Vui lòng quét mã QR để thanh toán");
    } catch (err) {
      console.error("Error creating payment:", err);
      toast.error("Không thể tạo đơn thanh toán");
    }
  };

  return (
    <div className="space-y-12">
      {/* Hiển thị số dư hiện tại */}
      <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <div className="text-sm font-bold text-muted-foreground uppercase">
            SỐ DƯ HIỆN TẠI :
          </div>
          <div className="flex items-center text-2xl font-bold">
            <span>{Math.floor(availableBalance / 1000)}</span>
            <span className="text-3xl ml-1">🌸</span>
          </div>
        </div>
      </div>

      {/* Grid danh sách gói nạp */}
      <div>
        <h3 className="text-xl font-bold mb-6">Chọn gói nạp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <TopupPackageCard
              key={pkg.id}
              {...pkg}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => setSelectedPackage(pkg.id)}
            />
          ))}
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div>
        <h3 className="text-xl font-bold mb-6">Phương thức thanh toán</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`flex items-center space-x-4 p-5 rounded-2xl border transition ${
                selectedPayment === method.id
                  ? "border-secondary border-2"
                  : "border-border hover:border-secondary/50"
              }`}
            >
              {method.icon}
              <span className="font-semibold">{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nút kích hoạt tạo đơn */}
      <div className="text-center">
        <button
          onClick={handleTopupClick}
          disabled={isLoading}
          className="px-12 py-4 bg-secondary text-secondary-foreground font-bold rounded-xl disabled:opacity-50"
        >
          {isLoading ? "Đang tạo đơn..." : "Nạp ngay bằng VietQR"}
        </button>
      </div>

      {/* Payment Status Modal */}
      {paymentQrData && (
        <PaymentStatus
          orderId={paymentQrData.orderId}
          amount={paymentQrData.amount}
          bankId={paymentQrData.bankId}
          accountNo={paymentQrData.accountNo}
          accountName={paymentQrData.accountName}
          onClose={() => setPaymentQrData(null)}
        />
      )}
    </div>
  );
}
