"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  History,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useGetWalletHistoryQuery,
  useGetWalletQuery,
} from "@/store/services/walletApi";
import { useTranslation } from "react-i18next";
import { Transaction } from "@/types/wallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function FujiWallet() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<string>("ALL");
  const size = 10;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const { data: wallet, isLoading: isWalletLoading } = useGetWalletQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const { data: historyData, isLoading: isHistoryLoading } =
    useGetWalletHistoryQuery({ page, size });

  const balance = wallet?.balance || 0;
  const transactions = historyData?.content || [];
  const totalPages = historyData?.totalPages || 0;

  if (!mounted) return null;
  if (isWalletLoading || isHistoryLoading) return <LoadingState />;

  return (
    <main className="flex-1 flex flex-col px-6 overflow-hidden relative selection:bg-pink-500/30">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-8 py-6 border-b dark:border-white/5 bg-background/50 backdrop-blur-md">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-pink-500 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> {t("wallet.back")}
          </button>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            {t("wallet.title").split(" ")[0]}{" "}
            <span className="text-pink-500 dark:text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              {t("wallet.title").split(" ")[1] || "Fuji"}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t("wallet.subtitle")}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Wallet Card */}
          <Card className="lg:col-span-8 overflow-hidden border-none bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0a0c10] text-white relative shadow-2xl rounded-[2.5rem]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <CardHeader className="relative z-10 pt-6 px-10">
              <div className="flex items-center gap-2 text-white/60">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                   <Wallet size={18} className="text-pink-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-100/70">
                  {t("wallet.availableBalance")}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info
                        size={12}
                        className="opacity-40 hover:opacity-100 text-pink-400"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#111827] border border-pink-500/20 text-[10px] text-pink-100 backdrop-blur-xl">
                      {t("wallet.balanceDescription")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>

            <CardContent className="relative z-10 px-10 pb-6 pt-4">
              <div className="flex items-baseline gap-4">
                <span className="text-2xl md:text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {balance.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
                <span className="text-3xl font-black text-pink-500/40 uppercase tracking-tighter">
                  🌸
                </span>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center gap-8 justify-between">
                <div className="flex items-center gap-4 group cursor-help">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center font-black text-white shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform duration-500">
                    🌸
                  </div>
                  <div>
                    <div className="text-[10px] text-pink-100/50 font-black uppercase tracking-widest">
                      {t("wallet.exchangeVND")}
                    </div>
                    <div className="text-xl font-black text-white">
                      {(balance * 1000).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}{" "}
                      <span className="text-[10px] text-pink-100/30 ml-1">
                        VND
                      </span>
                    </div>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info
                          size={14}
                          className="opacity-40 hover:opacity-100 text-pink-400"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#111827] border border-pink-500/20 text-[10px] text-pink-100 backdrop-blur-xl">
                        {t("wallet.balanceDescription")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 flex-1 md:flex-none md:w-auto">
                  <Button
                    onClick={() => router.push("/premium?tab=topup")}
                    size="lg"
                    className="flex-1 md:flex-none bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-2 rounded-xl transition"
                  >
                    <Plus className="mr-2" size={18} strokeWidth={3} /> {t("wallet.deposit")}
                  </Button>

                  <Button
                    onClick={() => router.push("/withdraw")}
                    size="lg"
                    className="flex-1 md:flex-none bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-2 rounded-xl transition"
                  >
                    <ArrowUpRight className="mr-2" size={18} strokeWidth={3} />{" "}
                    {t("wallet.withdraw.title").split(" ")[0]}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Stats */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-pink-500/20 bg-pink-500/5 shadow-xl shadow-pink-500/5 group overflow-hidden h-[180px] relative transition-all hover:-translate-y-1 rounded-[2rem]">
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-pink-500/10 -rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
              <CardHeader className="pb-2">
                <CardDescription className="text-pink-500/70 font-black uppercase tracking-[0.2em] text-[10px]">
                  {t("wallet.monthlyTransactions")}
                </CardDescription>
                <CardTitle className="text-5xl font-black text-pink-500 dark:text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                  {historyData?.totalElements || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-pink-500 dark:text-pink-400 font-bold text-[10px] uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full shadow-inner animate-pulse">
                  <ArrowUpRight size={14} /> {t("wallet.steadyGrowth")}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl shadow-black/5 border-muted/60 dark:border-white/5 h-[100px] flex items-center justify-between px-8 transition-transform hover:-translate-y-1 rounded-[1.5rem] dark:bg-[#0B1120]/60 dark:backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
                  {t("wallet.membershipLevel")}
                </p>
                <p className="text-xl font-black text-foreground dark:text-white uppercase tracking-tighter">
                  {t("wallet.premiumUser")}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500 rotate-12 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
                <TrendingUp size={24} className="-rotate-12" />
              </div>
            </Card>
          </div>
        </div>

        {/* Transaction Section */}
        <Card className="shadow-2xl shadow-black/5 border-muted/60 dark:border-white/5 overflow-hidden rounded-[2.5rem] dark:bg-[#0B1120]/60 dark:backdrop-blur-xl">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b dark:border-white/5 px-10 pt-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500 dark:text-pink-400 border border-pink-500/20 shadow-inner">
                <History size={24} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold uppercase tracking-tight text-foreground dark:text-white">
                  {t("wallet.transactionHistory")}
                </CardTitle>
                <CardDescription className="text-muted-foreground dark:text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                  {t("wallet.balanceFluctuations")}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex p-1 bg-muted dark:bg-black/20 border dark:border-white/5 rounded-xl shadow-inner">
                {["ALL", "DEPOSIT", "WITHDRAW"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)} // Filter currently handled by local state if implemented, or query params
                    className={cn(
                      "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      filter === type
                        ? "bg-background text-pink-500 dark:bg-[#111827] dark:text-pink-400 shadow-sm border dark:border-pink-500/20"
                        : "text-muted-foreground dark:text-slate-500 hover:text-foreground hover:bg-white/5",
                    )}
                  >
                    {t(`wallet.filter.${type.toLowerCase()}`)}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-pink-400 transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={t("wallet.searchPlaceholder")}
                  className="pl-10 pr-4 h-11 w-full md:w-64 rounded-xl bg-muted dark:bg-black/10 border border-muted dark:border-white/5 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-xs font-bold uppercase tracking-widest text-foreground dark:text-white shadow-inner"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30 dark:bg-black/10 uppercase text-[10px] font-black tracking-widest text-muted-foreground dark:text-slate-500">
                <TableRow className="dark:border-white/5">
                  <TableHead className="px-8 h-12">{t("wallet.table.id")}</TableHead>
                  <TableHead className="px-8 h-12">{t("wallet.table.type")}</TableHead>
                  <TableHead className="px-8 h-12 text-right">
                    {t("wallet.table.amount")}
                  </TableHead>
                  <TableHead className="px-8 h-12 whitespace-nowrap">{t("wallet.table.balanceAfter")}</TableHead>
                  <TableHead className="px-8 h-12 text-right">
                    {t("wallet.table.status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: Transaction) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/10 dark:hover:bg-white/[0.02] transition-colors group border-b dark:border-white/5 last:border-0"
                  >
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shadow-inner",
                            tx.type === "DEPOSIT" || tx.amount > 0
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-pink-500/10 text-pink-500 border-pink-500/20",
                          )}
                        >
                          {tx.type === "DEPOSIT" || tx.amount > 0 ? (
                            <ArrowUpRight size={18} />
                          ) : (
                            <ArrowDownLeft size={18} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold uppercase tracking-tighter text-foreground dark:text-slate-200">
                            {tx.referenceId ||
                              `TX-${String(tx.id).slice(-6).toUpperCase()}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground dark:text-slate-500 font-bold mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString(
                              i18n.language === 'vi' ? 'vi-VN' : 'en-US',
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground dark:text-slate-500 whitespace-nowrap">
                      {tx.type === "DEPOSIT" 
                        ? t("wallet.types.deposit") 
                        : t("wallet.types.spending")}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-8 py-6 text-right font-black text-xl tracking-tighter whitespace-nowrap",
                        (tx.type === "DEPOSIT" || tx.amount > 0) ? "text-emerald-500 dark:text-emerald-400" : "text-foreground dark:text-white"
                      )}
                    >
                      {tx.type === "DEPOSIT" || tx.amount > 0 ? "+" : "-"}
                      {Math.abs(tx.amount).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                      <span className="text-[10px] ml-1 opacity-70">🌸</span>
                    </TableCell>
                    <TableCell className="px-8 py-6 font-semibold text-xs text-muted-foreground dark:text-slate-400 tracking-tight whitespace-nowrap">
                      {tx.balanceAfter.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}{" "}
                      <span className="text-[10px] opacity-40 whitespace-nowrap">
                        🌸
                      </span>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase px-3 py-1"
                      >
                        {t("wallet.status.success")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <div className="p-4 rounded-full bg-muted dark:bg-white/5 border dark:border-white/5">
                          <History size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">
                          {t("common.noResults")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>

          {totalPages > 1 && (
            <CardFooter className="py-6 border-t dark:border-white/5 flex items-center justify-between px-10 bg-muted/20 dark:bg-black/10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t("sidebar.studentLevel")}: {page + 1} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="rounded-xl h-10 w-10 border-muted dark:border-white/5 dark:bg-[#0B1120] hover:bg-pink-500/10"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= totalPages}
                  className="rounded-xl h-10 w-10 border-muted dark:border-white/5 dark:bg-[#0B1120] hover:bg-pink-500/10"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  );
}

function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[400px] flex flex-col justify-center items-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-muted dark:border-white/5 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-pink-500 rounded-full animate-spin shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-pink-500 dark:text-pink-400 font-black uppercase tracking-[0.3em] text-[10px]">
          Fuji {t("wallet.title").split(" ")[1] || "Wallet"}
        </p>
        <p className="text-muted-foreground/50 font-bold uppercase tracking-widest text-[8px] animate-pulse">
          {t("api.loading")}
        </p>
      </div>
    </div>
  );
}
