"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetAdminVoiceTopicsQuery,
  useCreateVoiceTopicMutation,
  useUpdateVoiceTopicMutation,
  useDeleteVoiceTopicMutation,
  type VoiceTopic,
  type VoiceTopicRequest,
} from "@/store/services/admin/voiceTopicApi";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal, Plus, Pencil, Trash2, X, Eye, EyeOff, Loader2, ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  { value: "giao_tiep", label: "Giao tiếp" },
  { value: "cong_viec", label: "Công việc" },
  { value: "du_lich", label: "Du lịch" },
  { value: "mua_sam", label: "Mua sắm" },
  { value: "nha_hang", label: "Nhà hàng" },
  { value: "y_te", label: "Y tế" },
  { value: "giao_duc", label: "Giáo dục" },
  { value: "khac", label: "Khác" },
];

const INITIAL_FORM: VoiceTopicRequest = {
  title: "", titleJp: "", description: "", category: "giao_tiep",
  thumbnailUrl: "", isPublished: false, sortOrder: 0,
};

export default function AdminVoiceTopicsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useGetAdminVoiceTopicsQuery({ page, size: 20 });
  const [createTopic, { isLoading: isCreating }] = useCreateVoiceTopicMutation();
  const [updateTopic, { isLoading: isUpdating }] = useUpdateVoiceTopicMutation();
  const [deleteTopic] = useDeleteVoiceTopicMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const topics = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const openCreate = () => { setEditingId(null); setForm(INITIAL_FORM); setShowForm(true); };
  const openEdit = (t: VoiceTopic) => {
    setEditingId(t.id);
    setForm({
      title: t.title, titleJp: t.titleJp, description: t.description,
      category: t.category || "giao_tiep", thumbnailUrl: t.thumbnailUrl,
      isPublished: t.isPublished, sortOrder: t.sortOrder,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTopic({ id: editingId, data: form }).unwrap();
      } else {
        const result = await createTopic(form).unwrap();
        router.push(`/admin/voice-topics/${result.id}`);
      }
      closeForm();
    } catch { alert("Thao tác thất bại!"); }
  };

  const handleTogglePublish = async (t: VoiceTopic) => {
    try {
      await updateTopic({
        id: t.id,
        data: { title: t.title, isPublished: !t.isPublished },
      }).unwrap();
    } catch { alert("Thất bại!"); }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Luyện nói AI — Chủ đề</h1>
          <p className="text-muted-foreground">Quản lý chủ đề và kịch bản hội thoại</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tạo chủ đề</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Kịch bản</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : topics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có chủ đề nào
                  </TableCell>
                </TableRow>
              ) : topics.map((t, i) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-accent/50"
                  onClick={() => router.push(`/admin/voice-topics/${t.id}`)}>
                  <TableCell className="font-mono text-xs">{page * 20 + i + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium">{t.title}</p>
                    {t.titleJp && <p className="text-xs text-muted-foreground">{t.titleJp}</p>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {CATEGORIES.find(c => c.value === t.category)?.label || t.category || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.scenarioCount ?? 0} kịch bản</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isPublished ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); handleTogglePublish(t); }}>
                      {t.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/voice-topics/${t.id}`)}>
                          <ArrowRight className="mr-2 h-4 w-4" />Xem kịch bản
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(t)}>
                          <Pencil className="mr-2 h-4 w-4" />Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"
                          onClick={() => { if (confirm(`Xóa "${t.title}"?`)) deleteTopic(t.id); }}>
                          <Trash2 className="mr-2 h-4 w-4" />Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</Button>
          <span className="text-sm self-center">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
      )}

      {/* ── Create/Edit Topic Form ── */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={closeForm} />
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="flex min-h-full items-start justify-center px-4 py-10">
              <div className="w-full max-w-lg pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
                onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                  <Card className="shadow-2xl">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                      <div>
                        <CardTitle>{editingId ? "Sửa chủ đề" : "Tạo chủ đề mới"}</CardTitle>
                        <CardDescription className="mt-1">
                          {editingId ? "Cập nhật thông tin" : "Tạo xong sẽ chuyển sang trang thêm kịch bản"}
                        </CardDescription>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={closeForm}>
                        <X className="h-5 w-5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tiêu đề *</Label>
                        <Input placeholder="VD: Mua sắm" value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Tiêu đề JP</Label>
                        <Input placeholder="VD: 買い物" value={form.titleJp || ""}
                          onChange={e => setForm(f => ({ ...f, titleJp: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Danh mục</Label>
                        <Select value={form.category || "giao_tiep"}
                          onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea placeholder="Mô tả ngắn..." rows={2} value={form.description || ""}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeForm}>Hủy</Button>
                        <Button type="submit" disabled={isCreating || isUpdating}>
                          {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingId ? "Cập nhật" : "Tạo & thêm kịch bản →"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
