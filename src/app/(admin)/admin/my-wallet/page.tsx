"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  History,
  Snowflake,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useGetWalletHistoryQuery,
  useGetWalletQuery,
} from "@/store/services/walletApi";
import type { Transaction } from "@/types/wallet";

type WalletFilter = "ALL" | "TOPUP" | "SPENDING" | "WITHDRAW";

const FILTERS: Array<{ value: WalletFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "TOPUP", label: "Nạp tiền" },
  { value: "SPENDING", label: "Chi tiêu" },
  { value: "WITHDRAW", label: "Rút tiền" },
];

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatHoa(value: number | null | undefined) {
  return `${numberFormatter.format(Number(value ?? 0))} 🌸`;
}

function getTransactionType(tx: Transaction) {
  return tx.type.toUpperCase();
}

function isWithdrawTransaction(tx: Transaction) {
  const type = getTransactionType(tx);
  return type === "PAYOUT" || type.startsWith("WITHDRAW");
}

function isDepositTransaction(tx: Transaction) {
  const type = getTransactionType(tx);
  return type === "TOPUP" || type === "DEPOSIT";
}

function isSpendingTransaction(tx: Transaction) {
  return tx.amount < 0 && !isWithdrawTransaction(tx);
}

function getTransactionLabel(tx: Transaction) {
  if (isDepositTransaction(tx)) return "Nạp tiền";
  if (isWithdrawTransaction(tx)) {
    return getTransactionType(tx) === "WITHDRAWAL_FEE"
      ? "Phí rút tiền"
      : "Rút tiền";
  }
  return "Chi tiêu";
}

function filterTransaction(tx: Transaction, filter: WalletFilter) {
  if (filter === "ALL") return true;
  if (filter === "TOPUP") return isDepositTransaction(tx);
  if (filter === "WITHDRAW") return isWithdrawTransaction(tx);
  return isSpendingTransaction(tx);
}

export default function AdminMyWalletPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<WalletFilter>("ALL");
  const size = 10;

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

  const balance = Number(wallet?.balance ?? 0);
  const frozenBalance = Number(wallet?.frozenBalance ?? 0);
  const availableBalance = Number(
    wallet?.availableBalance ?? Math.max(balance - frozenBalance, 0),
  );
  const transactions = useMemo(
    () => historyData?.content ?? [],
    [historyData?.content],
  );
  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => filterTransaction(tx, filter)),
    [filter, transactions],
  );
  const totalPages = historyData?.totalPages ?? 0;
  const isLoading = isWalletLoading || isHistoryLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ví của tôi</h1>
          <p className="text-muted-foreground">
            Theo dõi số dư và lịch sử giao dịch ví cá nhân trong admin workspace.
          </p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1">
          WALLET_VIEW
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số dư khả dụng
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoa(availableBalance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Có thể dùng cho chi tiêu hoặc tạo yêu cầu rút tiền.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số dư tổng
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoa(balance)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Bao gồm số dư đang bị giữ nếu có.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang giữ
            </CardTitle>
            <Snowflake className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoa(frozenBalance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Khoản tiền đang xử lý hoặc chưa thể sử dụng.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Lịch sử ví cá nhân
            </CardTitle>
            <CardDescription>
              Hiển thị giao dịch ví của chính tài khoản đang đăng nhập.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={filter === item.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="text-right">Số dư sau</TableHead>
                  <TableHead className="text-right">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Đang tải dữ liệu ví...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Chưa có giao dịch phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="font-mono text-xs font-medium">
                            {tx.referenceId ||
                              `TX-${String(tx.id).padStart(6, "0")}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getTransactionLabel(tx)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate text-muted-foreground">
                          {tx.description || getTransactionType(tx)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            isPositive ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          <span className="inline-flex items-center justify-end gap-1">
                            {isPositive ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            )}
                            {isPositive ? "+" : "-"}
                            {formatHoa(Math.abs(tx.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatHoa(tx.balanceAfter)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {page + 1} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
