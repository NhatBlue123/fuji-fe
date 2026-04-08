"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Banknote,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
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
import { useGetWalletQuery } from "@/store/services/walletApi";
import { useCreateWithdrawRequestMutation } from "@/store/services/withdrawApi";

export default function WithdrawPage() {
  const router = useRouter();
  const { data: wallet } = useGetWalletQuery();
  const balance = wallet?.balance || 0;
  const [createWithdrawRequest, { isLoading: isSubmitting }] =
    useCreateWithdrawRequestMutation();

  const [amount, setAmount] = useState<string>("");
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const withdrawAmount = Number(amount) || 0;

  const validateForm = () => {
    if (withdrawAmount < 50000) {
      toast.error("Số tiền rút tối thiểu là 50,000đ");
      return false;
    }
    if (withdrawAmount > balance) {
      toast.error("Số dư ví không đủ");
      return false;
    }
    if (
      !bankInfo.bankName ||
      !bankInfo.accountNumber ||
      !bankInfo.accountHolder
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng");
      return false;
    }
    return true;
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) setShowConfirm(true);
  };

  const handleConfirmWithdraw = async () => {
    setShowConfirm(false);
    try {
      await createWithdrawRequest({
        amount: withdrawAmount,
        ...bankInfo,
      }).unwrap();
      setIsSuccess(true);
      toast.success("Gửi yêu cầu thành công!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Giao dịch thất bại");
    }
  };

  if (isSuccess)
    return <SuccessState onBack={() => router.push("/profile/wallet")} />;

  return (
    <main className="min-h-screen bg-transparent text-slate-900 dark:text-slate-200 pb-20">
      {/* Background Decor - Chỉ dùng 1 tông Pink */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-pink-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-10 space-y-10">
        <header className="flex items-end justify-between border-b border-slate-200 dark:border-white/5 pb-6">
          <div className="space-y-4">
            <button
              onClick={() => router.push("/profile/wallet")}
              className="flex items-center gap-2 text-slate-500 hover:text-pink-500 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Quay lại ví
            </button>
            <h2 className="text-4xl font-black tracking-tighter">
              RÚT <span className="text-pink-500">TIỀN</span>
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
            <ShieldCheck size={14} className="text-pink-500" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
              Giao dịch an toàn 256-bit
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <form
              id="withdraw-form"
              onSubmit={handleOpenConfirm}
              className="space-y-8"
            >
              {/* Nhập số tiền */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Banknote size={16} className="text-pink-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">
                    Số tiền rút
                  </span>
                </div>
                <div className="relative group border-b-2 border-slate-200 dark:border-white/10 focus-within:border-pink-500 transition-all pb-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-5xl font-black outline-none placeholder:text-slate-300 dark:placeholder:text-white/5"
                  />
                  <span className="absolute right-0 bottom-4 font-black text-slate-400">
                    VND
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Label nhỏ để hướng dẫn */}
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Chọn nhanh:
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[100000, 200000, 500000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val.toString())}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-pink-500 hover:text-white transition-all text-xs font-bold border border-transparent"
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowNote(!showNote)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                        showNote
                          ? "border-pink-500 text-pink-500"
                          : "border-slate-200 dark:border-white/10 text-slate-500"
                      }`}
                    >
                      <HelpCircle size={14} /> Hạn mức
                    </button>
                  </div>
                </div>

                {showNote && (
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-[11px] font-medium leading-relaxed text-slate-500">
                    • Tối thiểu: <b className="text-pink-500">50,000đ</b> / lần{" "}
                    <br />• Tối đa: <b className="text-pink-500">3 lần</b> /
                    ngày
                  </div>
                )}
              </div>

              {/* Ngân hàng */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 ml-1">
                  <Landmark size={16} className="text-pink-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">
                    Thông tin nhận tiền
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Ngân hàng
                    </p>
                    <input
                      list="bank-list"
                      placeholder="Chọn ngân hàng"
                      className="w-full h-12 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-pink-500/50 rounded-xl px-4 text-sm font-bold outline-none transition-all"
                      onChange={(e) =>
                        setBankInfo({ ...bankInfo, bankName: e.target.value })
                      }
                      required
                    />
                    <datalist id="bank-list">
                      <option value="MB Bank" />
                      <option value="Vietcombank" />
                      <option value="Techcombank" />
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Số tài khoản
                    </p>
                    <input
                      type="text"
                      placeholder="Nhập số tài khoản"
                      className="w-full h-12 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-pink-500/50 rounded-xl px-4 text-sm font-mono font-bold outline-none transition-all"
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          accountNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Chủ tài khoản
                    </p>
                    <input
                      type="text"
                      placeholder="Tên không dấu (VD: NGUYEN VAN A)"
                      className="w-full h-12 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-pink-500/50 rounded-xl px-4 text-sm font-bold uppercase outline-none transition-all"
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          accountHolder: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              <div className="bg-slate-900 text-white dark:bg-white/5 dark:text-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                    Số dư hiện tại
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold opacity-40 uppercase">
                      VND
                    </span>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-60 font-bold uppercase">
                      Rút tiền
                    </span>
                    <span className="font-black">
                      {withdrawAmount.toLocaleString()} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-60 font-bold uppercase">
                      Phí giao dịch
                    </span>
                    <span className="font-black text-pink-400">Miễn phí</span>
                  </div>
                  <div className="pt-4 flex justify-between items-end border-t border-white/10">
                    <span className="text-xs font-black uppercase text-pink-500">
                      Thực nhận
                    </span>
                    <span className="text-3xl font-black tracking-tighter">
                      {withdrawAmount.toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>

              <Button
                form="withdraw-form"
                disabled={isSubmitting}
                className="w-full h-16 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 transition-all"
              >
                {isSubmitting ? "Đang gửi..." : "Xác nhận yêu cầu"}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Dialog - Đã làm gọn màu sắc */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-[2rem] p-8">
          <DialogHeader className="text-center">
            <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-xl font-black uppercase">
              Kiểm tra lại thông tin
            </DialogTitle>
            <DialogDescription className="text-[11px] font-medium uppercase tracking-tight">
              Tiền sẽ được chuyển thủ công vào tài khoản này
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl space-y-4 my-4">
            {[
              { label: "Ngân hàng", value: bankInfo.bankName },
              {
                label: "Số tài khoản",
                value: bankInfo.accountNumber,
                mono: true,
              },
              { label: "Chủ thẻ", value: bankInfo.accountHolder, upper: true },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {item.label}
                </span>
                <span
                  className={`text-xs font-black ${item.mono ? "font-mono tracking-wider" : ""} ${item.upper ? "uppercase" : ""}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="flex-1 font-bold text-xs uppercase"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmWithdraw}
              className="flex-1 bg-pink-500 font-black text-xs uppercase"
            >
              Xác nhận rút
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// Success State tinh chỉnh
function SuccessState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl">
        <div className="w-20 h-20 bg-pink-500/10 text-pink-500 rounded-3xl flex items-center justify-center mx-auto rotate-12">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tighter">
            Đã gửi yêu cầu
          </h3>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
            Hệ thống sẽ duyệt trong vòng 24 giờ tới.
          </p>
        </div>
        <Button
          onClick={onBack}
          className="w-full h-14 bg-slate-900 dark:bg-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest"
        >
          Về ví Fuji
        </Button>
      </div>
    </div>
  );
}
