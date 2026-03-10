'use client'

import React, { useState, useEffect } from "react"
import { Banknote } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import TopupPackageCard from "./TopupPackageCard"

import { useGetWalletQuery } from "@/store/services/walletApi"
import { useCreatePaymentMutation } from "@/store/services/paymentApi"

const paymentMethods = [
  { id: "bank", name: "Ngân hàng", icon: <Banknote className="w-5 h-5 text-secondary" /> }
]

export default function TopupContent() {
  // API 4: Lấy thông tin ví (Dùng để polling số dư)
  const { data: wallet, refetch: refetchWallet } = useGetWalletQuery()

  // API 1: Tạo lệnh nạp
  const [createPayment, { isLoading }] = useCreatePaymentMutation()

  const balance = wallet?.balance || 0
  const [selectedPackage, setSelectedPackage] = useState<number>(4)
  const [selectedPayment, setSelectedPayment] = useState<string>("bank")
  const [qrData, setQrData] = useState<{
    url: string
    orderId: string
    amount: number
  } | null>(null)

  const [initialBalance, setInitialBalance] = useState(0)

  const packages = [
    { id: 1, price: 10000, flowers: 10 },
    { id: 2, price: 20000, flowers: 20 },
    { id: 3, price: 50000, flowers: 50, bonus: 5 },
    { id: 4, price: 100000, flowers: 100, bonus: 20, isPopular: true },
    { id: 5, price: 200000, flowers: 200, bonus: 60 },
    { id: 6, price: 500000, flowers: 500, bonus: 200 }
  ]

  const BANK_ID = "MB"
  const ACCOUNT_NO = "0916146446"
  const ACCOUNT_NAME = "Nguyễn Nho Quốc Huy"

  /**
   * CHỈ GỌI API 1: TẠO ĐƠN HÀNG
   */
  const handleTopupClick = async () => {
    const selectedPkg = packages.find(pkg => pkg.id === selectedPackage)
    if (!selectedPkg) {
      toast.error("Vui lòng chọn gói nạp")
      return
    }

    try {
      // Lưu lại số dư trước khi nạp để so sánh
      setInitialBalance(balance)

      const order = await createPayment({
        amount: selectedPkg.price
      }).unwrap()

      const qrUrl =
        `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
        `?amount=${order.amount}&addInfo=${order.orderId}&accountName=${ACCOUNT_NAME}`

      setQrData({
        url: qrUrl,
        orderId: order.orderId,
        amount: order.amount
      })
      
      toast.info("Vui lòng quét mã QR để thanh toán")
    } catch (err) {
      toast.error("Không thể tạo đơn thanh toán")
    }
  }

  /**
   * CHỈ GỌI API 4: POLLING KIỂM TRA SỐ DƯ
   * (Chạy khi QR đang hiển thị)
   */
  useEffect(() => {
    if (!qrData) return

    const interval = setInterval(async () => {
      // Gọi refetch để cập nhật dữ liệu ví mới nhất từ API 4
      const updated = await refetchWallet()
      const newBalance = updated.data?.balance || 0

      if (newBalance > initialBalance) {
        toast.success("Hệ thống đã nhận được tiền. Nạp thành công!")
        setQrData(null) // Đóng popup QR
        clearInterval(interval)
      }
    }, 3000) // 3 giây check một lần để tránh spam server quá mức

    return () => clearInterval(interval)
  }, [qrData, initialBalance, refetchWallet])

  const closeQrPopup = () => {
    setQrData(null)
  }

  return (
    <div className="space-y-12">
      {/* Hiển thị số dư hiện tại */}
      <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <div className="text-sm font-bold text-muted-foreground uppercase">
            SỐ DƯ HIỆN TẠI :
          </div>
          <div className="flex items-center text-2xl font-bold">
            <span>{Math.floor(balance / 1000)}</span>
            <span className="text-3xl ml-1">🌸</span>
          </div>
        </div>
      </div>

      {/* Grid danh sách gói nạp */}
      <div>
        <h3 className="text-xl font-bold mb-6">Chọn gói nạp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
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
          {paymentMethods.map(method => (
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

      {/* Modal Popup QR Code */}
      {qrData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card p-8 rounded-2xl flex flex-col items-center max-w-sm text-center border shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4">Quét mã để thanh toán</h3>
            <div className="bg-white p-2 rounded-xl mb-4">
              <Image
                src={qrData.url}
                alt="QR Code"
                width={250}
                height={250}
                className="rounded-lg"
              />
            </div>
            <p className="text-sm mb-1">Nội dung chuyển khoản (bắt buộc):</p>
            <p className="text-lg font-black text-secondary mb-2 select-all uppercase">
              {qrData.orderId}
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 italic">
              Hệ thống sẽ tự động cộng tiền sau 1-3 phút khi nhận được thanh toán.
            </p>
            <button
              onClick={closeQrPopup}
              className="w-full px-4 py-2 border rounded-lg hover:bg-accent transition"
            >
              Hủy giao dịch
            </button>
          </div>
        </div>
      )}
    </div>
  )
}