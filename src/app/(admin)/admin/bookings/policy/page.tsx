"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetBookingPolicyQuery,
  useUpdateBookingPolicyMutation,
  type BookingPolicy,
} from "@/store/services/admin/bookingPolicyApi";

const defaults: BookingPolicy = {
  id: 0,
  defaultServiceFeeBps: 0,
  proServiceFeeBps: null,
  premiumServiceFeeBps: null,
  courseDefaultPlatformFeeBps: 0,
  courseProPlatformFeeBps: null,
  coursePremiumPlatformFeeBps: null,
  withdrawPlatformFeeBps: 3000,
  normalCancelPenaltyBps: 5000,
  lateCancelPenaltyBps: 10000,
  lateCancelThresholdHours: 2,
  teacherCancelRefundBps: 10000,
  noShowPenaltyBps: 10000,
  active: true,
};

const samplePrice = 100;
const sampleDiscount = 20;

const bpsToPercent = (bps?: number | null) => (bps == null ? "" : String(bps / 100));
const formatPercent = (bps?: number | null) => `${bpsToPercent(bps) || "0"}%`;
const percentToBps = (value: string) => {
  if (value === "") return null;
  const percent = Number(value);
  return Number.isFinite(percent) ? Math.round(percent * 100) : null;
};
const formatHoa = (value: number) => `${value.toLocaleString("vi-VN")} hoa`;

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message || fallback;
  }
  return fallback;
};

const revenuePolicyPayload = (form: BookingPolicy): BookingPolicy => ({
  ...form,
  defaultServiceFeeBps: 0,
  proServiceFeeBps: null,
  premiumServiceFeeBps: null,
  courseDefaultPlatformFeeBps: 0,
  courseProPlatformFeeBps: null,
  coursePremiumPlatformFeeBps: null,
  active: true,
});

function PercentInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={bpsToPercent(value)}
          onChange={(event) => onChange(percentToBps(event.target.value) ?? 0)}
        />
        <span className="w-8 text-sm font-semibold text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function BookingPolicyPage() {
  const { data: policy } = useGetBookingPolicyQuery();
  const [updatePolicy, { isLoading: isSaving }] = useUpdateBookingPolicyMutation();
  const [draft, setDraft] = useState<BookingPolicy | null>(null);
  const form = revenuePolicyPayload(draft ?? policy ?? defaults);
  const withdrawPlatformFeeBps = policy?.withdrawPlatformFeeBps ?? defaults.withdrawPlatformFeeBps;

  const setForm = (patch: Partial<BookingPolicy>) => {
    setDraft(revenuePolicyPayload({ ...form, ...patch }));
  };

  const studentPays = Math.max(0, samplePrice - sampleDiscount);
  const withdrawFee = Math.floor((studentPays * (withdrawPlatformFeeBps ?? 0)) / 10000);
  const teacherNet = Math.max(0, studentPays - withdrawFee);

  const save = async () => {
    try {
      await updatePolicy(revenuePolicyPayload({ ...form, withdrawPlatformFeeBps })).unwrap();
      setDraft(null);
      toast.success("Đã lưu chính sách tính đủ");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Không thể lưu chính sách"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cơ chế tính đủ</h1>
        <p className="text-sm text-muted-foreground">
          Học sinh trả giá sau giảm; giáo viên nhận số hoa đó và chỉ bị trừ chiết khấu khi rút tiền.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chiết khấu rút tiền</CardTitle>
          <CardDescription>Chỉ được chỉnh phí này tại trang Analytics admin.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Metric label="Chiết khấu khi rút" value={formatPercent(withdrawPlatformFeeBps)} />
          <Metric label="Phí booking lúc đặt" value="0%" />
          <Metric label="Phí khóa học lúc mua" value="0%" />
          <Button asChild variant="outline">
            <Link href="/admin/analytics/admin">Mở trang chỉnh phí</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hủy lịch và no-show</CardTitle>
          <CardDescription>Các khoản phạt này xử lý trên tiền học sinh đã giữ cho booking.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <PercentInput
            id="normal-cancel-penalty"
            label="Phạt hủy thường"
            value={form.normalCancelPenaltyBps}
            onChange={(normalCancelPenaltyBps) => setForm({ normalCancelPenaltyBps })}
          />
          <PercentInput
            id="late-cancel-penalty"
            label="Phạt hủy muộn"
            value={form.lateCancelPenaltyBps}
            onChange={(lateCancelPenaltyBps) => setForm({ lateCancelPenaltyBps })}
          />
          <div className="space-y-2">
            <Label htmlFor="late-cancel-threshold">Ngưỡng hủy muộn (giờ)</Label>
            <Input
              id="late-cancel-threshold"
              type="number"
              min={0}
              value={form.lateCancelThresholdHours}
              onChange={(event) => setForm({ lateCancelThresholdHours: Number(event.target.value) })}
            />
          </div>
          <PercentInput
            id="teacher-cancel-refund"
            label="Hoàn tiền khi giáo viên hủy"
            value={form.teacherCancelRefundBps}
            onChange={(teacherCancelRefundBps) => setForm({ teacherCancelRefundBps })}
          />
          <PercentInput
            id="no-show-penalty"
            label="Phạt no-show"
            value={form.noShowPenaltyBps}
            onChange={(noShowPenaltyBps) => setForm({ noShowPenaltyBps })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mô phỏng</CardTitle>
          <CardDescription>Ví dụ giao dịch mới với giá gốc 100 hoa và mã giảm 20 hoa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Metric label="Học sinh trả" value={formatHoa(studentPays)} />
          <Metric label="Giáo viên nhận vào ví" value={formatHoa(studentPays)} />
          <Metric label="Chiết khấu khi rút" value={formatHoa(withdrawFee)} />
          <Metric label="Giáo viên thực nhận" value={formatHoa(teacherNet)} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={isSaving}>
          <Save className="mr-2 size-4" />
          {isSaving ? "Đang lưu" : "Lưu chính sách"}
        </Button>
      </div>
    </div>
  );
}
