"use client";

import { useState, useEffect } from "react";
import { useGetWalletHistoryQuery } from "@/store/services/walletApi";
import { Transaction } from "@/types/wallet";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  History,
  Search,
} from "lucide-react";

export default function TransactionHistory() {
  const [page, setPage] = useState(0);
  const size = 10;
  const [mounted, setMounted] = useState(false);

  // Tránh lỗi Hydration
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError } = useGetWalletHistoryQuery({ page, size });

  const transactions = data?.content || [];
  const totalPages = data?.totalPages || 0;

  if (!mounted) return null;

  if (isLoading)
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (isError)
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
        Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
      </div>
    );

  return (
    <div className="ml-10 p-4 md:p-8 max-w-7xl mx-auto space-y-6 transition-colors duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="text-indigo-500" />
            Lịch sử giao dịch
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Theo dõi các hoạt động nạp tiền và thanh toán của bạn
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch..."
            className="pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 transition-all text-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[1.5rem] transition-all">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">
                  Mã GD
                </th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">
                  Loại
                </th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  Số tiền
                </th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">
                  Số dư sau GD
                </th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">
                  Thời gian
                </th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">
                  Nội dung
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length > 0 ? (
                transactions.map((tx: Transaction) => {
                  const isDeposit = tx.type === "DEPOSIT" || tx.amount > 0;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        #{tx.referenceId || tx.id}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isDeposit
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400"
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}
                          {tx.type}
                        </span>
                      </td>

                      <td
                        className={`p-4 text-right font-black ${
                          isDeposit
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-pink-600 dark:text-pink-400"
                        }`}
                      >
                        {isDeposit ? "+" : "-"}
                        {tx.amount.toLocaleString()} đ
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {tx.balanceAfter.toLocaleString()} đ
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Trước: {tx.balanceBefore.toLocaleString()} đ
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                        {tx.description}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-slate-400 italic"
                  >
                    Chưa có giao dịch nào được ghi lại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hiển thị trang{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {page + 1}
          </span>{" "}
          / {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <ChevronLeft size={20} className="dark:text-white" />
          </button>

          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`hidden sm:block w-9 h-9 rounded-xl font-bold text-sm transition-all ${
                  page === i
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <ChevronRight size={20} className="dark:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
