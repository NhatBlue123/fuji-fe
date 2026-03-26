"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Landmark,
  Info,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Banknote,
  Sparkles,
  AlertCircle,
  HelpCircle, // Thêm icon để hiển thị cạnh "Số khác"
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
import router from "next/router";

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
  const [showNote, setShowNote] = useState(false); // Trạng thái hiển thị ghi chú

  const withdrawAmount = Number(amount) || 0;
  const finalAmount = withdrawAmount;

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
      toast.success("Đã gửi yêu cầu rút tiền thành công!");
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Giao dịch thất bại, vui lòng thử lại",
      );
    }
  };

  if (isSuccess) return <SuccessState onBack={() => router.push("/wallet")} />;

  return (
    <main className="min-h-screen bg-[#0a0c10] text-slate-200 pb-20 selection:bg-pink-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <button
              onClick={() => router.push("/profile/wallet")}
              className="group flex items-center gap-2 text-slate-500 hover:text-pink-400 transition-all font-bold mb-2"
            >
              <div className="p-2.5 rounded-2xl bg-white/5 group-hover:bg-pink-500/10 border border-white/10 group-hover:border-pink-500/20 transition-all">
                <ArrowLeft size={18} />
              </div>
              <span className="text-[10px] tracking-widest uppercase">
                Quay lại ví
              </span>
            </button>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
              Rút <span className="text-pink-400">Tiền</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-inner">
            <Info className="text-pink-400" size={16} />
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Duyệt trong <span className="text-white">24 giờ làm việc</span>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <form
              id="withdraw-form"
              onSubmit={handleOpenConfirm}
              className="space-y-5"
            >
              <section className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3">
                  <Banknote size={18} className="text-pink-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70">
                    Số tiền muốn rút
                  </h3>
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="relative group/input border-b border-white/10 focus-within:border-pink-500/50 transition-all">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-4xl font-black text-white outline-none pb-4 placeholder:text-white/5"
                      required
                    />
                    <span className="absolute right-0 bottom-4 text-lg font-black text-slate-600 uppercase">
                      VND
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {[100000, 200000, 500000, 1000000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setAmount(val.toString());
                            setShowNote(false);
                          }}
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold hover:bg-pink-500/10 hover:border-pink-500/40 hover:text-pink-400 transition-all uppercase"
                        >
                          +{val.toLocaleString()}
                        </button>
                      ))}

                      {/* Nút Số Khác */}
                      <button
                        type="button"
                        onClick={() => setShowNote(!showNote)}
                        className={`px-4 py-2 rounded-lg border text-[10px] font-bold transition-all uppercase flex items-center gap-2 ${
                          showNote
                            ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-pink-500/10 hover:border-pink-500/40 hover:text-pink-400"
                        }`}
                      >
                        <HelpCircle size={12} />
                        Số khác
                      </button>
                    </div>

                    {/* Nội dung Note khi click vào Số khác */}
                    {showNote && (
                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            size={12}
                            className="text-pink-400 mt-0.5 shrink-0"
                          />
                          <div className="space-y-1">
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">
                              Hạn mức rút tiền tối thiểu:{" "}
                              <span className="text-pink-400">50,000 VND</span>
                            </p>
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">
                              Số lần rút tối đa trong ngày:{" "}
                              <span className="text-pink-400">03 lần</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ... Giữ nguyên các phần ngân hàng ... */}
              <section className="bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Landmark size={18} className="text-cyan-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70">
                    Ngân hàng thụ hưởng
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Ngân hàng
                    </label>
                    <div className="relative group">
                      <input
                        list="bank-list"
                        type="text"
                        placeholder="Chọn hoặc nhập tên ngân hàng"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold outline-none focus:border-pink-500/50 transition-all"
                        onChange={(e) =>
                          setBankInfo({ ...bankInfo, bankName: e.target.value })
                        }
                        required
                      />
                      <datalist id="bank-list">
                        <option value="MB Bank" />
                        <option value="Vietcombank" />
                        <option value="Techcombank" />
                        <option value="Agribank" />
                        <option value="BIDV" />
                        <option value="VietinBank" />
                        <option value="ACB" />
                        <option value="TPBank" />
                        <option value="VPBank" />
                        <option value="Sacombank" />
                      </datalist>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1L5 5L9 1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-mono font-bold outline-none focus:border-pink-500/50 transition-all"
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
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Tên chủ tài khoản
                    </label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white font-bold outline-none focus:border-pink-500/50 uppercase transition-all"
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
              </section>
            </form>
          </div>

          <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-8">
            {/* ... Giữ nguyên phần Tóm tắt số dư và Button ... */}
            <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">
                  Số dư ví Fuji
                </span>
                <Wallet size={14} className="text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {balance.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  VND
                </span>
              </div>
              <div className="pt-5 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                  <span className="text-slate-500">Số tiền rút:</span>
                  <span className="text-white">
                    {withdrawAmount.toLocaleString()}đ
                  </span>
                </div>
                <div className="pt-3 border-t border-dashed border-white/10 flex justify-between items-end">
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
                    Thực nhận:
                  </span>
                  <span className="text-xl font-black text-white tracking-tighter">
                    {finalAmount.toLocaleString()}đ
                  </span>
                </div>
              </div>
            </div>



            <Button
              form="withdraw-form"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-pink-500/20 transition-all active:scale-95"
            >
              {isSubmitting ? "Đang xử lý..." : "Gửi yêu cầu rút tiền"}
            </Button>
          </aside>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        {/* ... Giữ nguyên Dialog nội dung ... */}
        <DialogContent className="bg-[#0f1218] border border-white/10 text-slate-200 rounded-[2rem] max-w-md p-8">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mx-auto mb-2">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-center text-xl font-black uppercase tracking-tight text-white">
              Xác nhận thông tin
            </DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Vui lòng kiểm tra kỹ số tài khoản. Admin sẽ chuyển tiền theo thông
              tin này.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/5 my-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Ngân hàng
              </span>
              <span className="text-xs font-bold text-white">
                {bankInfo.bankName}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Số tài khoản
              </span>
              <span className="text-xs font-mono font-bold text-white tracking-widest">
                {bankInfo.accountNumber}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">
                Số tiền thực nhận
              </span>
              <span className="text-lg font-black text-pink-400">
                {finalAmount.toLocaleString()}đ
              </span>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="flex-1 h-12 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmWithdraw}
              className="flex-1 h-12 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest"
            >
              Xác nhận rút
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ... SuccessState giữ nguyên ...
function SuccessState({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0B1120]/80 backdrop-blur-2xl border border-emerald-500/20 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={32} strokeWidth={3} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            Yêu cầu đã gửi!
          </h3>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            Hệ thống đang xử lý giao dịch của bạn.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => router.push("/profile/wallet")}
          className="w-full h-12 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
        >
          Quay lại ví
        </Button>
      </div>
    </div>
  );
}
