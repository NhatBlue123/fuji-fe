"use client";

import { useState } from "react";
import { ArrowLeft, Bell, CreditCard, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const [method, setMethod] = useState("card");
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-950 p-8 min-h-screen">

      {/* SUCCESS MODAL */}
      {showSuccess && <SuccessModal router={router} />}

      {/* HEADER */}
      <header className="flex items-center justify-between mb-10">

        <div className="flex items-center gap-4">

          <div
            onClick={() => router.back()}
            className="p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:bg-white/5 transition"
          >
            <ArrowLeft className="text-slate-100" size={20} />
          </div>

          <h2 className="text-2xl font-bold text-slate-100">
            Thanh toán
          </h2>

        </div>

        <div className="flex items-center gap-4">

          <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-pink-500 transition">
            <Bell size={18} />
          </button>

          <div
            className="size-10 rounded-full bg-center bg-cover border border-slate-800"
            style={{
              backgroundImage:
                'url("https://i.pravatar.cc/150")',
            }}
          />

        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Chọn phương thức thanh toán
          </h1>
          <p className="text-slate-400">
            Hoàn tất việc thanh toán để xác nhận lịch học của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* PAYMENT METHODS */}
          <div className="lg:col-span-2 space-y-6">

            <h3 className="text-lg font-semibold text-slate-200">
              Phương thức phổ biến
            </h3>

            <div className="space-y-3">

              <PaymentOption
                value="momo"
                method={method}
                setMethod={setMethod}
                title="Ví MoMo"
                desc="Thanh toán nhanh qua ứng dụng"
                color="bg-[#a50064]"
                label="MoMo"
              />

              <PaymentOption
                value="card"
                method={method}
                setMethod={setMethod}
                title="Thẻ Visa/Mastercard"
                desc="Hỗ trợ tất cả ngân hàng"
                icon={<CreditCard size={18} />}
                color="bg-blue-600"
              />

              <PaymentOption
                value="zalopay"
                method={method}
                setMethod={setMethod}
                title="Ví ZaloPay"
                desc="Ưu đãi giảm giá 5%"
                label="ZaloPay"
                color="bg-sky-500"
              />

              <PaymentOption
                value="bank"
                method={method}
                setMethod={setMethod}
                title="Chuyển khoản ngân hàng"
                desc="Nhận thông tin qua email"
                icon={<Landmark size={18} />}
                color="bg-emerald-600"
              />

            </div>
          </div>

          {/* SUMMARY */}
          <div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-8">

              <h3 className="text-lg font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-6">

                <div className="aspect-video w-full rounded-xl bg-cover bg-center border border-slate-800"
                  style={{
                    backgroundImage: 'url("https://picsum.photos/500/300")',
                  }}
                />

                <div>
                  <p className="text-pink-500 text-xs font-bold uppercase mb-1">
                    Học phần: Giao tiếp
                  </p>

                  <p className="text-slate-100 font-bold text-lg">
                    GV. Sakura Tanaka
                  </p>
                </div>

                <div className="space-y-3 text-sm text-slate-400">
                  <p>📅 15/10/2023</p>
                  <p>⏰ 19:00 - 20:00 (60 phút)</p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">

                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Học phí</span>
                    <span>450.000đ</span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Phí dịch vụ</span>
                    <span>22.500đ</span>
                  </div>

                  <div className="flex justify-between text-slate-100 font-bold text-xl pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-pink-500">472.500đ</span>
                  </div>

                </div>

                <button
                  onClick={() => setShowSuccess(true)}
                  className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition"
                >
                  Xác nhận thanh toán
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

/* PAYMENT OPTION */

function PaymentOption({
  value,
  method,
  setMethod,
  title,
  desc,
  icon,
  label,
  color,
}: any) {
  return (
    <label className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-pink-500 transition">

      <div className="flex items-center gap-4">

        <div className={`size-12 rounded-lg flex items-center justify-center text-white font-bold ${color}`}>
          {icon ? icon : label}
        </div>

        <div>
          <p className="font-medium text-slate-100">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>

      </div>

      <input
        type="radio"
        name="payment"
        checked={method === value}
        onChange={() => setMethod(value)}
        className="w-5 h-5 accent-pink-500"
      />
    </label>
  );
}

/* SUCCESS MODAL */

function SuccessModal({ router }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

      <div className="w-full max-w-md bg-[#0f172a] border border-pink-500/30 rounded-xl p-8 flex flex-col items-center text-center shadow-2xl">

        <div className="size-24 rounded-full border-4 border-pink-500 flex items-center justify-center text-pink-500 mb-6">
          ✓
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Thanh toán thành công!
        </h1>

        <p className="text-slate-300 mb-6">
          Bạn đã đặt lịch học thành công với Sakura Sensei.
        </p>

        <button
          onClick={() => router.push("/booking/bookingmodal")}
          className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl"
        >
          Xem lịch của tôi
        </button>

      </div>
    </div>
  );
}