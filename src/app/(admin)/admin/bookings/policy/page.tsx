"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetBookingHoldsQuery,
  useGetBookingPolicyQuery,
  useUpdateBookingPolicyMutation,
  type BookingPolicy,
} from "@/store/services/admin/bookingPolicyApi";

const defaults: BookingPolicy = {
  id: 0,
  defaultServiceFeeBps: 500,
  proServiceFeeBps: null,
  premiumServiceFeeBps: null,
  normalCancelPenaltyBps: 5000,
  lateCancelPenaltyBps: 10000,
  lateCancelThresholdHours: 2,
  teacherCancelRefundBps: 10000,
  noShowPenaltyBps: 10000,
  active: true,
};

const bpsToPercent = (bps?: number | null) => (bps == null ? "" : String(bps / 100));
const percentToBps = (value: string) => value === "" ? null : Math.round(Number(value) * 100);

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message || fallback;
  }
  return fallback;
};

const holdStatusLabel = (status: string) => {
  if (status === "HELD") return "Đang giữ";
  if (status === "CAPTURED") return "Đã thu";
  if (status === "RELEASED") return "Đã hoàn";
  if (status === "PARTIAL_CAPTURED") return "Thu một phần";
  return status;
};

export default function BookingPolicyPage() {
  const { data: policy } = useGetBookingPolicyQuery();
  const { data: holds = [] } = useGetBookingHoldsQuery();
  const [updatePolicy] = useUpdateBookingPolicyMutation();
  const [draft, setDraft] = useState<BookingPolicy | null>(null);
  const form = draft ?? policy ?? defaults;
  const setForm = (patch: Partial<BookingPolicy>) => {
    setDraft({ ...form, ...patch });
  };

  const sampleTuition = 100;
  const fee = Math.floor((sampleTuition * form.defaultServiceFeeBps) / 10000);

  const save = async () => {
    try {
      await updatePolicy(form).unwrap();
      setDraft(null);
      toast.success("Đã lưu chính sách đặt lịch");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Không thể lưu chính sách"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chính sách đặt lịch</h1>
        <p className="text-sm text-muted-foreground">Quản lý phí nền tảng, phí phạt hủy lịch và quy trình giữ/thu tiền.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Phí & hủy lịch</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>Phí nền tảng mặc định (%)</Label><Input value={bpsToPercent(form.defaultServiceFeeBps)} onChange={(e) => setForm({ defaultServiceFeeBps: percentToBps(e.target.value) || 0 })} /></div>
          <div className="space-y-2"><Label>Phí nền tảng PRO (%)</Label><Input value={bpsToPercent(form.proServiceFeeBps)} onChange={(e) => setForm({ proServiceFeeBps: percentToBps(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Phí nền tảng PREMIUM (%)</Label><Input value={bpsToPercent(form.premiumServiceFeeBps)} onChange={(e) => setForm({ premiumServiceFeeBps: percentToBps(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Phí phạt hủy thường (%)</Label><Input value={bpsToPercent(form.normalCancelPenaltyBps)} onChange={(e) => setForm({ normalCancelPenaltyBps: percentToBps(e.target.value) || 0 })} /></div>
          <div className="space-y-2"><Label>Phí phạt hủy muộn (%)</Label><Input value={bpsToPercent(form.lateCancelPenaltyBps)} onChange={(e) => setForm({ lateCancelPenaltyBps: percentToBps(e.target.value) || 0 })} /></div>
          <div className="space-y-2"><Label>Ngưỡng hủy muộn giờ</Label><Input type="number" value={form.lateCancelThresholdHours} onChange={(e) => setForm({ lateCancelThresholdHours: Number(e.target.value) })} /></div>
          <div className="md:col-span-3"><Button onClick={save}>Lưu chính sách</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mô phỏng</CardTitle></CardHeader>
        <CardContent className="text-sm">
          Với học phí {sampleTuition} hoa: học sinh trả {sampleTuition + fee} hoa, giáo viên nhận {sampleTuition} hoa, nền tảng nhận {fee} hoa.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tiền đặt lịch đang giữ</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Lịch học</TableHead><TableHead>Người dùng</TableHead><TableHead>Đang giữ</TableHead><TableHead>Đã thu</TableHead><TableHead>Đã hoàn</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
            <TableBody>
              {holds.map((hold) => (
                <TableRow key={hold.id}>
                  <TableCell>{hold.bookingId}</TableCell>
                  <TableCell>{hold.userId}</TableCell>
                  <TableCell>{hold.heldAmountHoa}</TableCell>
                  <TableCell>{hold.capturedAmountHoa}</TableCell>
                  <TableCell>{hold.releasedAmountHoa}</TableCell>
                  <TableCell>{holdStatusLabel(hold.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
