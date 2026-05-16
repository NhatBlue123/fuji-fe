"use client";

import { type FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Landmark,
  Loader2,
  Send,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateWithdrawRequestMutation,
  useGetMyWithdrawRequestsQuery,
  useGetWithdrawPolicyQuery,
  type WithdrawRequestData,
} from "@/store/services/withdrawApi";
import { useGetWalletQuery } from "@/store/services/walletApi";
import { VND_PER_FLOWER } from "@/lib/topup";

const MIN_WITHDRAW_HOA = 50;
const DEFAULT_WITHDRAW_PLATFORM_FEE_BPS = 3000;
const numberFormatter = new Intl.NumberFormat("vi-VN");
const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type WithdrawFormState = {
  amount: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

const initialFormState: WithdrawFormState = {
  amount: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
};

const BANK_OPTIONS = [
  {
    value: "MBBank",
    label: "MBBank",
    name: "Ngân hàng TMCP Quân đội",
    logoUrl: "https://api.vietqr.io/img/MB.png",
  },
  {
    value: "VietinBank",
    label: "VietinBank",
    name: "Ngân hàng TMCP Công thương Việt Nam",
    logoUrl: "https://api.vietqr.io/img/ICB.png",
  },
  {
    value: "Vietcombank",
    label: "Vietcombank",
    name: "Ngân hàng TMCP Ngoại thương Việt Nam",
    logoUrl: "https://api.vietqr.io/img/VCB.png",
  },
  {
    value: "Techcombank",
    label: "Techcombank",
    name: "Ngân hàng TMCP Kỹ thương Việt Nam",
    logoUrl: "https://api.vietqr.io/img/TCB.png",
  },
  {
    value: "BIDV",
    label: "BIDV",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    logoUrl: "https://api.vietqr.io/img/BIDV.png",
  },
  {
    value: "VPBank",
    label: "VPBank",
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    logoUrl: "https://api.vietqr.io/img/VPB.png",
  },
  {
    value: "ACB",
    label: "ACB",
    name: "Ngân hàng TMCP Á Châu",
    logoUrl: "https://api.vietqr.io/img/ACB.png",
  },
] as const;

function formatHoa(value: number | null | undefined) {
  return `${numberFormatter.format(Number(value ?? 0))} 🌸`;
}

function formatVnd(value: number | null | undefined) {
  return vndFormatter.format(Number(value ?? 0));
}

function formatPercentFromBps(value: number) {
  return `${numberFormatter.format(value / 100)}%`;
}

function getStatusMeta(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Chờ duyệt",
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        icon: Clock,
      };
    case "PROCESSING":
      return {
        label: "Đang xử lý",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        icon: Loader2,
      };
    case "COMPLETED":
      return {
        label: "Hoàn tất",
        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        icon: CheckCircle2,
      };
    case "REJECTED":
      return {
        label: "Từ chối",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        icon: XCircle,
      };
    default:
      return {
        label: status || "Không rõ",
        className: "bg-muted text-muted-foreground",
        icon: Clock,
      };
  }
}

function sortRequests(requests: WithdrawRequestData[]) {
  return [...requests].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default function AdminMyWithdrawPage() {
  const [form, setForm] = useState<WithdrawFormState>(initialFormState);
  const { data: wallet, isLoading: isWalletLoading } = useGetWalletQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const {
    data: withdrawResponse,
    isLoading: isWithdrawLoading,
    refetch,
  } = useGetMyWithdrawRequestsQuery();
  const { data: withdrawPolicy } = useGetWithdrawPolicyQuery();
  const [createWithdrawRequest, { isLoading: isCreating }] =
    useCreateWithdrawRequestMutation();

  const minWithdrawHoa = Number(
    withdrawPolicy?.data?.minWithdrawBlossom ?? MIN_WITHDRAW_HOA,
  );
  const vndPerFlower = Number(
    withdrawPolicy?.data?.vndPerBlossom ?? VND_PER_FLOWER,
  );
  const withdrawPlatformFeeBps = Number(
    withdrawPolicy?.data?.withdrawPlatformFeeBps ??
      DEFAULT_WITHDRAW_PLATFORM_FEE_BPS,
  );
  const balance = Number(wallet?.balance ?? 0);
  const frozenBalance = Number(wallet?.frozenBalance ?? 0);
  const availableBalance = Number(
    wallet?.availableBalance ?? Math.max(balance - frozenBalance, 0),
  );
  const requests = useMemo(
    () => sortRequests(withdrawResponse?.data ?? []),
    [withdrawResponse?.data],
  );
  const pendingCount = requests.filter(
    (request) =>
      request.status === "PENDING" || request.status === "PROCESSING",
  ).length;
  const selectedBank = BANK_OPTIONS.find((bank) => bank.value === form.bankName);
  const withdrawHoa = Number(form.amount);
  const hasWithdrawHoa =
    form.amount.trim() !== "" && Number.isFinite(withdrawHoa) && withdrawHoa > 0;
  const estimatedFeeHoa = hasWithdrawHoa
    ? Math.floor((withdrawHoa * withdrawPlatformFeeBps) / 10000)
    : 0;
  const estimatedNetHoa = hasWithdrawHoa
    ? Math.max(0, withdrawHoa - estimatedFeeHoa)
    : 0;
  const estimatedNetVnd = estimatedNetHoa * vndPerFlower;
  const remainingHoa = hasWithdrawHoa ? availableBalance - withdrawHoa : availableBalance;

  const updateField = (field: keyof WithdrawFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(form.amount);
    const bankName = form.bankName.trim();
    const accountNumber = form.accountNumber.trim();
    const accountHolder = form.accountHolder.trim();

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      toast.error("Vui lòng nhập số hoa rút hợp lệ.");
      return;
    }

    if (amount < minWithdrawHoa) {
      toast.error(`Số hoa rút tối thiểu là ${formatHoa(minWithdrawHoa)}.`);
      return;
    }

    if (amount >= availableBalance) {
      toast.error("Số hoa rút phải nhỏ hơn số dư khả dụng hiện có.");
      return;
    }

    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Vui lòng nhập đầy đủ thông tin tài khoản nhận tiền.");
      return;
    }

    try {
      await createWithdrawRequest({
        amount,
        bankName,
        accountNumber,
        accountHolder,
      }).unwrap();
      toast.success("Đã tạo yêu cầu rút tiền.");
      setForm(initialFormState);
      void refetch();
    } catch (error) {
      const message = (error as { data?: { message?: string } } | undefined)
        ?.data?.message;
      toast.error(message || "Không thể tạo yêu cầu rút tiền.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rút tiền của tôi
          </h1>
          <p className="text-muted-foreground">
            Tạo yêu cầu rút tiền cá nhân và theo dõi trạng thái xử lý.
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
              {isWalletLoading ? "..." : formatHoa(availableBalance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Dùng để kiểm tra giới hạn rút tiền.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang giữ
            </CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isWalletLoading ? "..." : formatHoa(frozenBalance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Khoản tiền đang xử lý nếu có.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Request đang mở
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Bao gồm yêu cầu chờ duyệt và đang xử lý.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Tạo yêu cầu rút tiền
            </CardTitle>
            <CardDescription>
              Yêu cầu sẽ được gửi vào luồng duyệt/chuyển tiền của admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Số hoa rút</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={minWithdrawHoa}
                  step="1"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="VD: 500"
                />
                <p className="text-xs text-muted-foreground">
                  Tối thiểu {formatHoa(minWithdrawHoa)} và nhỏ hơn số dư
                  khả dụng hiện có.
                </p>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      Số tiền ước tính nhận
                    </span>
                    <span className="font-semibold">
                      {formatVnd(estimatedNetVnd)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Đã trừ phí sàn {formatPercentFromBps(withdrawPlatformFeeBps)}</span>
                    <span>Phí: {formatHoa(estimatedFeeHoa)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>1 🌸 = {formatVnd(vndPerFlower)}</span>
                    <span>
                      Còn lại:{" "}
                      {hasWithdrawHoa && remainingHoa >= 0
                        ? formatHoa(remainingHoa)
                        : formatHoa(availableBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-bank">Ngân hàng</Label>
                <Select
                  value={form.bankName}
                  onValueChange={(value) => updateField("bankName", value)}
                >
                  <SelectTrigger id="withdraw-bank" className="h-11">
                    {selectedBank ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md border bg-white p-1">
                          <Image
                            src={selectedBank.logoUrl}
                            alt={selectedBank.label}
                            width={32}
                            height={20}
                            className="max-h-full w-auto object-contain"
                          />
                        </span>
                        <span className="truncate font-medium">
                          {selectedBank.label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Chọn ngân hàng nhận tiền
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_OPTIONS.map((bank) => (
                      <SelectItem
                        key={bank.value}
                        value={bank.value}
                        textValue={bank.label}
                        className="py-2"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-11 shrink-0 items-center justify-center rounded-md border bg-white p-1">
                            <Image
                              src={bank.logoUrl}
                              alt={bank.label}
                              width={36}
                              height={22}
                              className="max-h-full w-auto object-contain"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {bank.label}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {bank.name}
                            </span>
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-account-number">Số tài khoản</Label>
                <Input
                  id="withdraw-account-number"
                  value={form.accountNumber}
                  onChange={(event) =>
                    updateField("accountNumber", event.target.value)
                  }
                  placeholder="Nhập số tài khoản"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-account-holder">Chủ tài khoản</Label>
                <Input
                  id="withdraw-account-holder"
                  value={form.accountHolder}
                  onChange={(event) =>
                    updateField("accountHolder", event.target.value)
                  }
                  placeholder="Tên chủ tài khoản"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isCreating || isWalletLoading}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Gửi yêu cầu
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Yêu cầu rút tiền của tôi
            </CardTitle>
            <CardDescription>
              Danh sách request rút tiền do chính tài khoản này tạo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isWithdrawLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Đang tải yêu cầu rút tiền...
                      </TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Chưa có yêu cầu rút tiền.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => {
                      const status = getStatusMeta(request.status);
                      const StatusIcon = status.icon;

                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            #{request.id}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              {formatHoa(request.amount)}
                            </div>
                            {request.netPayoutAmount != null ? (
                              <div className="text-xs text-muted-foreground">
                                Net: {formatHoa(request.netPayoutAmount)}
                              </div>
                            ) : null}
                            {request.netPayoutVnd != null ? (
                              <div className="text-xs text-muted-foreground">
                                VND: {numberFormatter.format(request.netPayoutVnd)}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline">{request.bankName}</Badge>
                              <div className="font-mono text-xs">
                                {request.accountNumber}
                              </div>
                              <div className="text-xs uppercase text-muted-foreground">
                                {request.accountHolder}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.className}>
                              <StatusIcon
                                className={`mr-1 h-3 w-3 ${
                                  request.status === "PROCESSING"
                                    ? "animate-spin"
                                    : ""
                                }`}
                              />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(request.createdAt).toLocaleString("vi-VN")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
