'use client'

import React, { useEffect } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { useGetWalletQuery } from "@/store/services/walletApi"

export default function PaymentSuccessPage() {
  const { data: wallet } = useGetWalletQuery()

  // Auto redirect sau 10 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/user/premium"
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const balance = wallet?.balance || 0
  const flowers = Math.floor(balance / 1000)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-4">
      <div className="bg-card rounded-3xl border border-border shadow-2xl max-w-md w-full p-12 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-secondary/10 rounded-full p-6 border-2 border-secondary">
              <Check className="w-12 h-12 text-secondary" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          ✅ Thanh Toán Thành Công!
        </h1>
        <p className="text-muted-foreground mb-8">
          Tiền nạp đã được cộng vào tài khoản của bạn
        </p>

        {/* Balance Info */}
        <div className="bg-secondary/5 rounded-2xl p-6 mb-8 border border-secondary/20">
          <p className="text-sm text-muted-foreground mb-2">Số dư hiện tại</p>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-secondary">{flowers}</span>
            <span className="text-5xl ml-2">🌸</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {balance.toLocaleString('vi-VN')} VND
          </p>
        </div>

        {/* Confirmation Details */}
        <div className="space-y-2 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thời gian:</span>
            <span className="font-semibold">{new Date().toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trạng thái:</span>
            <span className="font-semibold text-secondary">Hoàn thành</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/user/premium"
            className="block px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/90 transition text-center"
          >
            Tiếp tục mua hoa
          </Link>
          <Link
            href="/user"
            className="block px-6 py-3 border border-border rounded-xl hover:bg-accent transition text-center font-semibold"
          >
            Về trang chủ
          </Link>
        </div>

        {/* Auto Redirect Info */}
        <p className="text-xs text-muted-foreground mt-6">
          Tự động chuyển hướng sau 10 giây...
        </p>
      </div>
    </div>
  )
}
