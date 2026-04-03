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

  if (isSuccess) return <SuccessState onBack={() => router.push("/profile/wallet")} />; // Sửa về đúng path wallet

  return (
    <main className="min-h-screen bg-transparent text-slate-800 dark:text-slate-200 pb-20 selection:bg-pink-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-pink-500/10 dark:bg-pink-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div className="space-y-1">
            <button
              onClick={() => router.push("/profile/wallet")}
              className="group flex items-center gap-2 text-muted-foreground dark:text-slate-500 hover:text-pink-500 dark:hover:text-pink-400 transition-all font-bold mb-2"
            >
              <div className="p-2.5 rounded-2xl bg-muted/40 dark:bg-white/5 group-hover:bg-pink-500/10 border border-muted dark:border-white/10 group-hover:border-pink-500/20 transition-all">
                <ArrowLeft size={18} />
              </div>
              <span className="text-[10px] tracking-widest uppercase">
                Quay lại ví
              </span>
            </button>
            <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(236,72,153,0.1)]">
              Rút <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">Tiền</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-white/40 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-muted dark:border-white/10 p-3 rounded-xl shadow-inner shadow-black/5 dark:shadow-none">
            <Info className="text-pink-500 dark:text-pink-400" size={16} />
            <p className="text-[9px] text-muted-foreground dark:text-slate-400 font-bold uppercase tracking-widest">
              Duyệt trong <span className="text-foreground dark:text-white">24 giờ làm việc</span>
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
              {/* Form Rút Số Tiền */}
              <section className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden transition-all">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-500 dark:text-pink-400 border border-pink-500/20 shadow-inner">
                      <Banknote size={18} />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground/80 dark:text-white/70">
                    Số tiền muốn rút
                  </h3>
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="relative group/input border-b border-muted dark:border-white/10 focus-within:border-pink-500/50 transition-all">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-4xl font-black text-foreground dark:text-white outline-none pb-4 placeholder:text-muted-foreground/30 dark:placeholder:text-white/5"
                      required
                    />
                    <span className="absolute right-0 bottom-4 text-lg font-black text-muted-foreground dark:text-slate-600 uppercase">
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
                          className="px-4 py-2 rounded-lg bg-muted/40 dark:bg-white/5 border border-muted dark:border-white/10 text-[10px] text-muted-foreground dark:text-slate-400 font-bold hover:bg-pink-500/10 hover:border-pink-500/40 hover:text-pink-500 dark:hover:text-pink-400 transition-all uppercase"
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
                            ? "bg-pink-500/10 border-pink-500/50 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400"
                            : "bg-muted/40 dark:bg-white/5 border-muted dark:border-white/10 text-muted-foreground dark:text-slate-400 hover:bg-pink-500/10 hover:border-pink-500/40 hover:text-pink-500 dark:hover:text-pink-400"
                        }`}
                      >
                        <HelpCircle size={14} />
                        Lưu ý hạn mức
                      </button>
                    </div>

                    {/* Nội dung Note khi click vào Số khác */}
                    {showNote && (
                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-1 duration-200 mt-2 shadow-inner">
                        <div className="flex items-start gap-3">
                          <AlertCircle
                            size={16}
                            className="text-pink-500 dark:text-pink-400 mt-0.5 shrink-0"
                          />
                          <div className="space-y-1">
                            <p className="text-[10px] text-foreground/80 dark:text-slate-300 font-bold uppercase tracking-tight">
                              Hạn mức rút tiền tối thiểu:{" "}
                              <span className="text-pink-500 dark:text-pink-400">50,000 VND</span>
                            </p>
                            <p className="text-[10px] text-foreground/80 dark:text-slate-300 font-bold uppercase tracking-tight">
                              Số lần rút tối đa trong ngày:{" "}
                              <span className="text-pink-500 dark:text-pink-400">03 lần</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Form Thông tin Ngân hàng */}
              <section className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2rem] p-6 md:p-8 space-y-6 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 shadow-inner">
                      <Landmark size={18} />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground/80 dark:text-white/70">
                    Ngân hàng thụ hưởng
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest ml-1">
                      Ngân hàng
                    </label>
                    <div className="relative group">
                      <input
                        list="bank-list"
                        type="text"
                        placeholder="Chọn tên ngân hàng..."
                        className="w-full h-14 bg-muted/30 dark:bg-white/5 border border-muted dark:border-white/10 rounded-xl px-4 text-xs text-foreground dark:text-white font-bold outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all shadow-inner"
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
                          width="12"
                          height="8"
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

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest ml-1">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000"
                      className="w-full h-14 bg-muted/30 dark:bg-white/5 border border-muted dark:border-white/10 rounded-xl px-4 text-xs text-foreground dark:text-white font-mono font-bold outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all shadow-inner tracking-widest"
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          accountNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest ml-1">
                      Tên chủ tài khoản
                    </label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      className="w-full h-14 bg-muted/30 dark:bg-white/5 border border-muted dark:border-white/10 rounded-xl px-4 text-xs text-foreground dark:text-white font-bold outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 uppercase transition-all shadow-inner"
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
            <div className="bg-white/60 dark:bg-[#0B1120]/80 backdrop-blur-xl border border-muted dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl rounded-[2rem] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-[0.2em]">
                  Số dư ví Fuji
                </span>
                <Wallet size={16} className="text-cyan-500 dark:text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-foreground dark:text-white tracking-tighter">
                  {balance.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground dark:text-slate-500 uppercase">
                  VND
                </span>
              </div>
              <div className="pt-6 border-t border-muted dark:border-white/5 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide px-2">
                  <span className="text-muted-foreground dark:text-slate-500">Số tiền rút:</span>
                  <span className="text-foreground dark:text-white font-black">
                    {withdrawAmount.toLocaleString()} đ
                  </span>
                </div>
                <div className="pt-4 border-t border-dashed border-muted dark:border-white/10 flex justify-between items-end bg-pink-500/5 -mx-2 px-4 py-3 rounded-xl border border-pink-500/20">
                  <span className="text-[10px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest">
                    Thực nhận:
                  </span>
                  <span className="text-2xl font-black text-pink-600 dark:text-pink-400 tracking-tighter">
                    {finalAmount.toLocaleString()} đ
                  </span>
                </div>
              </div>
            </div>

            <Button
              form="withdraw-form"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 rounded-[1.5rem] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-pink-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {isSubmitting ? "Đang xử lý..." : "Gửi yêu cầu rút tiền"}
            </Button>
          </aside>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-background dark:bg-[#0f1218] border border-muted dark:border-white/10 text-foreground dark:text-slate-200 rounded-[2.5rem] max-w-md p-8 shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-2 border border-amber-500/20 shadow-inner">
              <AlertCircle size={32} />
            </div>
            <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight text-foreground dark:text-white">
              Xác nhận thông tin
            </DialogTitle>
            <DialogDescription className="text-center text-[11px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-widest leading-relaxed">
              Vui lòng kiểm tra kỹ số tài khoản. Ban quản trị sẽ chuyển tiền thủ công theo thông tin này.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 dark:bg-white/5 rounded-2xl p-6 space-y-5 border border-muted dark:border-white/5 my-6 shadow-inner">
            <div className="flex justify-between items-center border-b border-muted dark:border-white/5 pb-4">
              <span className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Landmark size={14} className="text-cyan-500"/> Ngân hàng
              </span>
              <span className="text-xs font-black text-foreground dark:text-white uppercase">
                {bankInfo.bankName}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-muted dark:border-white/5 pb-4">
              <span className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest flex flex-row items-center gap-2">
                Số tài khoản
              </span>
              <span className="text-sm font-mono font-black text-foreground dark:text-white tracking-widest">
                {bankInfo.accountNumber}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-muted dark:border-white/5 pb-4">
              <span className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest flex flex-row items-center gap-2">
                Chủ tài khoản
              </span>
              <span className="text-xs font-black text-foreground dark:text-white uppercase">
                {bankInfo.accountHolder}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest flex items-center gap-2">
                <Banknote size={14} /> Thực nhận
              </span>
              <span className="text-xl font-black text-pink-600 dark:text-pink-400">
                {finalAmount.toLocaleString()} đ
              </span>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1 h-12 rounded-xl border border-muted dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmWithdraw}
              className="flex-1 h-12 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/20"
            >
              Xác nhận rút
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SuccessState({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background dark:bg-[#0a0c10] flex items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="max-w-md w-full bg-white dark:bg-[#0B1120]/80 backdrop-blur-2xl border border-emerald-500/20 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-full h-full rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-inner rotate-12 transition-transform duration-500 hover:rotate-0">
            <CheckCircle2 size={40} strokeWidth={3} className="-rotate-12 hover:rotate-0 transition-transform duration-500"/>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter drop-shadow-sm">
            Yêu cầu đã gửi!
          </h3>
          <p className="text-muted-foreground dark:text-slate-400 text-xs uppercase font-bold tracking-widest leading-relaxed">
            Hệ thống đang xử lý giao dịch. Thời gian duyệt từ 2-24 giờ làm việc.
          </p>
        </div>

        <Button
          type="button"
          onClick={onBack}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> Quay lại ví Fuji
        </Button>
      </div>
    </div>
  );
}
