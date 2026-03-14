'use client'

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useGetPaymentStatusQuery } from "@/store/services/paymentApi"

interface PaymentStatusProps {
  orderId: string
  amount: number
  bankId: string
  accountNo: string
  accountName: string
  onClose: () => void
}

export default function PaymentStatus({
  orderId,
  amount,
  bankId,
  accountNo,
  accountName,
  onClose
}: PaymentStatusProps) {
  const router = useRouter()
  const [pollCount, setPollCount] = useState(0)
  const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null)
  const MAX_POLL_TIME = 600000 // 10 phút
  const POLL_INTERVAL = 20000 // Check mỗi 20 giây
  const [elapsedTime, setElapsedTime] = useState(0)

  // Polling payment status
  const { data: paymentStatus, refetch, isLoading: isStatusLoading } = useGetPaymentStatusQuery(orderId, {
    skipPolling: true
  })

  // Kiểm tra trạng thái thanh toán
  useEffect(() => {
    let elapsedMs = 0
    const interval = setInterval(async () => {
      try {
        elapsedMs += POLL_INTERVAL
        setElapsedTime(elapsedMs)
        setPollCount(prev => prev + 1)

        const result = await refetch()
        const status = result.data?.status

        // Nếu thanh toán thành công
        if (status === "SUCCESS") {
          toast.success("✅ Thanh toán thành công!")
          clearInterval(interval)
          setPollIntervalId(null)
          // Redirect to success page sau 1 giây
          setTimeout(() => {
            router.push("/premium/success")
          }, 1000)
          return
        }

        // Nếu thanh toán thất bại
        if (status === "FAILED") {
          toast.error("❌ Thanh toán thất bại. Vui lòng thử lại.")
          clearInterval(interval)
          setPollIntervalId(null)
          onClose()
          return
        }

        // Timeout sau 10 phút
        if (elapsedMs >= MAX_POLL_TIME) {
          toast.error("⏱️ Hết thời gian chờ. Vui lòng kiểm tra trạng thái giao dịch.")
          clearInterval(interval)
          setPollIntervalId(null)
          onClose()
          return
        }
      } catch (error) {
        console.error("Error polling payment status:", error)
        // Tiếp tục polling ngay cả khi có lỗi
      }
    }, POLL_INTERVAL)

    setPollIntervalId(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [orderId, refetch, onClose, router])

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const qrUrl =
    `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png` +
    `?amount=${amount}&addInfo=${orderId}&accountName=${accountName}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card p-8 rounded-2xl flex flex-col items-center max-w-sm text-center border shadow-2xl relative">
        {/* Header */}
        <h3 className="text-xl font-bold mb-6">Quét mã để thanh toán</h3>

        {/* Thông tin tài khoản */}
        <div className="w-full mb-4 p-3 bg-muted rounded-lg text-left text-sm space-y-1">
          <div>
            <span className="text-muted-foreground">Ngân hàng: </span>
            <span className="font-semibold">{bankId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Số tài khoản: </span>
            <span className="font-semibold">{accountNo}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Chủ tài khoản: </span>
            <span className="font-semibold">{accountName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Số tiền: </span>
            <span className="font-semibold text-secondary">{amount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        {/* Mã QR */}
        <div className="bg-white p-2 rounded-xl mb-4">
          <Image
            src={qrUrl}
            alt="QR Code Payment"
            width={250}
            height={250}
            className="rounded-lg"
          />
        </div>

        {/* Nội dung chuyển khoản */}
        <p className="text-sm mb-1">Nội dung chuyển khoản (bắt buộc):</p>
        <p className="text-lg font-black text-secondary mb-4 select-all uppercase">
          {orderId}
        </p>

        {/* Polling Status */}
        <div className="w-full mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            ⏳ Hệ thống đang kiểm tra thanh toán...
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600 dark:text-blue-400">Thời gian chờ còn lại:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {formatTimeLeft(MAX_POLL_TIME - elapsedTime)}
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Lần kiểm tra: {pollCount}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mb-4 italic">
          Hệ thống sẽ tự động cập nhật sau 20-30 giây khi nhận được thanh toán.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={() => refetch()}
            disabled={isStatusLoading}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition"
          >
            {isStatusLoading ? "Đang kiểm tra..." : "✓ Kiểm tra ngay"}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border rounded-lg hover:bg-accent transition"
          >
            Hủy giao dịch
          </button>
        </div>
      </div>
    </div>
  )
}
