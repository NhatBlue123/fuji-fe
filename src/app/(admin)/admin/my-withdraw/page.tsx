"use client";

import { type FormEvent, useMemo, useState } from "react";
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
  type WithdrawRequestData,
} from "@/store/services/withdrawApi";
import { useGetWalletQuery } from "@/store/services/walletApi";

const MIN_WITHDRAW_AMOUNT = 50;
const numberFormatter = new Intl.NumberFormat("vi-VN");

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

function formatHoa(value: number | null | undefined) {
  return `${numberFormatter.format(Number(value ?? 0))} 🌸`;
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
  const [createWithdrawRequest, { isLoading: isCreating }] =
    useCreateWithdrawRequestMutation();

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

  const updateField = (field: keyof WithdrawFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(form.amount);
    const bankName = form.bankName.trim();
    const accountNumber = form.accountNumber.trim();
    const accountHolder = form.accountHolder.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Vui lòng nhập số tiền rút hợp lệ.");
      return;
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      toast.error(`Số tiền rút tối thiểu là ${formatHoa(MIN_WITHDRAW_AMOUNT)}.`);
      return;
    }

    if (amount > availableBalance) {
      toast.error("Số tiền rút không được vượt quá số dư khả dụng.");
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
                <Label htmlFor="withdraw-amount">Số tiền rút</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={MIN_WITHDRAW_AMOUNT}
                  step="1"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="VD: 500"
                />
                <p className="text-xs text-muted-foreground">
                  Tối thiểu {formatHoa(MIN_WITHDRAW_AMOUNT)}, không vượt quá số
                  dư khả dụng.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-bank">Ngân hàng</Label>
                <Input
                  id="withdraw-bank"
                  value={form.bankName}
                  onChange={(event) =>
                    updateField("bankName", event.target.value)
                  }
                  placeholder="VD: Vietcombank"
                />
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
