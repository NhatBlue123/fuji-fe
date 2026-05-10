"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarIcon,
  Clock3,
  Download,
  Filter,
  Landmark,
  LineChart as LineChartIcon,
  Percent,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useGetBookingPolicyQuery,
  useUpdateBookingPolicyMutation,
} from "@/store/services/admin/bookingPolicyApi";
import { useGetRevenueStatsQuery } from "@/store/services/adminRevenueApi";
import type {
  AdminRevenueRecentTransaction,
  AdminRevenueStatsResponse,
  BankTransferRecord,
  CashRevenueSummary,
  FinancialPeriodSummary,
  LiabilityEstimateSummary,
  MonthlyFinancialSummary,
  MonthlyPaymentStatus,
  PaymentPeriodStatus,
  PaymentStatusStats,
  WalletPositionSummary,
  WithdrawalStatusStats,
} from "@/types/admin-revenue";

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const HOA_TO_VND = 1000;
const DEFAULT_PLATFORM_FEE_PERCENT = 30;

type TimeRangeMode = "day" | "week" | "month" | "year";
type XGateRecordFilter = "all" | "success" | "ignored";
type TransactionTypeFilter =
  | "ALL"
  | "TOPUP"
  | "WITHDRAW"
  | "COURSE"
  | "BOOKING"
  | "SUBSCRIPTION"
  | "PACKAGE"
  | "OTHER";

type DateBounds = {
  from: Date;
  to: Date;
};

type FinancialChartRow = {
  label: string;
  sortKey: number;
  start?: Date;
  end?: Date;
  revenueVnd: number;
  withdrawnVnd: number;
  teacherDebtVnd: number;
  estimatedProfitVnd: number;
  grossTradingVnd: number;
  bookingVnd: number;
  courseVnd: number;
};

type PeriodSourceRow = {
  label: string;
  sortKey: number;
  start?: Date;
  end?: Date;
  bankInVnd: number;
  bankOutVnd: number;
  teacherGrossIncomeHoa: number;
  bookingGrossHoa: number;
  courseGrossHoa: number;
};

type OverallFinance = {
  cashInVnd: number;
  cashOutVnd: number;
  cashOnHandVnd: number;
  teacherOwnedHoa: number;
  teacherGrossDebtVnd: number;
  teacherNetDebtVnd: number;
  platformFeeReserveVnd: number;
  estimatedProfitVnd: number;
  userPrepaidHoa: number;
  userPrepaidVnd: number;
  adminInternalHoa: number;
  adminHoaVnd: number;
  pendingWithdrawVnd: number;
  processingWithdrawVnd: number;
};

const EMPTY_PAYMENT_STATS: PaymentStatusStats = {
  totalCount: 0,
  successCount: 0,
  pendingCount: 0,
  failedCount: 0,
  cancelledCount: 0,
  successAmount: 0,
  pendingAmount: 0,
  failedAmount: 0,
  cancelledAmount: 0,
  estimatedSuccessVnd: 0,
  estimatedPendingVnd: 0,
  estimatedCancelledVnd: 0,
  actualSuccessVnd: 0,
  expectedPendingVnd: 0,
  expectedFailedVnd: 0,
  expectedCancelledVnd: 0,
  successRate: 0,
  failureRate: 0,
  cancellationRate: 0,
};

const EMPTY_WITHDRAWAL_STATS: WithdrawalStatusStats = {
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  rejectedCount: 0,
  pendingAmount: 0,
  processingAmount: 0,
  completedAmount: 0,
  rejectedAmount: 0,
};

const EMPTY_CASH_REVENUE: CashRevenueSummary = {
  grossTopupVnd: 0,
  pendingExpectedTopupVnd: 0,
  failedExpectedTopupVnd: 0,
  bankOutVnd: 0,
  netCashVnd: 0,
  creditedBlossoms: 0,
};

const EMPTY_WALLET_POSITION: WalletPositionSummary = {
  totalBalanceHoa: 0,
  totalFrozenHoa: 0,
  totalAvailableHoa: 0,
  adminBalanceHoa: 0,
  adminFrozenHoa: 0,
  adminAvailableHoa: 0,
  instructorBalanceHoa: 0,
  instructorFrozenHoa: 0,
  instructorAvailableHoa: 0,
  userBalanceHoa: 0,
  userFrozenHoa: 0,
  userAvailableHoa: 0,
  adminWalletCount: 0,
  instructorWalletCount: 0,
  userWalletCount: 0,
};

const EMPTY_LIABILITY_ESTIMATE: LiabilityEstimateSummary = {
  teacherOwnedHoa: 0,
  teacherWithdrawableHoa: 0,
  teacherFrozenHoa: 0,
  teacherEstimatedDebtVnd: 0,
  teacherEstimatedNetDebtVnd: 0,
  teacherEstimatedPlatformFeeVnd: 0,
  platformFeeBps: DEFAULT_PLATFORM_FEE_PERCENT * 100,
  userPrepaidHoa: 0,
  userPrepaidVndEquivalent: 0,
  adminInternalHoa: 0,
  adminInternalVndEquivalent: 0,
  pendingWithdrawalVnd: 0,
  processingWithdrawalVnd: 0,
};

export default function AdminRevenuePage() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetRevenueStatsQuery();
  const { data: bookingPolicy } = useGetBookingPolicyQuery();
  const [updateBookingPolicy, { isLoading: isSavingPlatformFee }] =
    useUpdateBookingPolicyMutation();

  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [timeRangeMode, setTimeRangeMode] = useState<TimeRangeMode>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [xgateRecordFilter, setXgateRecordFilter] =
    useState<XGateRecordFilter>("all");
  const [transactionTypeFilter, setTransactionTypeFilter] =
    useState<TransactionTypeFilter>("ALL");
  const [platformFeeDraft, setPlatformFeeDraft] = useState<number | null>(null);

  const paymentStats = stats?.paymentStatusStats ?? EMPTY_PAYMENT_STATS;
  const withdrawalStats = stats?.withdrawalStatusStats ?? EMPTY_WITHDRAWAL_STATS;
  const cashRevenue = stats?.cashRevenue ?? EMPTY_CASH_REVENUE;
  const walletPosition = stats?.walletPositionSummary ?? EMPTY_WALLET_POSITION;
  const liabilityEstimate =
    stats?.liabilityEstimateSummary ?? EMPTY_LIABILITY_ESTIMATE;
  const serverPlatformFeePercent = bpsToPercent(
    bookingPolicy?.withdrawPlatformFeeBps ??
      liabilityEstimate.platformFeeBps ??
      DEFAULT_PLATFORM_FEE_PERCENT * 100,
  );
  const platformFeePercent = platformFeeDraft ?? serverPlatformFeePercent;
  const monthlyPaymentStatuses = useMemo(
    () => stats?.monthlyPaymentStatuses ?? [],
    [stats?.monthlyPaymentStatuses],
  );
  const weeklyPaymentStatuses = useMemo(
    () => stats?.weeklyPaymentStatuses ?? [],
    [stats?.weeklyPaymentStatuses],
  );
  const yearlyPaymentStatuses = useMemo(
    () => stats?.yearlyPaymentStatuses ?? [],
    [stats?.yearlyPaymentStatuses],
  );
  const monthlyFinancial = useMemo(
    () => stats?.monthlyFinancialSummaries ?? [],
    [stats?.monthlyFinancialSummaries],
  );
  const weeklyFinancial = useMemo(
    () => stats?.weeklyFinancialSummaries ?? [],
    [stats?.weeklyFinancialSummaries],
  );
  const yearlyFinancial = useMemo(
    () => stats?.yearlyFinancialSummaries ?? [],
    [stats?.yearlyFinancialSummaries],
  );
  const bankTransferRecords = useMemo(
    () => stats?.bankTransferRecords ?? [],
    [stats?.bankTransferRecords],
  );
  const recentTransactions = useMemo(
    () => stats?.recentTransactions ?? [],
    [stats?.recentTransactions],
  );

  const dateBounds = useMemo(() => normalizeDateBounds(dateRange), [dateRange]);
  const selectedYearNumber = Number(selectedYear);

  const dailyFinancial = useMemo(
    () => buildDailyFinancialSummaries(bankTransferRecords, recentTransactions),
    [bankTransferRecords, recentTransactions],
  );
  const dailyPaymentStatuses = useMemo(
    () => buildDailyPaymentStatuses(bankTransferRecords),
    [bankTransferRecords],
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>([CURRENT_YEAR]);
    monthlyFinancial.forEach((item) => years.add(item.year));
    weeklyFinancial.forEach((item) => item.year && years.add(item.year));
    yearlyFinancial.forEach((item) => item.year && years.add(item.year));
    dailyFinancial.forEach((item) => item.start && years.add(item.start.getFullYear()));
    monthlyPaymentStatuses.forEach((item) => years.add(item.year));
    weeklyPaymentStatuses.forEach((item) => item.year && years.add(item.year));
    yearlyPaymentStatuses.forEach((item) => item.year && years.add(item.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [
    dailyFinancial,
    monthlyFinancial,
    monthlyPaymentStatuses,
    weeklyFinancial,
    weeklyPaymentStatuses,
    yearlyFinancial,
    yearlyPaymentStatuses,
  ]);

  const financialChartData = useMemo(
    () =>
      buildFinancialChartData({
        mode: timeRangeMode,
        selectedYear: selectedYearNumber,
        dateBounds,
        platformFeePercent,
        daily: dailyFinancial,
        monthly: monthlyFinancial,
        weekly: weeklyFinancial,
        yearly: yearlyFinancial,
      }),
    [
      dailyFinancial,
      dateBounds,
      monthlyFinancial,
      platformFeePercent,
      selectedYearNumber,
      timeRangeMode,
      weeklyFinancial,
      yearlyFinancial,
    ],
  );

  const paymentChartData = useMemo(
    () =>
      buildPaymentChartData({
        mode: timeRangeMode,
        selectedYear: selectedYearNumber,
        dateBounds,
        daily: dailyPaymentStatuses,
        monthly: monthlyPaymentStatuses,
        weekly: weeklyPaymentStatuses,
        yearly: yearlyPaymentStatuses,
      }),
    [
      dailyPaymentStatuses,
      dateBounds,
      monthlyPaymentStatuses,
      selectedYearNumber,
      timeRangeMode,
      weeklyPaymentStatuses,
      yearlyPaymentStatuses,
    ],
  );

  const visibleBankTransferRecords = useMemo(
    () => filterBankTransferRecordsByDate(bankTransferRecords, dateBounds),
    [bankTransferRecords, dateBounds],
  );
  const filteredBankTransferRecords = useMemo(
    () => filterXGateRecords(visibleBankTransferRecords, xgateRecordFilter),
    [visibleBankTransferRecords, xgateRecordFilter],
  );
  const visibleRecentTransactions = useMemo(
    () => filterTransactionsByDate(recentTransactions, dateBounds),
    [dateBounds, recentTransactions],
  );
  const filteredRecentTransactions = useMemo(
    () =>
      filterTransactionsByType(visibleRecentTransactions, transactionTypeFilter),
    [transactionTypeFilter, visibleRecentTransactions],
  );

  const overallFinance = useMemo(
    () =>
      buildOverallFinance({
        cashRevenue,
        liabilityEstimate,
        platformFeePercent,
      }),
    [cashRevenue, liabilityEstimate, platformFeePercent],
  );

  const chartTotals = useMemo(
    () => summarizeFinancialRows(financialChartData),
    [financialChartData],
  );

  const handleRefresh = async () => {
    try {
      await refetch().unwrap();
      toast.success("Dữ liệu tài chính đã được cập nhật");
    } catch {
      toast.error("Không thể cập nhật dữ liệu tài chính");
    }
  };

  const handleSavePlatformFee = async () => {
    if (!bookingPolicy) {
      toast.error("Chưa tải được policy phí sàn");
      return;
    }

    try {
      await updateBookingPolicy({
        ...bookingPolicy,
        withdrawPlatformFeeBps: percentToBps(platformFeePercent),
      }).unwrap();
      setPlatformFeeDraft(null);
      await refetch().unwrap();
      toast.success("Đã lưu phí sàn rút tiền");
    } catch {
      toast.error("Không thể lưu phí sàn rút tiền");
    }
  };

  const handleExport = () => {
    if (!stats) {
      toast.error("Chưa có dữ liệu để xuất báo cáo");
      return;
    }
    exportAdminAnalyticsCsv({
      stats,
      platformFeePercent,
      overallFinance,
      financialChartData,
    });
    toast.success("Đã xuất báo cáo analytics");
  };

  if (isLoading) {
    return <AnalyticsLoadingState />;
  }

  if (isError || !stats) {
    return <AnalyticsErrorState onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-950 dark:bg-white dark:text-slate-950">
                Tài chính giao dịch
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {timeRangeLabel(timeRangeMode)}
              </Badge>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                Báo cáo tài chính FUJI
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Lợi nhuận ước tính = tổng nạp thành công - công nợ giáo viên sau phí sàn - tiền đã rút của giáo viên.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border bg-background p-2 shadow-sm lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
            <Select
              value={timeRangeMode}
              onValueChange={(value) => setTimeRangeMode(value as TimeRangeMode)}
            >
              <SelectTrigger className="h-9 w-full rounded-lg border-0 bg-muted/40 shadow-none lg:w-[132px]">
                <SelectValue placeholder="Kỳ xem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Theo ngày</SelectItem>
                <SelectItem value="week">Theo tuần</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
                <SelectItem value="year">Theo năm</SelectItem>
              </SelectContent>
            </Select>

            {timeRangeMode !== "year" ? (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 w-full rounded-lg border-0 bg-muted/40 shadow-none lg:w-[108px]">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              onClear={() => setDateRange(undefined)}
            />

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-9 rounded-lg border-0 bg-muted/40 px-3 font-semibold shadow-none"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Cập nhật
            </Button>
            <Button onClick={handleExport} className="h-9 rounded-lg px-3 font-semibold">
              <Download className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <KpiGrid overallFinance={overallFinance} />
        <PlatformFeeControl
          value={platformFeePercent}
          serverValue={serverPlatformFeePercent}
          onChange={setPlatformFeeDraft}
          onSave={handleSavePlatformFee}
          isSaving={isSavingPlatformFee}
          canSave={Boolean(bookingPolicy)}
          grossDebtVnd={overallFinance.teacherGrossDebtVnd}
          feeReserveVnd={overallFinance.platformFeeReserveVnd}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <FormulaCard
          overallFinance={overallFinance}
          platformFeePercent={platformFeePercent}
          cashRevenue={cashRevenue}
        />
        <WalletInventoryCard walletPosition={walletPosition} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <FinancialChartCard
          rows={financialChartData}
          chartTotals={chartTotals}
          platformFeePercent={platformFeePercent}
          mode={timeRangeMode}
        />
        <OperationsPanel
          paymentStats={paymentStats}
          withdrawalStats={withdrawalStats}
          cashRevenue={cashRevenue}
          liabilityEstimate={liabilityEstimate}
          overallFinance={overallFinance}
        />
      </div>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Lệnh nạp theo {timeRangeLabel(timeRangeMode).toLowerCase()}
          </CardTitle>
          <CardDescription>
            Chỉ biểu diễn trạng thái lệnh nạp. Số tiền lợi nhuận dùng các khoản nạp đã ghi nhận từ XGate ở biểu đồ chính.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paymentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                />
                <Tooltip content={<PaymentTooltip />} />
                <Legend />
                <Bar dataKey="success" name="Hoàn thành" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pending" name="Đang chờ" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="failed" name="Thất bại" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cancelled" name="Đã hủy" fill="#64748b" radius={[6, 6, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <ReconciliationTabs
        xgateRecordFilter={xgateRecordFilter}
        onXgateRecordFilterChange={setXgateRecordFilter}
        transactionTypeFilter={transactionTypeFilter}
        onTransactionTypeFilterChange={setTransactionTypeFilter}
        bankTransferRecords={filteredBankTransferRecords}
        recentTransactions={filteredRecentTransactions}
      />
    </div>
  );
}

function ReconciliationTabs({
  xgateRecordFilter,
  onXgateRecordFilterChange,
  transactionTypeFilter,
  onTransactionTypeFilterChange,
  bankTransferRecords,
  recentTransactions,
}: {
  xgateRecordFilter: XGateRecordFilter;
  onXgateRecordFilterChange: (value: XGateRecordFilter) => void;
  transactionTypeFilter: TransactionTypeFilter;
  onTransactionTypeFilterChange: (value: TransactionTypeFilter) => void;
  bankTransferRecords: BankTransferRecord[];
  recentTransactions: AdminRevenueRecentTransaction[];
}) {
  return (
    <Card className="overflow-hidden">
      <Tabs defaultValue="xgate">
        <CardHeader className="flex flex-col gap-4 border-b px-6 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Đối soát giao dịch
            </CardTitle>
            <CardDescription>
              Dùng lịch sử ngân hàng để đối soát tiền thật, dùng sổ cái hoa để truy vết biến động ví nội bộ.
            </CardDescription>
          </div>
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg lg:w-[360px]">
            <TabsTrigger value="xgate" className="rounded-md text-xs font-bold">
              Lịch sử ngân hàng
            </TabsTrigger>
            <TabsTrigger value="ledger" className="rounded-md text-xs font-bold">
              Sổ cái hoa
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent value="xgate" className="m-0">
          <div className="flex flex-col gap-3 border-b bg-muted/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black">Dòng tiền qua ngân hàng</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Chỉ các khoản nạp đã ghi nhận và chi tiền giáo viên đã chuyển mới được đưa vào công thức lợi nhuận.
                Giao dịch chưa hạch toán chỉ dùng để đối soát.
              </p>
            </div>
            <Select
              value={xgateRecordFilter}
              onValueChange={(value) => onXgateRecordFilterChange(value as XGateRecordFilter)}
            >
              <SelectTrigger className="h-9 w-full rounded-lg lg:w-[220px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Bộ lọc ngân hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giao dịch</SelectItem>
                <SelectItem value="success">Chỉ đã ghi nhận</SelectItem>
                <SelectItem value="ignored">Chỉ cần đối soát</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bankTransferRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-3">Ngân hàng</th>
                    <th className="px-6 py-3">Giao dịch</th>
                    <th className="px-6 py-3 text-right">Số tiền</th>
                    <th className="px-6 py-3">Kết quả</th>
                    <th className="px-6 py-3">Người dùng</th>
                    <th className="px-6 py-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bankTransferRecords.map((record) => (
                    <BankTransferRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Landmark className="h-9 w-9 opacity-30" />}
              title="Không có giao dịch ngân hàng trong bộ lọc này"
              description="Thử đổi khoảng ngày hoặc bộ lọc trạng thái."
            />
          )}
        </TabsContent>

        <TabsContent value="ledger" className="m-0">
          <div className="flex flex-col gap-3 border-b bg-muted/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black">Sổ cái hoa nội bộ</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Ghi nhận biến động hoa trong ví: nạp hoa, giữ/rút hoa, mua khóa học, đặt lịch, mua gói và thuê bao.
              </p>
            </div>
            <Select
              value={transactionTypeFilter}
              onValueChange={(value) => onTransactionTypeFilterChange(value as TransactionTypeFilter)}
            >
              <SelectTrigger className="h-9 w-full rounded-lg lg:w-[230px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Loại hạch toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hạch toán</SelectItem>
                <SelectItem value="TOPUP">Nạp hoa</SelectItem>
                <SelectItem value="WITHDRAW">Rút hoa giáo viên</SelectItem>
                <SelectItem value="COURSE">Khóa học</SelectItem>
                <SelectItem value="BOOKING">Đặt lịch học</SelectItem>
                <SelectItem value="SUBSCRIPTION">Gói thành viên</SelectItem>
                <SelectItem value="PACKAGE">Gói hệ thống</SelectItem>
                <SelectItem value="OTHER">Nghiệp vụ khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-3">Người dùng</th>
                    <th className="px-6 py-3">Nghiệp vụ</th>
                    <th className="px-6 py-3">Mã tham chiếu</th>
                    <th className="px-6 py-3 text-right">Số hoa</th>
                    <th className="px-6 py-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentTransactions.map((transaction, index) => (
                    <TransactionRow
                      key={transaction.id ?? index}
                      transaction={transaction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<ReceiptText className="h-9 w-9 opacity-30" />}
              title="Không có hạch toán hoa trong bộ lọc này"
              description="Sổ cái sẽ hiện khi có phát sinh nạp hoa, rút hoa, khóa học, đặt lịch, thuê bao hoặc mua gói."
            />
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function KpiGrid({ overallFinance }: { overallFinance: OverallFinance }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<ArrowUpRight className="h-4 w-4" />}
        label="Tổng nạp thành công"
        value={formatVND(overallFinance.cashInVnd)}
        helper="Tiền bank từ XGate"
        tone="emerald"
      />
      <KpiCard
        icon={<ArrowDownRight className="h-4 w-4" />}
        label="Đã rút giáo viên"
        value={formatVND(overallFinance.cashOutVnd)}
        helper="Tiền bank đã chuyển"
        tone="rose"
      />
      <KpiCard
        icon={<Wallet className="h-4 w-4" />}
        label="Công nợ GV sau phí"
        value={formatVND(overallFinance.teacherNetDebtVnd)}
        helper={`Trước phí ${formatVND(overallFinance.teacherGrossDebtVnd)}`}
        tone="amber"
      />
      <KpiCard
        icon={<LineChartIcon className="h-4 w-4" />}
        label="Lợi nhuận ước tính"
        value={formatVND(overallFinance.estimatedProfitVnd)}
        helper="Nạp - công nợ - đã rút"
        tone={overallFinance.estimatedProfitVnd >= 0 ? "blue" : "rose"}
      />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: "emerald" | "rose" | "amber" | "blue";
}) {
  const toneClass = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    rose: "text-rose-600 bg-rose-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    blue: "text-blue-600 bg-blue-500/10",
  }[tone];

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="min-h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 whitespace-nowrap text-2xl font-black tracking-tight">{value}</p>
            <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{helper}</p>
          </div>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformFeeControl({
  value,
  serverValue,
  onChange,
  onSave,
  isSaving,
  canSave,
  grossDebtVnd,
  feeReserveVnd,
}: {
  value: number;
  serverValue: number;
  onChange: (value: number) => void;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
  grossDebtVnd: number;
  feeReserveVnd: number;
}) {
  const isDirty = value !== serverValue;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Phí sàn rút tiền
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Áp dụng một lần khi ước tính công nợ giáo viên.
            </CardDescription>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <Percent className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(event) => onChange(clampPercent(Number(event.target.value)))}
            className="h-9 w-20 rounded-lg text-base font-black"
          />
          <span className="text-base font-black">%</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(DEFAULT_PLATFORM_FEE_PERCENT)}
            className="ml-auto h-8 rounded-lg px-3 text-xs font-bold"
          >
            Reset 30%
          </Button>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={70}
          step={1}
          onValueChange={(next) => onChange(clampPercent(next[0] ?? value))}
        />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MiniMetric label="Nợ GV trước phí" value={formatVND(grossDebtVnd)} />
          <MiniMetric label="Phí sàn giữ lại" value={formatVND(feeReserveVnd)} />
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={!canSave || !isDirty || isSaving}
          className="h-9 w-full rounded-lg font-bold"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {isSaving ? "Đang lưu" : "Lưu phí sàn"}
        </Button>
      </CardContent>
    </Card>
  );
}

function FormulaCard({
  overallFinance,
  platformFeePercent,
  cashRevenue,
}: {
  overallFinance: OverallFinance;
  platformFeePercent: number;
  cashRevenue: CashRevenueSummary;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Công thức lợi nhuận
        </CardTitle>
        <CardDescription>
          Nạp/rút là VND từ ngân hàng. Ví, khóa học và công nợ là hoa nội bộ, chỉ quy đổi 1 hoa = 1.000đ khi tính nghĩa vụ chi trả.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-3 md:grid-cols-4">
          <FormulaStep
            label="Tổng nạp"
            value={formatVND(overallFinance.cashInVnd)}
            tone="text-emerald-600"
          />
          <FormulaStep
            label="Trừ công nợ"
            value={formatVND(overallFinance.teacherNetDebtVnd)}
            tone="text-amber-600"
          />
          <FormulaStep
            label="Trừ đã rút"
            value={formatVND(overallFinance.cashOutVnd)}
            tone="text-rose-600"
          />
          <FormulaStep
            label="Lợi nhuận"
            value={formatVND(overallFinance.estimatedProfitVnd)}
            tone={overallFinance.estimatedProfitVnd >= 0 ? "text-blue-600" : "text-rose-600"}
          />
        </div>

        <div className="rounded-lg border bg-muted/20 p-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <MiniMetric
              label="Tiền thật còn trong bank"
              value={formatVND(overallFinance.cashOnHandVnd)}
            />
            <MiniMetric
              label={`Công nợ sau phí ${formatPercent(platformFeePercent)}`}
              value={formatVND(overallFinance.teacherNetDebtVnd)}
            />
            <MiniMetric
              label="Dư hoa học viên"
              value={formatHoa(overallFinance.userPrepaidHoa)}
              helper={`Quy đổi ${formatVND(overallFinance.userPrepaidVnd)}`}
            />
          </div>
        </div>

        {(cashRevenue.ignoredInCount ?? 0) > 0 || (cashRevenue.ignoredOutCount ?? 0) > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-black">Cần đối soát giao dịch chưa hạch toán</p>
                <p className="mt-1 text-xs font-semibold">
                  Tiền vào: {formatNumber(cashRevenue.ignoredInCount ?? 0)} giao dịch ({formatVND(cashRevenue.ignoredInVnd ?? 0)}) · Tiền ra: {formatNumber(cashRevenue.ignoredOutCount ?? 0)} giao dịch ({formatVND(cashRevenue.ignoredOutVnd ?? 0)})
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function WalletInventoryCard({
  walletPosition,
}: {
  walletPosition: WalletPositionSummary;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Hoa tồn đọng
        </CardTitle>
        <CardDescription>
          Số chính là hoa đang nằm trong ví hệ thống; dòng ≈ chỉ là quy đổi VND để đối soát.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <InventoryRow
          label="Tổng hệ thống"
          balance={walletPosition.totalBalanceHoa}
          frozen={walletPosition.totalFrozenHoa}
          tone="bg-slate-950"
        />
        <InventoryRow
          label="Giáo viên"
          balance={walletPosition.instructorBalanceHoa}
          frozen={walletPosition.instructorFrozenHoa}
          tone="bg-amber-500"
        />
        <InventoryRow
          label="User / học viên"
          balance={walletPosition.userBalanceHoa}
          frozen={walletPosition.userFrozenHoa}
          tone="bg-blue-500"
        />
        <InventoryRow
          label="Admin"
          balance={walletPosition.adminBalanceHoa}
          frozen={walletPosition.adminFrozenHoa}
          tone="bg-violet-500"
        />
      </CardContent>
    </Card>
  );
}

function FinancialChartCard({
  rows,
  chartTotals,
  platformFeePercent,
  mode,
}: {
  rows: FinancialChartRow[];
  chartTotals: OverallFinance & { grossTradingVnd: number };
  platformFeePercent: number;
  mode: TimeRangeMode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Doanh thu & lợi nhuận {timeRangeLabel(mode).toLowerCase()}
          </CardTitle>
          <CardDescription>
            Biểu đồ dùng cùng công thức: nạp - đã rút - công nợ sau phí sàn {formatPercent(platformFeePercent)}.
          </CardDescription>
        </div>
        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">
          <ChartMetricPill label="Nạp" value={formatVND(chartTotals.cashInVnd)} tone="emerald" />
          <ChartMetricPill label="Rút" value={formatVND(chartTotals.cashOutVnd)} tone="rose" />
          <ChartMetricPill label="Nợ GV" value={formatVND(chartTotals.teacherNetDebtVnd)} tone="amber" />
          <ChartMetricPill label="Profit" value={formatVND(chartTotals.estimatedProfitVnd)} tone="blue" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[350px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis
                dataKey="label"
                axisLine
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => compactMoney(Number(value))}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
              />
              <Tooltip content={<FinancialTooltip />} />
              <Area
                type="monotone"
                dataKey="revenueVnd"
                name="Doanh thu nạp"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#3b82f6" }}
                fill="url(#adminRevenueGradient)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="estimatedProfitVnd"
                name="Lợi nhuận"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                fill="url(#adminProfitGradient)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="withdrawnVnd"
                name="Đã rút GV"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "#f43f5e" }}
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="teacherDebtVnd"
                name="Công nợ sau phí"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "#f59e0b" }}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pb-2">
          <ChartLegendItem label="Doanh thu nạp" color="border-blue-500" />
          <ChartLegendItem label="Lợi nhuận" color="border-emerald-500" />
          <ChartLegendItem label="Đã rút GV" color="border-rose-500" dashed />
          <ChartLegendItem label="Công nợ sau phí" color="border-amber-500" dashed />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartMetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "amber" | "blue";
}) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className={`min-w-[132px] rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 whitespace-nowrap text-sm font-black">{value}</p>
    </div>
  );
}

function ChartLegendItem({
  label,
  color,
  dashed,
}: {
  label: string;
  color: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-0 w-6 border-t-2 ${color} ${dashed ? "border-dashed" : "border-solid"}`} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function OperationsPanel({
  paymentStats,
  withdrawalStats,
  cashRevenue,
  liabilityEstimate,
  overallFinance,
}: {
  paymentStats: PaymentStatusStats;
  withdrawalStats: WithdrawalStatusStats;
  cashRevenue: CashRevenueSummary;
  liabilityEstimate: LiabilityEstimateSummary;
  overallFinance: OverallFinance;
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Trạng thái tiền thật
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <StatusProgress
            label="Nạp tiền đã ghi nhận"
            value={cashRevenue.topupSuccessCount ?? paymentStats.successCount}
            total={Math.max(paymentStats.totalCount, cashRevenue.topupSuccessCount ?? 0)}
            color="bg-emerald-500"
            helper={formatVND(cashRevenue.grossTopupVnd)}
          />
          <StatusProgress
            label="Chi tiền giáo viên đã chuyển"
            value={cashRevenue.payoutSuccessCount ?? withdrawalStats.completedCount}
            total={Math.max(withdrawalStats.totalCount, cashRevenue.payoutSuccessCount ?? 0)}
            color="bg-rose-500"
            helper={formatVND(cashRevenue.bankOutVnd)}
          />
          <StatusProgress
            label="Lệnh rút đang xử lý"
            value={withdrawalStats.pendingCount + withdrawalStats.processingCount}
            total={Math.max(withdrawalStats.totalCount, withdrawalStats.pendingCount + withdrawalStats.processingCount)}
            color="bg-amber-500"
            helper={formatVND(overallFinance.pendingWithdrawVnd + overallFinance.processingWithdrawVnd)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Nghĩa vụ hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-6">
          <CompactLine
            icon={<Wallet className="h-4 w-4" />}
            label="Hoa GV có thể rút"
            value={formatHoa(liabilityEstimate.teacherWithdrawableHoa)}
            helper={formatVND(hoaToVnd(liabilityEstimate.teacherWithdrawableHoa))}
          />
          <CompactLine
            icon={<Clock3 className="h-4 w-4" />}
            label="Hoa GV đang giữ"
            value={formatHoa(liabilityEstimate.teacherFrozenHoa)}
            helper="Đang bị giữ bởi nghiệp vụ rút hoặc xử lý liên quan"
          />
          <CompactLine
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Dư hoa học viên"
            value={formatHoa(liabilityEstimate.userPrepaidHoa)}
            helper="Nợ dịch vụ, không phải tiền mặt trả ngay"
          />
          <CompactLine
            icon={<Banknote className="h-4 w-4" />}
            label="Hoa admin"
            value={formatHoa(liabilityEstimate.adminInternalHoa)}
            helper={formatVND(liabilityEstimate.adminInternalVndEquivalent)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DateRangePicker({
  value,
  onChange,
  onClear,
}: {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  onClear: () => void;
}) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const fromDate = value?.from;
  const toDate = value?.to;
  const hasValue = Boolean(fromDate || toDate);

  const commitRange = (nextFrom?: Date, nextTo?: Date) => {
    if (!nextFrom && !nextTo) {
      onChange(undefined);
      return;
    }

    if (nextFrom && nextTo && startOfDay(nextFrom).getTime() > startOfDay(nextTo).getTime()) {
      onChange({ from: nextTo, to: nextFrom });
      return;
    }

    onChange({ from: nextFrom, to: nextTo });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-start rounded-lg border-0 bg-muted/40 text-left font-semibold shadow-none sm:w-[142px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
            <span className="truncate">
              {fromDate ? formatShortDate(fromDate) : "Từ ngày"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={(date) => {
              commitRange(date, toDate);
              setFromOpen(false);
            }}
            defaultMonth={fromDate ?? toDate ?? new Date()}
            locale={vi}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-start rounded-lg border-0 bg-muted/40 text-left font-semibold shadow-none sm:w-[142px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
            <span className="truncate">
              {toDate ? formatShortDate(toDate) : "Đến ngày"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={(date) => {
              commitRange(fromDate, date);
              setToOpen(false);
            }}
            defaultMonth={toDate ?? fromDate ?? new Date()}
            locale={vi}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onClear();
            setFromOpen(false);
            setToOpen(false);
          }}
          className="h-9 rounded-lg px-3 text-xs text-muted-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Xóa
        </Button>
      ) : null}
    </div>
  );
}

function FormulaStep({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function InventoryRow({
  label,
  balance,
  frozen,
  tone,
}: {
  label: string;
  balance: number;
  frozen: number;
  tone: string;
}) {
  const available = balance - frozen;
  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${tone}`} />
        <div>
          <p className="text-sm font-black">{label}</p>
          <p className="text-xs text-muted-foreground">
            Khả dụng {formatHoa(available)} · Đang giữ {formatHoa(frozen)}
          </p>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-lg font-black">{formatHoa(balance)}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          ≈ {formatVND(hoaToVnd(balance))}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border bg-background/80 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

function StatusProgress({
  label,
  value,
  total,
  color,
  helper,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  helper: string;
}) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className="text-sm font-black">{formatNumber(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CompactLine({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <p className="shrink-0 text-sm font-black">{value}</p>
    </div>
  );
}

function BankTransferRow({ record }: { record: BankTransferRecord }) {
  const isIn = record.type === "in";
  const source = record.source ?? "XGate";
  const bank = bankBrand(record.receiverBankName || record.currency || "");
  const matchedUserName = record.matchedUserName || record.matchedUserEmail || "Chưa khớp";
  return (
    <tr className="hover:bg-muted/20">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg border bg-white p-1">
            <AvatarImage
              src={bank.logoUrl}
              alt={bank.name}
              className="object-contain"
            />
            <AvatarFallback className="rounded-lg text-[10px] font-black">
              {bank.code}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{bank.shortName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {record.receiverAccount || "-"}
            </p>
          </div>
        </div>
      </td>
      <td className="max-w-[330px] px-6 py-4">
        <div className="flex items-center gap-2">
          <Badge variant={isIn ? "default" : "secondary"} className="rounded-md px-2 py-0.5">
            {isIn ? "Tiền vào" : "Tiền ra"}
          </Badge>
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
          {record.content || "Không có nội dung"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {record.matchedOrderId || "Chưa khớp lệnh"} · {xgateSourceLabel(source)}
        </p>
      </td>
      <td className={`px-6 py-4 text-right font-black ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
        {formatVND(record.amountVnd ?? 0)}
      </td>
      <td className="px-6 py-4">
        <ResultBadge result={record.processingResult} />
      </td>
      <td className="px-6 py-4">
        {record.matchedUserName || record.matchedUserEmail ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={record.matchedUserAvatarUrl || ""} alt={matchedUserName} />
              <AvatarFallback className="rounded-lg text-xs font-black">
                {userInitials(matchedUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{matchedUserName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {record.matchedUserEmail || `#${record.matchedUserId ?? record.id}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs font-black">?</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold">Chưa khớp</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground">
        {formatRecordDate(record.transactionDate ?? record.createdAt)}
      </td>
    </tr>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: AdminRevenueRecentTransaction;
}) {
  const amount = transaction.amount ?? 0;
  const userName = transaction.userName || transaction.userEmail || "Không rõ người dùng";
  return (
    <tr className="hover:bg-muted/20">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-lg">
            <AvatarImage src={transaction.userAvatarUrl || ""} alt={userName} />
            <AvatarFallback className="rounded-lg text-xs font-black">
              {userInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {transaction.userEmail || `#${transaction.userId ?? transaction.id}`}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <LedgerTypeBadge type={transaction.type} />
      </td>
      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
        {transaction.referenceId || "-"}
      </td>
      <td className={`px-6 py-4 text-right font-black ${amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        {amount >= 0 ? "+" : ""}
        {formatHoa(amount)}
      </td>
      <td className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground">
        {formatRecordDate(transaction.createdAt)}
      </td>
    </tr>
  );
}

function ResultBadge({ result }: { result?: string }) {
  const value = result || "UNKNOWN";
  const className = isRecordedXGateResult(value)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : value === "IGNORED"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <Badge
      variant="outline"
      className={`rounded-md font-black ${className}`}
    >
      {xgateResultLabel(result)}
    </Badge>
  );
}

function LedgerTypeBadge({ type }: { type?: string }) {
  const value = type || "UNKNOWN";
  const className = value.startsWith("TOPUP")
    ? "bg-emerald-500/10 text-emerald-700"
    : value.startsWith("WITHDRAW")
      ? "bg-rose-500/10 text-rose-700"
      : value.startsWith("BOOKING")
        ? "bg-amber-500/10 text-amber-700"
        : value.startsWith("COURSE")
          ? "bg-blue-500/10 text-blue-700"
          : "bg-slate-500/10 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[11px] font-black tracking-wide ${className}`}
    >
      {ledgerTypeLabel(type)}
    </span>
  );
}

function isRecordedXGateResult(result?: string) {
  return result === "TOPUP_SUCCESS" || result === "PAYOUT_SUCCESS";
}

function xgateResultLabel(result?: string) {
  switch (result) {
    case "TOPUP_SUCCESS":
      return "Nạp tiền đã ghi nhận";
    case "PAYOUT_SUCCESS":
      return "Chi tiền đã chuyển";
    case "IGNORED":
      return "Cần đối soát";
    case undefined:
    case "":
    case "UNKNOWN":
      return "Chưa xác định";
    default:
      return result.includes("SUCCESS") ? "Đã ghi nhận" : "Trạng thái khác";
  }
}

function xgateSourceLabel(source?: string) {
  switch (source?.toUpperCase()) {
    case "POLLING":
      return "Đồng bộ tự động";
    case "WEBHOOK":
      return "Webhook ngân hàng";
    case "MANUAL":
      return "Nhập tay";
    case "XGATE":
      return "XGate";
    case undefined:
    case "":
      return "XGate";
    default:
      return "Nguồn ngân hàng khác";
  }
}

const BANK_BRANDS = [
  {
    code: "MB",
    shortName: "MBBank",
    name: "Ngân hàng TMCP Quân đội",
    logoUrl: "https://api.vietqr.io/img/MB.png",
    aliases: ["MB", "MBBANK", "MBB"],
  },
  {
    code: "VCB",
    shortName: "Vietcombank",
    name: "Ngân hàng TMCP Ngoại thương Việt Nam",
    logoUrl: "https://api.vietqr.io/img/VCB.png",
    aliases: ["VCB", "VIETCOMBANK", "VIETCOMM", "VIETCOM"],
  },
  {
    code: "TCB",
    shortName: "Techcombank",
    name: "Ngân hàng TMCP Kỹ thương Việt Nam",
    logoUrl: "https://api.vietqr.io/img/TCB.png",
    aliases: ["TCB", "TECHCOMBANK"],
  },
  {
    code: "BIDV",
    shortName: "BIDV",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    logoUrl: "https://api.vietqr.io/img/BIDV.png",
    aliases: ["BIDV"],
  },
  {
    code: "ICB",
    shortName: "VietinBank",
    name: "Ngân hàng TMCP Công thương Việt Nam",
    logoUrl: "https://api.vietqr.io/img/ICB.png",
    aliases: ["ICB", "VIETINBANK", "VIETIN"],
  },
  {
    code: "VPB",
    shortName: "VPBank",
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    logoUrl: "https://api.vietqr.io/img/VPB.png",
    aliases: ["VPB", "VPBANK"],
  },
  {
    code: "ACB",
    shortName: "ACB",
    name: "Ngân hàng TMCP Á Châu",
    logoUrl: "https://api.vietqr.io/img/ACB.png",
    aliases: ["ACB"],
  },
  {
    code: "TPB",
    shortName: "TPBank",
    name: "Ngân hàng TMCP Tiên Phong",
    logoUrl: "https://api.vietqr.io/img/TPB.png",
    aliases: ["TPB", "TPBANK"],
  },
  {
    code: "STB",
    shortName: "Sacombank",
    name: "Ngân hàng TMCP Sài Gòn Thương Tín",
    logoUrl: "https://api.vietqr.io/img/STB.png",
    aliases: ["STB", "SACOMBANK"],
  },
  {
    code: "VIB",
    shortName: "VIB",
    name: "Ngân hàng TMCP Quốc tế Việt Nam",
    logoUrl: "https://api.vietqr.io/img/VIB.png",
    aliases: ["VIB"],
  },
] as const;

function bankBrand(value?: string) {
  const normalized = normalizeBankText(value);
  const brand = BANK_BRANDS.find((item) =>
    item.aliases.some((alias) => normalized.includes(alias)),
  );

  return (
    brand ?? {
      code: "BANK",
      shortName: value || "Ngân hàng",
      name: value || "Ngân hàng",
      logoUrl: "",
      aliases: [],
    }
  );
}

function normalizeBankText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

function ledgerTypeLabel(type?: string) {
  switch (type) {
    case "TOPUP":
      return "Nạp hoa";
    case "WITHDRAW":
    case "WITHDRAW_PAYOUT":
      return "Rút tiền giáo viên";
    case "WITHDRAW_HOLD":
      return "Phong tỏa chờ rút";
    case "WITHDRAW_REFUND":
      return "Hoàn phong tỏa rút";
    case "WITHDRAWAL_FEE":
      return "Phí rút tiền";
    case "COURSE_PAYMENT":
      return "Thanh toán khóa học";
    case "COURSE_INCOME":
      return "Doanh thu giáo viên từ khóa học";
    case "COURSE_PLATFORM_FEE":
      return "Phí sàn khóa học";
    case "COURSE_ADMIN_PROFIT":
      return "Doanh thu khóa học admin";
    case "BOOKING_HOLD":
      return "Tạm giữ tiền booking";
    case "BOOKING_CAPTURE":
      return "Ghi nhận tiền booking";
    case "BOOKING_INCOME":
    case "BOOKING_PAYMENT":
      return "Doanh thu giáo viên từ booking";
    case "BOOKING_RELEASE":
      return "Giải tỏa tiền booking";
    case "BOOKING_CANCEL_REFUND":
      return "Hoàn tiền hủy booking";
    case "BOOKING_CANCEL_PENALTY":
      return "Phí phạt hủy booking";
    case "SUBSCRIPTION":
    case "SUBSCRIPTION_RENEW":
      return "Gói thành viên";
    case "PACKAGE_PURCHASE":
      return "Mua gói hệ thống";
    case "FLASHCARD_IMAGE_PACK":
      return "Gói ảnh flashcard";
    case "PLATFORM_FEE":
      return "Phí sàn booking";
    case undefined:
    case "":
      return "Chưa phân loại";
    default:
      if (type.startsWith("TOPUP")) return "Nạp hoa";
      if (type.startsWith("WITHDRAW")) return "Rút tiền giáo viên";
      if (type.startsWith("COURSE")) return "Nghiệp vụ khóa học";
      if (type.startsWith("BOOKING")) return "Nghiệp vụ booking";
      if (type.startsWith("SUBSCRIPTION")) return "Gói thành viên";
      return "Nghiệp vụ khác";
  }
}

function userInitials(value?: string) {
  const parts = (value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function AnalyticsLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-[420px] rounded-lg bg-muted" />
    </div>
  );
}

function AnalyticsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-200">
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-black">Không tải được dashboard tài chính</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm tra backend hoặc quyền admin rồi thử cập nhật lại.
          </p>
        </div>
        <Button onClick={onRetry} className="rounded-lg font-semibold">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}

function FinancialTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 text-xs shadow-lg">
      <p className="mb-2 font-black">{label}</p>
      {payload.map((item) => (
        <div key={String(item.dataKey)} className="flex min-w-[210px] items-center justify-between gap-4 py-1">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-black">{formatVND(Number(item.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

function PaymentTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 text-xs shadow-lg">
      <p className="mb-2 font-black">{label}</p>
      {payload.map((item) => (
        <div key={String(item.dataKey)} className="flex min-w-[180px] items-center justify-between gap-4 py-1">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-black">{formatNumber(Number(item.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

function buildOverallFinance({
  cashRevenue,
  liabilityEstimate,
  platformFeePercent,
}: {
  cashRevenue: CashRevenueSummary;
  liabilityEstimate: LiabilityEstimateSummary;
  platformFeePercent: number;
}): OverallFinance {
  const teacherOwnedHoa = liabilityEstimate.teacherOwnedHoa ?? 0;
  const userPrepaidHoa = liabilityEstimate.userPrepaidHoa ?? 0;
  const adminInternalHoa = liabilityEstimate.adminInternalHoa ?? 0;
  const teacherGrossDebtVnd = hoaToVnd(teacherOwnedHoa);
  const teacherNetDebtVnd = applyPlatformFee(teacherGrossDebtVnd, platformFeePercent);
  const platformFeeReserveVnd = teacherGrossDebtVnd - teacherNetDebtVnd;
  const cashInVnd = cashRevenue.grossTopupVnd ?? 0;
  const cashOutVnd = cashRevenue.bankOutVnd ?? 0;
  return {
    cashInVnd,
    cashOutVnd,
    cashOnHandVnd: cashInVnd - cashOutVnd,
    teacherOwnedHoa,
    teacherGrossDebtVnd,
    teacherNetDebtVnd,
    platformFeeReserveVnd,
    estimatedProfitVnd: cashInVnd - teacherNetDebtVnd - cashOutVnd,
    userPrepaidHoa,
    userPrepaidVnd: liabilityEstimate.userPrepaidVndEquivalent ?? 0,
    adminInternalHoa,
    adminHoaVnd: liabilityEstimate.adminInternalVndEquivalent ?? 0,
    pendingWithdrawVnd: liabilityEstimate.pendingWithdrawalVnd ?? 0,
    processingWithdrawVnd: liabilityEstimate.processingWithdrawalVnd ?? 0,
  };
}

function buildFinancialChartData({
  mode,
  selectedYear,
  dateBounds,
  platformFeePercent,
  daily,
  monthly,
  weekly,
  yearly,
}: {
  mode: TimeRangeMode;
  selectedYear: number;
  dateBounds?: DateBounds;
  platformFeePercent: number;
  daily: PeriodSourceRow[];
  monthly: MonthlyFinancialSummary[];
  weekly: FinancialPeriodSummary[];
  yearly: FinancialPeriodSummary[];
}): FinancialChartRow[] {
  let rows: PeriodSourceRow[] = [];

  if (mode === "day") {
    rows = daily
      .filter((item) => item.start?.getFullYear() === selectedYear)
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  if (mode === "week") {
    rows = weekly
      .filter((item) => item.year === selectedYear)
      .map(periodToSourceRow)
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  if (mode === "month") {
    const byMonth = new Map(monthly.map((item) => [`${item.year}-${item.month}`, item]));
    rows = MONTHS.map((month) => {
      const item = byMonth.get(`${selectedYear}-${month}`);
      const start = new Date(selectedYear, month - 1, 1);
      return {
        label: `T${month}`,
        sortKey: selectedYear * 100 + month,
        start,
        end: endOfDay(new Date(selectedYear, month, 0)),
        bankInVnd: item?.bankInVnd ?? 0,
        bankOutVnd: item?.bankOutVnd ?? 0,
        teacherGrossIncomeHoa: item?.teacherGrossIncomeHoa ?? 0,
        bookingGrossHoa: item?.bookingGrossHoa ?? 0,
        courseGrossHoa: item?.courseGrossHoa ?? 0,
      };
    });
  }

  if (mode === "year") {
    rows = yearly.map(periodToSourceRow).sort((a, b) => a.sortKey - b.sortKey);
  }

  return rows
    .filter((item) => periodOverlapsDateBounds(item, dateBounds))
    .map((item) => {
      const teacherDebtVnd = applyPlatformFee(
        hoaToVnd(item.teacherGrossIncomeHoa),
        platformFeePercent,
      );
      const bookingVnd = hoaToVnd(item.bookingGrossHoa);
      const courseVnd = hoaToVnd(item.courseGrossHoa);
      return {
        label: item.label,
        sortKey: item.sortKey,
        start: item.start,
        end: item.end,
        revenueVnd: item.bankInVnd,
        withdrawnVnd: item.bankOutVnd,
        teacherDebtVnd,
        estimatedProfitVnd: item.bankInVnd - item.bankOutVnd - teacherDebtVnd,
        grossTradingVnd: bookingVnd + courseVnd,
        bookingVnd,
        courseVnd,
      };
    });
}

function buildDailyFinancialSummaries(
  bankTransferRecords: BankTransferRecord[],
  recentTransactions: AdminRevenueRecentTransaction[],
): PeriodSourceRow[] {
  const rows = new Map<string, PeriodSourceRow>();

  const getRow = (date: Date): PeriodSourceRow => {
    const key = formatDateKey(date);
    const current = rows.get(key);
    if (current) return current;
    const row: PeriodSourceRow = {
      label: format(date, "dd/MM", { locale: vi }),
      sortKey: Number(format(date, "yyyyMMdd")),
      start: startOfDay(date),
      end: endOfDay(date),
      bankInVnd: 0,
      bankOutVnd: 0,
      teacherGrossIncomeHoa: 0,
      bookingGrossHoa: 0,
      courseGrossHoa: 0,
    };
    rows.set(key, row);
    return row;
  };

  bankTransferRecords.forEach((record) => {
    const date = parseRecordDate(record.transactionDate ?? record.createdAt);
    if (!date) return;
    const row = getRow(date);
    if (record.type === "in" && record.processingResult === "TOPUP_SUCCESS") {
      row.bankInVnd += record.amountVnd ?? 0;
    }
    if (record.type === "out" && record.processingResult === "PAYOUT_SUCCESS") {
      row.bankOutVnd += record.amountVnd ?? 0;
    }
  });

  const courseSplitReferences = new Set(
    recentTransactions
      .filter((item) =>
        ["COURSE_INCOME", "COURSE_PLATFORM_FEE", "COURSE_ADMIN_PROFIT"].includes(item.type),
      )
      .map((item) => item.referenceId)
      .filter(Boolean),
  );

  recentTransactions.forEach((transaction) => {
    const date = parseRecordDate(transaction.createdAt);
    if (!date) return;
    const row = getRow(date);
    const effect = transactionLedgerEffect(transaction, courseSplitReferences);
    row.teacherGrossIncomeHoa += effect.teacherGrossIncomeHoa;
    row.bookingGrossHoa += effect.bookingGrossHoa;
    row.courseGrossHoa += effect.courseGrossHoa;
  });

  return Array.from(rows.values()).sort((a, b) => a.sortKey - b.sortKey);
}

function transactionLedgerEffect(
  transaction: AdminRevenueRecentTransaction,
  courseSplitReferences: Set<string | undefined>,
) {
  const type = transaction.type;
  const amount = transaction.amount ?? 0;
  const positiveAmount = Math.max(amount, 0);
  const spentAmount = amount < 0 ? -amount : 0;
  const effect = {
    teacherGrossIncomeHoa: 0,
    bookingGrossHoa: 0,
    courseGrossHoa: 0,
  };

  if (type === "PLATFORM_FEE") {
    effect.bookingGrossHoa = positiveAmount;
  }
  if (type === "BOOKING_INCOME" || type === "BOOKING_PAYMENT") {
    effect.bookingGrossHoa = positiveAmount;
    effect.teacherGrossIncomeHoa = positiveAmount;
  }
  if (type === "BOOKING_CANCEL_PENALTY") {
    effect.bookingGrossHoa = spentAmount;
  }
  if (type === "COURSE_INCOME") {
    effect.courseGrossHoa = positiveAmount;
    effect.teacherGrossIncomeHoa = positiveAmount;
  }
  if (type === "COURSE_PLATFORM_FEE" || type === "COURSE_ADMIN_PROFIT") {
    effect.courseGrossHoa = positiveAmount;
  }
  if (type === "COURSE_PAYMENT" && amount < 0 && !courseSplitReferences.has(transaction.referenceId)) {
    effect.courseGrossHoa = spentAmount;
  }

  return effect;
}

function buildPaymentChartData({
  mode,
  selectedYear,
  dateBounds,
  daily,
  monthly,
  weekly,
  yearly,
}: {
  mode: TimeRangeMode;
  selectedYear: number;
  dateBounds?: DateBounds;
  daily: Array<{
    label: string;
    sortKey: number;
    start?: Date;
    end?: Date;
    success: number;
    pending: number;
    failed: number;
    cancelled: number;
  }>;
  monthly: MonthlyPaymentStatus[];
  weekly: PaymentPeriodStatus[];
  yearly: PaymentPeriodStatus[];
}) {
  if (mode === "day") {
    return daily
      .filter((item) => item.start?.getFullYear() === selectedYear)
      .filter((item) => periodOverlapsDateBounds(item, dateBounds))
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  if (mode === "week") {
    return weekly
      .filter((item) => item.year === selectedYear)
      .map(paymentPeriodToRow)
      .filter((item) => periodOverlapsDateBounds(item, dateBounds))
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  if (mode === "year") {
    return yearly
      .map(paymentPeriodToRow)
      .filter((item) => periodOverlapsDateBounds(item, dateBounds))
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  const byMonth = new Map(monthly.map((item) => [`${item.year}-${item.month}`, item]));
  return MONTHS.map((month) => {
    const item = byMonth.get(`${selectedYear}-${month}`);
    return {
      label: `T${month}`,
      sortKey: selectedYear * 100 + month,
      start: new Date(selectedYear, month - 1, 1),
      end: endOfDay(new Date(selectedYear, month, 0)),
      success: item?.successCount ?? 0,
      pending: item?.pendingCount ?? 0,
      failed: item?.failedCount ?? 0,
      cancelled: item?.cancelledCount ?? 0,
    };
  }).filter((item) => periodOverlapsDateBounds(item, dateBounds));
}

function buildDailyPaymentStatuses(bankTransferRecords: BankTransferRecord[]) {
  const rows = new Map<string, {
    label: string;
    sortKey: number;
    start?: Date;
    end?: Date;
    success: number;
    pending: number;
    failed: number;
    cancelled: number;
  }>();

  const getRow = (date: Date) => {
    const key = formatDateKey(date);
    const current = rows.get(key);
    if (current) return current;
    const row = {
      label: format(date, "dd/MM", { locale: vi }),
      sortKey: Number(format(date, "yyyyMMdd")),
      start: startOfDay(date),
      end: endOfDay(date),
      success: 0,
      pending: 0,
      failed: 0,
      cancelled: 0,
    };
    rows.set(key, row);
    return row;
  };

  bankTransferRecords.forEach((record) => {
    const date = parseRecordDate(record.transactionDate ?? record.createdAt);
    if (!date || record.type !== "in") return;
    const row = getRow(date);
    if (record.processingResult === "TOPUP_SUCCESS") row.success += 1;
    else if (record.processingResult === "IGNORED") row.failed += 1;
    else row.pending += 1;
  });

  return Array.from(rows.values()).sort((a, b) => a.sortKey - b.sortKey);
}

function periodToSourceRow(item: FinancialPeriodSummary): PeriodSourceRow {
  const start = parseDateOnly(item.startDate);
  const end = parseDateOnly(item.endDate);
  return {
    label: item.label || item.periodKey,
    sortKey: Number((item.periodKey || "0").replace(/\D/g, "")) || 0,
    start,
    end: end ? endOfDay(end) : undefined,
    bankInVnd: item.bankInVnd ?? 0,
    bankOutVnd: item.bankOutVnd ?? 0,
    teacherGrossIncomeHoa: item.teacherGrossIncomeHoa ?? 0,
    bookingGrossHoa: item.bookingGrossHoa ?? 0,
    courseGrossHoa: item.courseGrossHoa ?? 0,
  };
}

function paymentPeriodToRow(item: PaymentPeriodStatus) {
  const start = parseDateOnly(item.startDate);
  const end = parseDateOnly(item.endDate);
  return {
    label: item.label || item.periodKey,
    sortKey: Number((item.periodKey || "0").replace(/\D/g, "")) || 0,
    start,
    end: end ? endOfDay(end) : undefined,
    success: item.successCount ?? 0,
    pending: item.pendingCount ?? 0,
    failed: item.failedCount ?? 0,
    cancelled: item.cancelledCount ?? 0,
  };
}

function summarizeFinancialRows(rows: FinancialChartRow[]): OverallFinance & { grossTradingVnd: number } {
  return rows.reduce(
    (sum, row) => ({
      cashInVnd: sum.cashInVnd + row.revenueVnd,
      cashOutVnd: sum.cashOutVnd + row.withdrawnVnd,
      cashOnHandVnd: sum.cashOnHandVnd + row.revenueVnd - row.withdrawnVnd,
      teacherOwnedHoa: sum.teacherOwnedHoa,
      teacherGrossDebtVnd: sum.teacherGrossDebtVnd + row.teacherDebtVnd,
      teacherNetDebtVnd: sum.teacherNetDebtVnd + row.teacherDebtVnd,
      platformFeeReserveVnd: sum.platformFeeReserveVnd,
      estimatedProfitVnd: sum.estimatedProfitVnd + row.estimatedProfitVnd,
      userPrepaidHoa: 0,
      userPrepaidVnd: 0,
      adminInternalHoa: 0,
      adminHoaVnd: 0,
      pendingWithdrawVnd: 0,
      processingWithdrawVnd: 0,
      grossTradingVnd: sum.grossTradingVnd + row.grossTradingVnd,
    }),
    {
      cashInVnd: 0,
      cashOutVnd: 0,
      cashOnHandVnd: 0,
      teacherOwnedHoa: 0,
      teacherGrossDebtVnd: 0,
      teacherNetDebtVnd: 0,
      platformFeeReserveVnd: 0,
      estimatedProfitVnd: 0,
      userPrepaidHoa: 0,
      userPrepaidVnd: 0,
      adminInternalHoa: 0,
      adminHoaVnd: 0,
      pendingWithdrawVnd: 0,
      processingWithdrawVnd: 0,
      grossTradingVnd: 0,
    },
  );
}

function filterBankTransferRecordsByDate(
  records: BankTransferRecord[],
  bounds?: DateBounds,
) {
  if (!bounds) return records;
  return records.filter((record) => {
    const date = parseRecordDate(record.transactionDate ?? record.createdAt);
    return date ? date >= bounds.from && date <= bounds.to : false;
  });
}

function filterTransactionsByDate(
  transactions: AdminRevenueRecentTransaction[],
  bounds?: DateBounds,
) {
  if (!bounds) return transactions;
  return transactions.filter((transaction) => {
    const date = parseRecordDate(transaction.createdAt);
    return date ? date >= bounds.from && date <= bounds.to : false;
  });
}

function filterXGateRecords(
  records: BankTransferRecord[],
  filter: XGateRecordFilter,
) {
  if (filter === "ignored") {
    return records.filter((record) => record.processingResult === "IGNORED");
  }
  if (filter === "success") {
    return records.filter((record) => record.processingResult?.includes("SUCCESS"));
  }
  return records;
}

function filterTransactionsByType(
  transactions: AdminRevenueRecentTransaction[],
  filter: TransactionTypeFilter,
) {
  if (filter === "ALL") return transactions;
  if (filter === "OTHER") {
    return transactions.filter((transaction) => {
      const type = transaction.type || "";
      return !["TOPUP", "WITHDRAW", "COURSE", "BOOKING", "SUBSCRIPTION", "PACKAGE"].some((prefix) =>
        type.startsWith(prefix),
      );
    });
  }
  if (filter === "PACKAGE") {
    return transactions.filter((transaction) => transaction.type === "PACKAGE_PURCHASE");
  }
  return transactions.filter((transaction) => transaction.type?.startsWith(filter));
}

function periodOverlapsDateBounds(
  item: { start?: Date; end?: Date },
  bounds?: DateBounds,
) {
  if (!bounds || !item.start) return true;
  const end = item.end ?? item.start;
  return item.start <= bounds.to && end >= bounds.from;
}

function exportAdminAnalyticsCsv({
  stats,
  platformFeePercent,
  overallFinance,
  financialChartData,
}: {
  stats: AdminRevenueStatsResponse;
  platformFeePercent: number;
  overallFinance: OverallFinance;
  financialChartData: FinancialChartRow[];
}) {
  const rows: string[][] = [
    ["FUJI Admin Analytics"],
    ["platform_fee_percent", String(platformFeePercent)],
    ["cash_in_vnd", String(overallFinance.cashInVnd)],
    ["cash_out_vnd", String(overallFinance.cashOutVnd)],
    ["teacher_gross_debt_vnd", String(overallFinance.teacherGrossDebtVnd)],
    ["teacher_net_debt_vnd", String(overallFinance.teacherNetDebtVnd)],
    ["estimated_profit_vnd", String(overallFinance.estimatedProfitVnd)],
    ["user_prepaid_hoa", String(overallFinance.userPrepaidHoa)],
    ["user_prepaid_vnd", String(overallFinance.userPrepaidVnd)],
    ["admin_internal_hoa", String(overallFinance.adminInternalHoa)],
    ["admin_internal_vnd", String(overallFinance.adminHoaVnd)],
    [],
    ["period", "revenue_vnd", "withdrawn_vnd", "teacher_debt_vnd", "estimated_profit_vnd", "gross_trading_vnd"],
    ...financialChartData.map((item) => [
      item.label,
      String(item.revenueVnd),
      String(item.withdrawnVnd),
      String(item.teacherDebtVnd),
      String(item.estimatedProfitVnd),
      String(item.grossTradingVnd),
    ]),
    [],
    ["xgate_recent_count", String(stats.bankTransferRecords?.length ?? 0)],
    ["ledger_recent_count", String(stats.recentTransactions?.length ?? 0)],
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fuji-admin-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function normalizeDateBounds(value?: DateRange): DateBounds | undefined {
  if (!value?.from && !value?.to) return undefined;
  const from = startOfDay(value.from ?? value.to ?? new Date());
  const to = endOfDay(value.to ?? value.from ?? new Date());
  return from <= to ? { from, to } : { from: startOfDay(to), to: endOfDay(from) };
}

function parseRecordDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseDateOnly(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function formatShortDate(date: Date) {
  return format(date, "dd/MM/yyyy", { locale: vi });
}

function formatRecordDate(value?: string | null) {
  const parsed = parseRecordDate(value);
  return parsed ? format(parsed, "dd/MM/yyyy HH:mm", { locale: vi }) : "-";
}

function hoaToVnd(hoa?: number | null) {
  return Math.round((hoa ?? 0) * HOA_TO_VND);
}

function applyPlatformFee(vndAmount: number, platformFeePercent: number) {
  return Math.round(vndAmount * (100 - clampPercent(platformFeePercent)) / 100);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_PLATFORM_FEE_PERCENT;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function bpsToPercent(bps: number) {
  return clampPercent(bps / 100);
}

function percentToBps(percent: number) {
  return clampPercent(percent) * 100;
}

function formatVND(value?: number | null) {
  return `${formatNumber(value ?? 0)} đ`;
}

function formatHoa(value?: number | null) {
  return `${formatNumber(value ?? 0)} hoa`;
}

function formatNumber(value: number) {
  return compactNumber(value);
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function compactMoney(value: number) {
  return compactNumber(value);
}

function compactNumber(value: number) {
  if (!Number.isFinite(value)) return "0";

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 999_500_000) return `${sign}${trimCompactDecimal(abs / 1_000_000_000)}B`;
  if (abs >= 999_500) return `${sign}${trimCompactDecimal(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${trimCompactDecimal(abs / 1_000)}k`;
  return new Intl.NumberFormat("vi-VN").format(Math.round(abs) * (value < 0 ? -1 : 1));
}

function trimCompactDecimal(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function timeRangeLabel(mode: TimeRangeMode) {
  switch (mode) {
    case "day":
      return "Theo ngày";
    case "week":
      return "Theo tuần";
    case "year":
      return "Theo năm";
    case "month":
    default:
      return "Theo tháng";
  }
}
