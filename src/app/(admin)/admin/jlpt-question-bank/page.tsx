"use client";

import { useState } from "react";
import {
  useGetQuestionBankItemsQuery,
  useCreateQuestionBankItemMutation,
  useBulkCreateQuestionBankItemsMutation,
  useUpdateQuestionBankItemMutation,
  useDeleteQuestionBankItemMutation,
  useUploadAudioMutation,
  useUploadImageMutation,
  type QuestionBankItem,
  type CreateQuestionBankItemDTO,
} from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Sparkles } from "lucide-react";

type Level = QuestionBankItem["level"];
type Section = QuestionBankItem["section"];
type Difficulty = QuestionBankItem["difficulty"];

const levels: Level[] = ["N5", "N4", "N3", "N2", "N1"];
const sections: { value: Section; label: string }[] = [
  { value: "VOCABULARY", label: "Từ vựng" },
  { value: "GRAMMAR", label: "Ngữ pháp" },
  { value: "READING", label: "Đọc hiểu" },
  { value: "LISTENING", label: "Nghe hiểu" },
];
const difficulties: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
];

export default function JlptQuestionBankPage() {
  const [level, setLevel] = useState<Level | undefined>();
  const [section, setSection] = useState<Section | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, refetch } = useGetQuestionBankItemsQuery({
    level,
    section,
    difficulty,
    search: search || undefined,
    page,
    size: 20,
  });

  const [createItem, { isLoading: creating }] = useCreateQuestionBankItemMutation();
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateQuestionBankItemsMutation();
  const [updateItem, { isLoading: updating }] = useUpdateQuestionBankItemMutation();
  const [deleteItem, { isLoading: deleting }] = useDeleteQuestionBankItemMutation();
  const [uploadAudio] = useUploadAudioMutation();
  const [uploadImage] = useUploadImageMutation();

  const [editing, setEditing] = useState<QuestionBankItem | null>(null);
  const [form, setForm] = useState<Partial<CreateQuestionBankItemDTO>>({});

  // AI generator state (for bank)
  const [showAI, setShowAI] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiMondaiNumber, setAiMondaiNumber] = useState<number>(1);
  const [aiMondaiTitle, setAiMondaiTitle] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<
    { contentText: string; options: string[]; correctOption: number; explanation: string; passageText: string }[]
  >([]);

  const resetForm = () => {
    setEditing(null);
    setForm({});
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      level: level ?? "N5",
      section: section ?? "VOCABULARY",
      difficulty: "MEDIUM",
      points: 1,
    });
  };

  const openEdit = (item: QuestionBankItem) => {
    setEditing(item);
    setForm({
      level: item.level,
      section: item.section,
      difficulty: item.difficulty,
      mondaiNumber: item.mondaiNumber,
      mondaiTitle: item.mondaiTitle,
      passageText: item.passageText,
      contentText: item.contentText,
      options: item.options,
      correctOption: item.correctOption,
      explanation: item.explanation,
      points: item.points,
      tags: item.tags,
    });
  };

  const handleSubmit = async () => {
    if (!form.level || !form.section || !form.contentText) {
      alert("Level, Section và Nội dung câu hỏi là bắt buộc");
      return;
    }
    try {
      if (editing) {
        await updateItem({ id: editing.id, data: form }).unwrap();
      } else {
        await createItem(form as CreateQuestionBankItemDTO).unwrap();
      }
      resetForm();
      refetch();
    } catch (e) {
      console.error(e);
      alert("Lưu câu hỏi ngân hàng thất bại");
    }
  };

  const handleDelete = async (item: QuestionBankItem) => {
    if (!confirm("Xóa câu hỏi này khỏi ngân hàng?")) return;
    try {
      await deleteItem(item.id).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
      alert("Xóa câu hỏi ngân hàng thất bại");
    }
  };

  const handleAudioUpload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadAudio(fd).unwrap();
      setForm((f) => ({ ...f, audioMediaId: result.id }));
      alert("Upload audio thành công");
    } catch (e) {
      console.error(e);
      alert("Upload audio thất bại");
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd).unwrap();
      setForm((f) => ({ ...f, imageMediaId: result.id }));
      alert("Upload ảnh thành công");
    } catch (e) {
      console.error(e);
      alert("Upload ảnh thất bại");
    }
  };

  const generateAI = async () => {
    if (!level || !section) {
      setAiError("Hãy chọn Level và Phần thi để AI tạo câu hỏi.");
      return;
    }
    if (aiCount < 1 || aiCount > 20) {
      setAiError("Số lượng phải từ 1 đến 20.");
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    setAiPreview([]);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          section,
          count: aiCount,
          mondaiNumber: aiMondaiNumber,
          mondaiTitle: aiMondaiTitle || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error || "AI lỗi không xác định");
        return;
      }
      setAiPreview(json.questions || []);
    } catch (e: any) {
      setAiError(e?.message || "Không thể kết nối AI");
    } finally {
      setAiGenerating(false);
    }
  };

  const saveAIToBank = async () => {
    if (!level || !section) return;
    if (aiPreview.length === 0) return;
    try {
      const baseTags = [level, section, "ai"];
      let extraTag = "";
      const lowerTitle = (aiMondaiTitle || "").toLowerCase();
      if (lowerTitle.includes("kanji") || lowerTitle.includes("漢字")) {
        extraTag = "cách đọc kanji";
      } else if (lowerTitle.includes("語彙") || lowerTitle.includes("từ vựng")) {
        extraTag = "từ vựng";
      } else if (lowerTitle.includes("文脈") || lowerTitle.includes("ngữ cảnh")) {
        extraTag = "từ theo ngữ cảnh";
      } else if (lowerTitle.includes("言い換え")) {
        extraTag = "paraphrase";
      } else if (lowerTitle.includes("文法")) {
        extraTag = "ngữ pháp";
      }

      const payloads: CreateQuestionBankItemDTO[] = aiPreview.map((q) => ({
        level,
        section,
        difficulty: "MEDIUM",
        mondaiNumber: aiMondaiNumber,
        mondaiTitle: aiMondaiTitle || undefined,
        passageText: q.passageText || undefined,
        contentText: q.contentText,
        options: JSON.stringify(q.options),
        correctOption: q.correctOption,
        explanation: q.explanation,
        points: 1.0,
        tags: [baseTags.join(","), extraTag].filter(Boolean).join(","),
      }));
      await bulkCreate(payloads).unwrap();
      alert(`Đã lưu ${payloads.length} câu hỏi AI vào ngân hàng`);
      setAiPreview([]);
      refetch();
    } catch (e) {
      console.error(e);
      alert("Lưu câu hỏi AI vào ngân hàng thất bại");
    }
  };

  const content = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Ngân hàng câu hỏi JLPT</h1>
          <p className="text-sm text-muted-foreground">
            Lưu trữ và tái sử dụng câu hỏi cho nhiều đề thi (AI hoặc tự tạo).
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm câu hỏi
        </Button>
      </div>

      {/* AI Generator */}
      <div className="border rounded-md bg-background p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <p className="text-sm font-semibold">AI tạo câu hỏi (lưu vào ngân hàng)</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAI((v) => !v)}>
            {showAI ? "Ẩn" : "Mở"} AI
          </Button>
        </div>

        {showAI && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              AI dùng đúng Level/Phần đang chọn ở bộ lọc bên trên. Với Listening: AI chỉ sinh câu + đáp án, audio bạn upload thủ công (hoặc tích hợp TTS sau).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mondai số</Label>
                <Input
                  type="number"
                  min={1}
                  value={aiMondaiNumber}
                  onChange={(e) => setAiMondaiNumber(Number(e.target.value) || 1)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Mondai title (tuỳ chọn)</Label>
                <Input
                  value={aiMondaiTitle}
                  onChange={(e) => setAiMondaiTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Số câu (1-20)</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value) || 1)}
                  className="h-8 w-28 text-xs"
                />
              </div>
              <Button size="sm" onClick={generateAI} disabled={aiGenerating}>
                {aiGenerating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Generate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={saveAIToBank}
                disabled={bulkCreating || aiPreview.length === 0}
              >
                {bulkCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Lưu vào ngân hàng
              </Button>
            </div>
            {aiError && (
              <p className="text-xs text-destructive">{aiError}</p>
            )}
            {aiPreview.length > 0 && (
              <div className="space-y-2">
                {aiPreview.map((q, idx) => (
                  <div key={idx} className="border rounded-md p-3 text-xs">
                    {q.passageText ? (
                      <div className="mb-2 whitespace-pre-wrap rounded bg-blue-50 border border-blue-200 p-2">
                        {q.passageText}
                      </div>
                    ) : null}
                    <p className="font-medium mb-2 whitespace-pre-wrap">{q.contentText}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options?.map((opt, i) => (
                        <div key={i} className={`rounded border px-2 py-1 ${i + 1 === q.correctOption ? "border-green-400 bg-green-50" : ""}`}>
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation ? (
                      <p className="text-muted-foreground mt-2 whitespace-pre-wrap">Giải thích: {q.explanation}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Level</Label>
          <Select value={level} onValueChange={(v: Level) => { setLevel(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__" disabled className="hidden" />
              {levels.map((lv) => (
                <SelectItem key={lv} value={lv}>{lv}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Phần thi</Label>
          <Select value={section} onValueChange={(v: Section) => { setSection(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Độ khó</Label>
          <Select value={difficulty} onValueChange={(v: Difficulty) => { setDifficulty(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Tìm kiếm</Label>
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm theo nội dung hoặc tags..."
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-background overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
          <p className="text-xs text-muted-foreground">
            {isFetching ? "Đang tải..." : `Tổng: ${data?.totalElements ?? 0} câu hỏi`}
          </p>
          {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="divide-y text-xs">
          <div className="grid grid-cols-[80px_120px_80px_1fr_80px_80px] gap-2 px-3 py-2 font-semibold bg-muted/60">
            <span>Level</span>
            <span>Phần</span>
            <span>Độ khó</span>
            <span>Nội dung</span>
            <span>Tags</span>
            <span className="text-right">Thao tác</span>
          </div>
          {content.map((q) => (
            <div
              key={q.id}
              className="grid grid-cols-[80px_120px_80px_1fr_80px_80px] gap-2 px-3 py-2 items-start hover:bg-muted/40"
            >
              <span>{q.level}</span>
              <span>
                {sections.find((s) => s.value === q.section)?.label ?? q.section}
              </span>
              <span>
                {difficulties.find((d) => d.value === q.difficulty)?.label ?? q.difficulty}
              </span>
              <span className="line-clamp-2">{q.contentText}</span>
              <span className="line-clamp-2">{q.tags}</span>
              <span className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => openEdit(q)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(q)}
                  disabled={deleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </span>
            </div>
          ))}
          {content.length === 0 && !isLoading && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Chưa có câu hỏi nào trong ngân hàng với bộ lọc hiện tại.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/40 text-xs">
            <span>
              Trang {page + 1}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? "default" : "outline"}
                    className="h-7 px-2"
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form drawer (simple inline panel) */}
      {(form.level || form.contentText) && (
        <div className="border rounded-md bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {editing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={creating || updating}
              >
                {(creating || updating) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Lưu
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select
                value={form.level}
                onValueChange={(v: Level) => setForm((f) => ({ ...f, level: v }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((lv) => (
                    <SelectItem key={lv} value={lv}>{lv}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phần thi</Label>
              <Select
                value={form.section}
                onValueChange={(v: Section) => setForm((f) => ({ ...f, section: v }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Độ khó</Label>
              <Select
                value={form.difficulty ?? "MEDIUM"}
                onValueChange={(v: Difficulty) => setForm((f) => ({ ...f, difficulty: v }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mondai số (tùy chọn)</Label>
              <Input
                type="number"
                value={form.mondaiNumber ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mondaiNumber: e.target.value ? Number(e.target.value) : undefined }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tiêu đề Mondai (tùy chọn)</Label>
              <Input
                value={form.mondaiTitle ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, mondaiTitle: e.target.value || undefined }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Upload Image (tuỳ chọn)</Label>
              <Input
                type="file"
                accept="image/*"
                className="h-9 text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImageUpload(f);
                }}
              />
              {form.imageMediaId ? (
                <p className="text-[10px] text-muted-foreground">imageMediaId: {form.imageMediaId}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Upload Audio (Listening)</Label>
              <Input
                type="file"
                accept="audio/*"
                className="h-9 text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAudioUpload(f);
                }}
              />
              {form.audioMediaId ? (
                <p className="text-[10px] text-muted-foreground">audioMediaId: {form.audioMediaId}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Đoạn văn (passage) – cho đọc/nghe (tùy chọn)</Label>
            <Textarea
              rows={3}
              value={form.passageText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, passageText: e.target.value || undefined }))}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Nội dung câu hỏi *</Label>
            <Textarea
              rows={3}
              value={form.contentText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contentText: e.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Options (JSON hoặc để trống)</Label>
              <Textarea
                rows={3}
                value={form.options ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value || undefined }))}
                placeholder='VD: ["1. ...","2. ...","3. ...","4. ..."]'
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Đáp án đúng (1-4)</Label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={form.correctOption ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, correctOption: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Điểm</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={form.points ?? 1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, points: e.target.value ? Number(e.target.value) : 1 }))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Giải thích (tùy chọn)</Label>
            <Textarea
              rows={2}
              value={form.explanation ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value || undefined }))}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tags (phân tách bằng dấu phẩy)</Label>
            <Input
              value={form.tags ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value || undefined }))}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

