"use client";

import { useState, useRef, useMemo } from "react";
import { JLPT_STRUCTURE } from "@/lib/jlpt-structure";
import type { JLPTLevel, SectionKey } from "@/lib/jlpt-structure";
import {
  useGetQuestionBankItemsQuery,
  useCreateQuestionBankItemMutation,
  useBulkCreateQuestionBankItemsMutation,
  useUpdateQuestionBankItemMutation,
  useDeleteQuestionBankItemMutation,
  useUploadAudioMutation,
  useUploadImageMutation,
  useImportExcelMutation,
  usePreviewImportExcelMutation,
  type QuestionBankItem,
  type CreateQuestionBankItemDTO,
  type ExcelImportRowDTO,
} from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

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
  const [importExcel, { isLoading: isImporting }] = useImportExcelMutation();
  const [previewImportExcel, { isLoading: isPreviewing }] = usePreviewImportExcelMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ExcelImportRowDTO[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const [editing, setEditing] = useState<QuestionBankItem | null>(null);
  const [form, setForm] = useState<Partial<CreateQuestionBankItemDTO>>({});

  // AI generator state (for bank)
  const [showAI, setShowAI] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiMondaiNumber, setAiMondaiNumber] = useState<number>(1);
  const [aiMondaiTitle, setAiMondaiTitle] = useState<string>("");
  const [aiTopic, setAiTopic] = useState<string>(""); // Optional topic/theme for AI
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<
    { contentText: string; options: string[]; correctOption: number; explanation: string; passageText: string }[]
  >([]);

  // Build mondai options for the AI panel from JLPT_STRUCTURE filtered by level+section
  const aiMondaiOptions = useMemo(() => {
    if (!level || !section) return [];
    const sectionConfs = JLPT_STRUCTURE[level as JLPTLevel] ?? [];
    const matched: { number: number; title: string }[] = [];
    for (const sec of sectionConfs) {
      if (sec.sectionKeys.includes(section as SectionKey)) {
        for (const m of sec.mondai) {
          matched.push({ number: m.number, title: m.title });
        }
      }
    }
    return matched;
  }, [level, section]);

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
      toast.error("Level, Section và Nội dung câu hỏi là bắt buộc");
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
      toast.error("Lưu câu hỏi ngân hàng thất bại");
    }
  };

  const handleDelete = async (item: QuestionBankItem) => {
    if (!confirm("Xóa câu hỏi này khỏi ngân hàng?")) return;
    try {
      await deleteItem(item.id).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Xóa câu hỏi ngân hàng thất bại");
    }
  };

  const handleAudioUpload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadAudio(fd).unwrap();
      setForm((f) => ({ ...f, audioMediaId: result.id }));
      toast.success("Upload audio thành công");
    } catch (e) {
      console.error(e);
      toast.error("Upload audio thất bại");
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd).unwrap();
      setForm((f) => ({ ...f, imageMediaId: result.id }));
      toast.success("Upload ảnh thành công");
    } catch (e) {
      console.error(e);
      toast.error("Upload ảnh thất bại");
    }
  };

  const handlePreviewImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await previewImportExcel(fd).unwrap();
      
      setImportFile(file);
      setImportPreview(res.previewRows || []);
      setImportErrors(res.errors || []);
      
      const detectedErrors = res.errors?.length ?? 0;
      if (detectedErrors > 0) {
        // Each row can contain multiple validation errors (e.g. thiếu level + thiếu section),
        // so show both "error detections" and "affected rows" to avoid confusing mismatch.
        const uniqueErrorRows = new Set(
          (res.errors || [])
            .map((err) => {
              const match = err.match(/row\s+(\d+)/i);
              return match?.[1] ?? null;
            })
            .filter(Boolean),
        ).size;

        const rowsText = uniqueErrorRows > 0 ? `, trên ${uniqueErrorRows} dòng` : "";
        toast.warning(`Cảnh báo: Phát hiện ${detectedErrors} lỗi${rowsText} trong file Excel. Vui lòng xem chi tiết!`);
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.data?.message || error?.message || "Preview lỗi";
      toast.error(`Lỗi preview: ${errMsg}`);
      setImportFile(null);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const cancelImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
  };

  const confirmImport = async () => {
    if (!importFile) return;
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await importExcel(fd).unwrap();
      
      toast.success(`Import thành công ${res.success} câu hỏi vào ngân hàng!`);
      cancelImport();
      refetch();
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.data?.message || error?.message || "Lưu import lỗi";
      toast.error(`Lỗi lưu: ${errMsg}`);
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
          topic: aiTopic.trim() || undefined,
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

      const payloads: CreateQuestionBankItemDTO[] = aiPreview.map((q, i) => {
        // Sanitize options: ensure it's a valid JSON array string
        let optionsStr: string;
        if (Array.isArray(q.options)) {
          optionsStr = JSON.stringify(q.options);
        } else if (typeof q.options === "string") {
          optionsStr = q.options;
        } else {
          optionsStr = "[]";
        }

        // Sanitize correctOption: must be >= 1
        const correctOpt = typeof q.correctOption === "number" && q.correctOption >= 1
          ? q.correctOption
          : 1;

        // Sanitize contentText: must not be blank
        const content = (q.contentText || "").trim() || `Câu hỏi ${i + 1}`;

        return {
          level,
          section,
          difficulty: "MEDIUM",
          mondaiNumber: aiMondaiNumber,
          mondaiTitle: aiMondaiTitle || undefined,
          passageText: q.passageText || undefined,
          contentText: content,
          options: optionsStr,
          correctOption: correctOpt,
          explanation: q.explanation || undefined,
          points: 1.0,
          tags: [baseTags.join(","), extraTag, aiTopic.trim() ? `chủ đề:${aiTopic.trim()}` : ""].filter(Boolean).join(","),
        };
      });
      await bulkCreate(payloads).unwrap();
      toast.success(`Đã lưu ${payloads.length} câu hỏi AI vào ngân hàng`);
      setAiPreview([]);
      refetch();
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.data?.message || e?.message || "Lưu câu hỏi AI vào ngân hàng thất bại";
      toast.error(`Lỗi: ${errMsg}`);
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
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx"
            onChange={handlePreviewImport}
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPreviewing || isImporting}>
            {(isPreviewing || isImporting) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Import Excel
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Excel Import Preview */}
      {(importFile || importPreview.length > 0 || importErrors.length > 0) && (
        <div className="border rounded-md bg-accent/50 p-4 space-y-4 shadow-sm border-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                Preview Import Excel: {importFile?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={cancelImport}>Hủy</Button>
              <Button size="sm" onClick={confirmImport} disabled={isImporting || importPreview.length === 0}>
                {isImporting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Duyệt & Lưu ({importPreview.length} câu)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">✅ Hợp lệ ({importPreview.length} câu):</p>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {importPreview.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Không có dòng nào hợp lệ.</p>
                ) : (
                  importPreview.map((row, idx) => (
                    <div key={idx} className="border bg-background rounded p-2 text-xs">
                      <div className="flex gap-2 mb-1">
                        <span className="font-semibold bg-muted px-1 rounded">{row.level}</span>
                        <span className="font-semibold bg-muted px-1 rounded">{row.section}</span>
                      </div>
                      <p className="line-clamp-2">{row.contentText}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">❌ Lỗi ({importErrors.length} phát hiện):</p>
              <div className="max-h-[300px] overflow-y-auto pr-2">
                {importErrors.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Không tìm thấy lỗi.</p>
                ) : (
                  <ul className="list-disc pl-4 text-xs text-red-600 dark:text-red-400 space-y-1">
                    {importErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            {/* Mondai selector — driven by JLPT_STRUCTURE for the chosen level+section */}
            {aiMondaiOptions.length > 0 ? (
              <div className="space-y-1">
                <Label className="text-xs">Chọn loại câu hỏi (Mondai)</Label>
                <Select
                  value={String(aiMondaiNumber)}
                  onValueChange={(v) => {
                    const num = Number(v);
                    setAiMondaiNumber(num);
                    const found = aiMondaiOptions.find((m) => m.number === num);
                    setAiMondaiTitle(found?.title ?? "");
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Chọn mondai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {aiMondaiOptions.map((m) => (
                      <SelectItem key={m.number} value={String(m.number)}>
                        問{m.number} — {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Mondai {aiMondaiNumber}: {aiMondaiTitle || "(chưa chọn)"}
                </p>
              </div>
            ) : (
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
                  <Label className="text-xs">Mondai title</Label>
                  <Input
                    value={aiMondaiTitle}
                    onChange={(e) => setAiMondaiTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
            {/* Topic / Theme input */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                Chủ đề tạo câu hỏi
                <span className="text-[10px] text-muted-foreground font-normal">(tuỳ chọn)</span>
              </Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="VD: hải sản, đất nước, giao thông, ẩm thực, trường học..."
                className="h-9 text-xs"
              />
              {aiTopic.trim() && (
                <p className="text-[10px] text-purple-600 dark:text-purple-400">
                  ✨ AI sẽ tạo câu hỏi theo chủ đề: <span className="font-semibold">{aiTopic.trim()}</span>
                </p>
              )}
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
                      <div className="mb-2 whitespace-pre-wrap rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2 text-blue-900 dark:text-blue-200">
                        {q.passageText}
                      </div>
                    ) : null}
                    <p className="font-medium mb-2 whitespace-pre-wrap text-foreground">{q.contentText}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options?.map((opt, i) => (
                        <div key={i} className={`rounded border px-2 py-1 text-foreground ${
                          i + 1 === q.correctOption
                            ? "border-green-400 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 font-semibold"
                            : "bg-muted border-border"
                        }`}>
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
          <Select value={level} onValueChange={(v: Level) => {
            setLevel(v);
            setPage(0);
            setAiPreview([]);
            // Reset mondai to first valid option for new level+section
            const sectionConfs = JLPT_STRUCTURE[v as JLPTLevel] ?? [];
            for (const sec of sectionConfs) {
              if (!section || sec.sectionKeys.includes(section as SectionKey)) {
                if (sec.mondai[0]) {
                  setAiMondaiNumber(sec.mondai[0].number);
                  setAiMondaiTitle(sec.mondai[0].title);
                }
                break;
              }
            }
          }}>
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
          <Select value={section} onValueChange={(v: Section) => {
            setSection(v);
            setPage(0);
            setAiPreview([]);
            // Reset mondai to first valid option for new section
            if (level) {
              const sectionConfs = JLPT_STRUCTURE[level as JLPTLevel] ?? [];
              for (const sec of sectionConfs) {
                if (sec.sectionKeys.includes(v as SectionKey)) {
                  if (sec.mondai[0]) {
                    setAiMondaiNumber(sec.mondai[0].number);
                    setAiMondaiTitle(sec.mondai[0].title);
                  }
                  break;
                }
              }
            }
          }}>
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

