"use client";

import React, { useState } from "react";
import { ImageIcon, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateFlashcardImagePackMutation,
  useGetFlashcardImagePacksQuery,
  useGetFlashcardImagePoliciesQuery,
  useGetFlashcardImageUsageQuery,
  useGetFlashcardImageUsageSummaryQuery,
  useUpdateFlashcardImagePackMutation,
  useUpdateFlashcardImagePolicyMutation,
  type FlashcardImagePack,
} from "@/store/services/admin/flashcardImageBillingApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emptyPack = {
  code: "",
  name: "",
  operationAmount: 100,
  priceHoa: 30,
  active: true,
  sortOrder: 0,
};

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message || fallback;
  }
  return fallback;
};

const operationLabel = (operation: string) => {
  if (operation === "IMAGE_SEARCH") return "Tìm ảnh";
  if (operation === "IMAGE_SAVE") return "Lưu ảnh";
  return operation;
};

const quotaSourceLabel = (source: string) => {
  if (source === "DAILY") return "Quota ngày";
  if (source === "PACK") return "Gói lượt ảnh";
  if (source === "SYSTEM_PACKAGE") return "Gói hệ thống";
  if (source === "FREE") return "Miễn phí";
  return source;
};

export default function FlashcardImagePricingPage() {
  const { data: policies = [] } = useGetFlashcardImagePoliciesQuery();
  const { data: packs = [] } = useGetFlashcardImagePacksQuery();
  const { data: summary } = useGetFlashcardImageUsageSummaryQuery();
  const { data: usage = [] } = useGetFlashcardImageUsageQuery();
  const [updatePolicy] = useUpdateFlashcardImagePolicyMutation();
  const [createPack] = useCreateFlashcardImagePackMutation();
  const [updatePack] = useUpdateFlashcardImagePackMutation();
  const [editingPack, setEditingPack] = useState<FlashcardImagePack | null>(null);
  const [packForm, setPackForm] = useState(emptyPack);
  const [packOpen, setPackOpen] = useState(false);

  const submitPack = async () => {
    try {
      if (editingPack) {
        await updatePack({ id: editingPack.id, data: packForm }).unwrap();
      } else {
        await createPack(packForm).unwrap();
      }
      toast.success("Đã lưu gói ảnh thẻ ghi nhớ");
      setPackOpen(false);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Không thể lưu gói ảnh"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Giá và quota ảnh thẻ ghi nhớ</h1>
        <p className="text-sm text-muted-foreground">Chỉ tính lượt khi hệ thống gọi Serper hoặc Cloudinary thật.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Hôm nay</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.todayExternalCalls ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Tuần này</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.weekExternalCalls ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Tháng này</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.monthExternalCalls ?? 0}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Quota theo hạng gói</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Hạng gói</TableHead><TableHead>Quota/ngày</TableHead><TableHead>Trần/ngày</TableHead><TableHead>Cho mua gói thêm</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell><Badge>{policy.tier}</Badge></TableCell>
                  <TableCell><Input type="number" defaultValue={policy.dailyQuota} id={`daily-${policy.id}`} /></TableCell>
                  <TableCell><Input type="number" defaultValue={policy.hardCapDaily} id={`cap-${policy.id}`} /></TableCell>
                  <TableCell>{policy.packEnabled ? "Bật" : "Tắt"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={async () => {
                        const daily = Number((document.getElementById(`daily-${policy.id}`) as HTMLInputElement)?.value || 0);
                        const cap = Number((document.getElementById(`cap-${policy.id}`) as HTMLInputElement)?.value || 0);
                        await updatePolicy({ id: policy.id, data: { ...policy, dailyQuota: daily, hardCapDaily: cap } }).unwrap();
                        toast.success("Đã cập nhật quota");
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" /> Lưu
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gói ảnh mua thêm</CardTitle>
          <Button onClick={() => { setEditingPack(null); setPackForm(emptyPack); setPackOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Thêm gói</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Gói</TableHead><TableHead>Số lượt</TableHead><TableHead>Giá</TableHead><TableHead>Đang mở bán</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {packs.map((pack) => (
                <TableRow key={pack.id}>
                  <TableCell><div className="font-medium">{pack.name}</div><div className="text-xs text-muted-foreground">{pack.code}</div></TableCell>
                  <TableCell>{pack.operationAmount.toLocaleString()}</TableCell>
                  <TableCell>{pack.priceHoa.toLocaleString()} hoa</TableCell>
                  <TableCell>{pack.active ? <Badge>Đang mở</Badge> : <Badge variant="secondary">Tắt</Badge>}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" onClick={() => { setEditingPack(pack); setPackForm(pack); setPackOpen(true); }}>Sửa</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Lịch sử sử dụng</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Tác vụ</TableHead><TableHead>Nguồn quota</TableHead><TableHead>Gọi dịch vụ ngoài</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader>
            <TableBody>
              {usage.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.username || item.userId}</TableCell>
                  <TableCell>{operationLabel(item.operationType)}</TableCell>
                  <TableCell>{quotaSourceLabel(item.quotaSource)}</TableCell>
                  <TableCell>{item.externalCalled ? "Có" : "Dùng cache"}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString("vi-VN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={packOpen} onOpenChange={setPackOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPack ? "Sửa gói ảnh" : "Tạo gói ảnh"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Mã gói</Label><Input value={packForm.code} onChange={(e) => setPackForm({ ...packForm, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tên</Label><Input value={packForm.name} onChange={(e) => setPackForm({ ...packForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Số lượt</Label><Input type="number" value={packForm.operationAmount} onChange={(e) => setPackForm({ ...packForm, operationAmount: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Giá hoa</Label><Input type="number" value={packForm.priceHoa} onChange={(e) => setPackForm({ ...packForm, priceHoa: Number(e.target.value) })} /></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={packForm.active} onCheckedChange={(active) => setPackForm({ ...packForm, active })} /> Đang mở bán</label>
          </div>
          <DialogFooter><Button onClick={submitPack}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
