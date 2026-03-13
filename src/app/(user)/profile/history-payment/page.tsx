"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const payments = [
  {
    id: "PMT001",
    teacher: "Sakura Sensei",
    time: "08:00 - 09:00, 07/10/2025",
    amount: 250000,
    status: "success",
    method: "VNPay",
  },
  {
    id: "PMT002",
    teacher: "Tanaka Ken",
    time: "10:00 - 11:00, 08/10/2025",
    amount: 250000,
    status: "pending",
    method: "MoMo",
  },
  {
    id: "PMT003",
    teacher: "Yuki Mori",
    time: "19:00 - 20:00, 10/10/2025",
    amount: 300000,
    status: "failed",
    method: "VNPay",
  },
];

export default function PaymentHistoryPage() {
  const router = useRouter();

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "₫";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">

      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              <ArrowLeft size={18} />
            </button>

            <h1 className="text-3xl font-bold text-slate-100">
              Lịch sử thanh toán
            </h1>
          </div>

        </div>

        {/* CARD */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">

          {/* TABLE HEADER */}
          <div className="grid grid-cols-5 px-6 py-4 text-sm text-slate-400 border-b border-slate-800">
            <div>Giáo viên</div>
            <div>Thời gian</div>
            <div>Phương thức</div>
            <div>Số tiền</div>
            <div>Trạng thái</div>
          </div>

          {/* TABLE BODY */}
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="grid grid-cols-5 px-6 py-5 items-center border-b border-slate-800 hover:bg-slate-800/40 transition"
            >
              {/* teacher */}
              <div className="flex items-center gap-2 text-slate-200">
                <User size={16} />
                {payment.teacher}
              </div>

              {/* time */}
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar size={16} />
                {payment.time}
              </div>

              {/* method */}
              <div className="flex items-center gap-2 text-slate-300">
                <CreditCard size={16} />
                {payment.method}
              </div>

              {/* amount */}
              <div className="text-slate-200 font-semibold">
                {formatPrice(payment.amount)}
              </div>

              {/* status */}
              <div>
                <StatusBadge status={payment.status} />
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

/* STATUS BADGE */

function StatusBadge({ status }: { status: string }) {

  if (status === "success") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
        Thành công
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
        Đang xử lý
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
      Thất bại
    </span>
  );
}