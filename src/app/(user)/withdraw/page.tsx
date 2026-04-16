"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Landmark,
  ShieldCheck,
  CheckCircle2,
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
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function WithdrawPage() {
  const { t, i18n } = useTranslation();
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
  const payoutAmountVnd = withdrawAmount * 1000;

  const validateForm = () => {
    if (withdrawAmount < 50) {
      toast.error(t("wallet.withdraw.minAmountError"));
      return false;
    }
    if (withdrawAmount > balance) {
      toast.error(t("wallet.insufficientBalance"));
      return false;
    }
    if (
      !bankInfo.bankName ||
      !bankInfo.accountNumber ||
      !bankInfo.accountHolder
    ) {
      toast.error(t("wallet.withdraw.missingBankInfo"));
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
      toast.success(t("wallet.withdraw.success"));
    } catch (error: any) {
      toast.error(error?.data?.message || t("wallet.withdraw.failed"));
    }
  };

  if (isSuccess)
    return <SuccessState onBack={() => router.push("/profile/wallet")} />;

  return (
    <main className="min-h-screen bg-transparent text-slate-900 dark:text-slate-200 pb-20">
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
              <ArrowLeft size={16} /> {t("wallet.back")}
            </button>
            <h2 className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap">
              {t("wallet.withdraw.title").split(" ")[0]} <span className="text-pink-500">{t("wallet.withdraw.title").split(" ")[1] || ""}</span>
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
            <ShieldCheck size={14} className="text-pink-500" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
              {t("wallet.withdraw.secureTransaction")}
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Banknote size={16} className="text-pink-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">
                    {t("wallet.withdraw.inputAmount")}
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
                    🌸
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t("wallet.withdraw.expectedVnd")}{" "}
                  <span className="font-bold text-pink-500">
                    {payoutAmountVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}đ
                  </span>
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("wallet.withdraw.quickSelect")}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[100, 200, 500].map((val) => (
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
                      className={cn(
                        "px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2",
                        showNote ? "border-pink-500 text-pink-500" : "border-slate-200 dark:border-white/10 text-slate-500"
                      )}
                    >
                      <HelpCircle size={14} /> {t("wallet.withdraw.limits")}
                    </button>
                  </div>
                </div>

                {showNote && (
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-[11px] font-medium leading-relaxed text-slate-500">
                    {t("wallet.withdraw.minLimit")} <br />
                    {t("wallet.withdraw.maxLimit")}
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 ml-1">
                  <Landmark size={16} className="text-pink-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">
                    {t("wallet.withdraw.bankInfoTitle")}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      {t("wallet.withdraw.bankName")}
                    </p>
                    <input
                      list="bank-list"
                      placeholder={t("wallet.withdraw.selectBank")}
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
                      {t("wallet.withdraw.accountNumber")}
                    </p>
                    <input
                      type="text"
                      placeholder={t("wallet.withdraw.inputAccountNumber")}
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
                      {t("wallet.withdraw.accountHolder")}
                    </p>
                    <input
                      type="text"
                      placeholder={t("wallet.withdraw.accountHolderPlaceholder")}
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
                    {t("wallet.availableBalance")}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">
                      {balance.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                    <span className="text-xs font-bold opacity-40 uppercase">
                      🌸
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    ~ {(balance * 1000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}đ
                  </p>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-60 font-bold uppercase">
                      {t("wallet.withdraw.blossomsToExchange")}
                    </span>
                    <span className="font-black">
                      {withdrawAmount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} 🌸
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-60 font-bold uppercase">
                      {t("wallet.withdraw.transactionFee")}
                    </span>
                    <span className="font-black text-pink-400">{t("common.free")}</span>
                  </div>
                  <div className="pt-4 flex justify-between items-end border-t border-white/10">
                    <span className="text-xs font-black uppercase text-pink-500">
                      {t("wallet.withdraw.actualReceived")}
                    </span>
                    <span className="text-3xl font-black tracking-tighter">
                      {payoutAmountVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}đ
                    </span>
                  </div>
                </div>
              </div>

              <Button
                form="withdraw-form"
                disabled={isSubmitting}
                className="w-full h-16 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 transition-all"
              >
                {isSubmitting ? t("common.processing") : t("wallet.withdraw.confirmRequest")}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-[2rem] p-8">
          <DialogHeader className="text-center">
            <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-xl font-black uppercase">
              {t("wallet.withdraw.confirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-medium uppercase tracking-tight">
              {t("wallet.withdraw.confirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl space-y-4 my-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t("wallet.withdraw.blossomsToExchange")}
              </span>
              <span className="text-xs font-black">
                {withdrawAmount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} 🌸
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t("wallet.withdraw.actualReceived")}
              </span>
              <span className="text-xs font-black text-pink-500">
                {payoutAmountVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}đ
              </span>
            </div>
            {[
              { label: t("wallet.withdraw.bankName"), value: bankInfo.bankName },
              {
                label: t("wallet.withdraw.accountNumber"),
                value: bankInfo.accountNumber,
                mono: true,
              },
              { label: t("wallet.withdraw.accountHolder"), value: bankInfo.accountHolder, upper: true },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-xs font-black",
                    item.mono && "font-mono tracking-wider",
                    item.upper && "uppercase"
                  )}
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
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmWithdraw}
              className="flex-1 bg-pink-500 font-black text-xs uppercase"
            >
              {t("wallet.withdraw.confirmWithdraw")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SuccessState({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl">
        <div className="w-20 h-20 bg-pink-500/10 text-pink-500 rounded-3xl flex items-center justify-center mx-auto rotate-12">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tighter">
            {t("wallet.withdraw.requestSent")}
          </h3>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
            {t("wallet.withdraw.reviewDesc")}
          </p>
        </div>
        <Button
          onClick={onBack}
          className="w-full h-14 bg-slate-900 dark:bg-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest"
        >
          {t("wallet.backToWallet")}
        </Button>
      </div>
    </div>
  );
}
