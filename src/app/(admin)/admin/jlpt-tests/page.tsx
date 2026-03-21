"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetAllTestsQuery,
  useGetAllTestsStatsQuery,
  useDeleteTestMutation,
  useUpdateTestMutation,
  useCreateTestMutation,
  useAddQuestionMutation,
  useAttachQuestionBankItemToTestMutation,
  useGetTestByIdQuery,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  BarChart3,
  BookOpen,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getStructureForTestType,
  getQuestionNumbers,
  type JLPTLevel,
  type SectionKey,
  type MondaiConfig,
} from "@/lib/jlpt-structure";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { CreateQuestionDTO, JlptQuestionAdmin, QuestionBankItem } from "@/store/services/adminJlptApi";

// ─── Level color map ──────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  N1: "bg-red-500",
  N2: "bg-orange-500",
  N3: "bg-yellow-500",
  N4: "bg-blue-500",
  N5: "bg-green-500",
};

const INITIAL_FORM = {
  title: "",
  level: "N3" as "N5" | "N4" | "N3" | "N2" | "N1",
  testType: "full_test" as
    | "full_test"
    | "vocabulary_grammar"
    | "reading"
    | "listening",
  description: "",
  duration: 120,
  totalQuestions: 0,
  passScore: 90,
  languageKnowledgePassScore: 19,
  readingPassScore: 19,
  listeningPassScore: 19,
};

export default function AdminJLPTTestsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("JLPT_CREATE");
  const canEdit = hasPermission("JLPT_EDIT");
  const canDelete = hasPermission("JLPT_DELETE");

  // ── Queries & mutations ──────────────────────────────────────────────────────
  const { data, isLoading, error } = useGetAllTestsQuery({
    page,
    size: pageSize,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { data: allTests = [] } = useGetAllTestsStatsQuery();
  const [deleteTest] = useDeleteTestMutation();
  const [createTest, { isLoading: isCreating }] = useCreateTestMutation();
  const [addQuestion] = useAddQuestionMutation();
  const [attachQuestionBankItemToTest] =
    useAttachQuestionBankItemToTestMutation();

  // ── Create/Edit form state ─────────────────────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [autoGenerateWithAI, setAutoGenerateWithAI] = useState(false);
  const [autoGenerateWithBank, setAutoGenerateWithBank] = useState(false);
  const [generatingFromBank, setGeneratingFromBank] = useState(false);
  const [generatingWithAI, setGeneratingWithAI] = useState(false);

  const [updateTest, { isLoading: isUpdating }] = useUpdateTestMutation();
  const [updateQuestion, updateQuestionState] = useUpdateQuestionMutation();
  const [deleteQuestion, deleteQuestionState] = useDeleteQuestionMutation();

  // ── Preview/review state (tree Mondai) ───────────────────────────────
  const [previewTestId, setPreviewTestId] = useState<number | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null,
  );
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const [draftContentText, setDraftContentText] = useState("");
  const [draftOptions, setDraftOptions] = useState("");
  const [draftCorrectOption, setDraftCorrectOption] = useState<number | undefined>(
    undefined,
  );
  const [draftExplanation, setDraftExplanation] = useState("");

  const {
    data: previewTest,
    isLoading: isPreviewLoading,
    isFetching: isPreviewFetching,
  } = useGetTestByIdQuery(previewTestId ?? 0, {
    skip: previewTestId == null,
  });

  const openCreateForm = () => {
    setEditingTestId(null);
    setFormData(INITIAL_FORM);
    setAutoGenerateWithAI(false);
    setAutoGenerateWithBank(false);
    setShowCreateForm(true);
  };

  const openEditForm = (test: any) => {
    setEditingTestId(test.id);
    setFormData({
      title: test.title || "",
      level: test.level || "N3",
      testType: test.testType || "full_test",
      description: test.description || "",
      duration: test.duration || 120,
      totalQuestions: test.totalQuestions || 0,
      passScore: test.passScore || 90,
      languageKnowledgePassScore: test.languageKnowledgePassScore || 19,
      readingPassScore: test.readingPassScore || 19,
      listeningPassScore: test.listeningPassScore || 19,
    });
    setAutoGenerateWithBank(false);
    setAutoGenerateWithAI(false);
    setShowCreateForm(true);
  };

  const closeForm = () => {
    setShowCreateForm(false);
    setEditingTestId(null);
    setFormData(INITIAL_FORM);
    setAutoGenerateWithAI(false);
    setAutoGenerateWithBank(false);
    setPreviewTestId(null);
    setSelectedQuestionId(null);
    setReviewConfirmed(false);
  };

  interface MondaiNode {
    parent: JlptQuestionAdmin | null;
    children: Record<number, JlptQuestionAdmin>;
  }

  type QuestionsMap = Record<number, MondaiNode>;

  function buildQuestionsMap(questions: JlptQuestionAdmin[]): QuestionsMap {
    const map: QuestionsMap = {};
    for (const q of questions) {
      if (!map[q.mondaiNumber]) map[q.mondaiNumber] = { parent: null, children: {} };

      if (q.parentId == null) {
        if (q.children && q.children.length > 0) {
          map[q.mondaiNumber].parent = q;
          for (const child of q.children) {
            map[q.mondaiNumber].children[child.questionOrder] = child;
          }
        } else {
          if (q.options != null || q.correctOption != null) {
            map[q.mondaiNumber].children[q.questionOrder] = q;
          } else {
            map[q.mondaiNumber].parent = q;
          }
        }
      }
    }
    return map;
  }

  const flatPreviewQuestions = useMemo(() => {
    const parents = previewTest?.questions ?? [];
    const out: JlptQuestionAdmin[] = [];
    for (const p of parents) {
      out.push(p);
      const children = p.children ?? [];
      for (const c of children) out.push(c);
    }
    return out;
  }, [previewTest]);

  const selectedQuestion = useMemo(() => {
    if (selectedQuestionId == null) return null;
    return (
      flatPreviewQuestions.find((q) => q.id === selectedQuestionId) ?? null
    );
  }, [flatPreviewQuestions, selectedQuestionId]);
  const selectedMondaiNumber = selectedQuestion?.mondaiNumber ?? null;
  const shouldRequireReviewConfirm = previewTestId != null;

  const structure = useMemo(() => {
    const level = formData.level as JLPTLevel | undefined;
    const testType = formData.testType as string | undefined;
    if (!level || !testType) return [];
    return getStructureForTestType(level, testType);
  }, [formData.level, formData.testType]);

  const questionsMap = useMemo<QuestionsMap>(() => {
    const parents = previewTest?.questions ?? [];
    return parents.length > 0 ? buildQuestionsMap(parents) : {};
  }, [previewTest]);

  const mondaiConfigs = useMemo(() => {
    const map = new Map<number, MondaiConfig>();
    for (const section of structure) {
      for (const mondai of section.mondai) {
        if (!map.has(mondai.number)) map.set(mondai.number, mondai);
      }
    }
    return Array.from(map.values());
  }, [structure]);

  useEffect(() => {
    if (previewTestId == null) return;
    if (selectedQuestionId != null) return;
    if (flatPreviewQuestions.length === 0) return;
    setSelectedQuestionId(flatPreviewQuestions[0].id);
  }, [previewTestId, flatPreviewQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) return;
    setDraftContentText(selectedQuestion.contentText ?? "");

    const opts = selectedQuestion.options;
    if (Array.isArray(opts)) setDraftOptions(JSON.stringify(opts));
    else if (typeof opts === "string") setDraftOptions(opts);
    else setDraftOptions("");

    setDraftCorrectOption(selectedQuestion.correctOption ?? undefined);
    setDraftExplanation(selectedQuestion.explanation ?? "");
  }, [selectedQuestion]);

  const generateQuestionsFromBank = async (testId: number) => {
    const token = getAccessToken();
    if (!token) throw new Error("Chưa đăng nhập hoặc không có access token.");

    const level = formData.level as JLPTLevel;
    const testType = formData.testType as string;
    const structure = getStructureForTestType(level, testType);

    const shouldIncludeMondai = (mondai: any) => {
      if (testType === "full_test") return true;
      if (testType === "vocabulary_grammar") return !mondai.requires_passage;
      if (testType === "reading") return mondai.requires_passage;
      if (testType === "listening") return mondai.requires_audio;
      return true;
    };

    for (const section of structure) {
      const sectionKey = section.sectionKeys[0] as SectionKey;
      for (const mondai of section.mondai) {
        if (!shouldIncludeMondai(mondai)) continue;

        const nums = getQuestionNumbers(mondai);
        const count = nums.length;
        const extra = mondai.requires_passage ? 1 : 0;
        const pageSizeLocal = count + extra;

        const params = new URLSearchParams({
          level,
          section: sectionKey,
          mondaiNumber: String(mondai.number),
          page: "0",
          size: String(pageSizeLocal),
        });

        const bankRes = await fetch(
          `${API_CONFIG.BASE_URL}/jlpt-question-bank?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language":
                localStorage.getItem("i18nextLng") || "vi",
            },
            credentials: "include",
          },
        );

        if (!bankRes.ok) {
          const bankJson = await bankRes.json().catch(() => ({}));
          throw new Error(bankJson?.message || bankRes.statusText);
        }

        const bankJson = await bankRes.json();
        const items = (bankJson?.data?.content ?? []) as QuestionBankItem[];
        const sorted = [...items].sort((a, b) => a.id - b.id);

        if (mondai.requires_passage) {
          const parentItem =
            sorted.find((i) => (i.passageText ?? "").trim().length > 0) ??
            sorted[0];
          if (!parentItem) continue;

          const parentCreated = await attachQuestionBankItemToTest({
            bankItemId: parentItem.id,
            testId,
            section: sectionKey,
            questionOrder: mondai.start - 1,
            mondaiNumber: mondai.number,
            mondaiTitle: mondai.title,
            parentQuestionId: null,
          }).unwrap();

          const childrenCandidates = sorted.filter(
            (i) => i.id !== parentItem.id,
          );

          for (
            let i = 0;
            i < count && i < childrenCandidates.length;
            i++
          ) {
            const q = childrenCandidates[i];
            await attachQuestionBankItemToTest({
              bankItemId: q.id,
              testId,
              section: sectionKey,
              questionOrder: nums[i],
              mondaiNumber: mondai.number,
              mondaiTitle: mondai.title,
              parentQuestionId: parentCreated.id,
            }).unwrap();
          }
        } else {
          const selected = sorted.slice(0, count);
          for (let i = 0; i < selected.length; i++) {
            const q = selected[i];
            await attachQuestionBankItemToTest({
              bankItemId: q.id,
              testId,
              section: sectionKey,
              questionOrder: nums[i],
              mondaiNumber: mondai.number,
              mondaiTitle: mondai.title,
              parentQuestionId: null,
            }).unwrap();
          }
        }
      }
    }
  };

  const updateField = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value);
    if (!isNaN(numValue)) updateField(field, numValue);
  };

  const generateQuestionsWithAI = async (testId: number) => {
    const level = formData.level as JLPTLevel;
    const testType = formData.testType as string;
    const structure = getStructureForTestType(level, testType);

    for (const section of structure) {
      const sectionKey = section.sectionKeys[0] as SectionKey;
      for (const mondai of section.mondai) {
        const nums = getQuestionNumbers(mondai);
        const count = nums.length;

        const aiRes = await fetch("/api/ai/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            level,
            section: sectionKey,
            count,
            mondaiNumber: mondai.number,
            mondaiTitle: mondai.title,
            testType,
          }),
        });
        const aiJson = await aiRes.json();
        if (!aiRes.ok) {
          throw new Error(aiJson.error || "AI generate failed");
        }

        const questions = (aiJson.questions || []) as {
          contentText: string;
          options: string[];
          correctOption: number;
          explanation: string;
          passageText: string;
        }[];

        let parentId: number | null = null;
        const first = questions[0];
        if (mondai.requires_passage && first?.passageText) {
          const parentPayload: CreateQuestionDTO = {
            mondaiNumber: mondai.number,
            mondaiTitle: mondai.title,
            parentId: null,
            questionOrder: mondai.start - 1,
            section: sectionKey as any,
            contentText: first.passageText,
          };
          const createdParent = await addQuestion({
            testId,
            data: parentPayload,
          }).unwrap();
          parentId = createdParent.id;
        }

        for (let i = 0; i < questions.length && i < nums.length; i++) {
          const q = questions[i];
          const payload: CreateQuestionDTO = {
            mondaiNumber: mondai.number,
            mondaiTitle: mondai.title,
            parentId: mondai.requires_passage ? parentId : null,
            questionOrder: nums[i],
            section: sectionKey as any,
            contentText: q.contentText,
            options: JSON.stringify(q.options) as any,
            correctOption: q.correctOption,
            explanation: q.explanation || undefined,
            points: 1.0,
          };
          await addQuestion({ testId, data: payload }).unwrap();
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTestId) {
        await updateTest({ id: editingTestId, data: formData }).unwrap();
        alert("Cập nhật đề thi thành công!");
        closeForm();
      } else {
        const result = await createTest(formData).unwrap();
        if (autoGenerateWithBank) {
          setGeneratingFromBank(true);
          try {
            await generateQuestionsFromBank(result.id);
          } finally {
            setGeneratingFromBank(false);
          }
          // Keep modal open and show review panel on the right
          setPreviewTestId(result.id);
          setSelectedQuestionId(null);
          setReviewConfirmed(false);
          return;
        }
        if (autoGenerateWithAI) {
          setGeneratingWithAI(true);
          try {
            await generateQuestionsWithAI(result.id);
          } finally {
            setGeneratingWithAI(false);
          }
          setPreviewTestId(result.id);
          setSelectedQuestionId(null);
          setReviewConfirmed(false);
          return;
        }
        closeForm();
        router.push(`/admin/jlpt-tests/${result.id}/questions`);
      }
    } catch (err) {
      alert(editingTestId ? "Cập nhật thất bại!" : "Tạo đề thi thất bại!");
      console.error(err);
    }
  };

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!allTests.length) return null;
    const totalAttempts = allTests.reduce(
      (s, t) => s + (t.attemptCount || 0),
      0,
    );
    const publishedCount = allTests.filter((t) => t.isPublished).length;
    const draftCount = allTests.length - publishedCount;

    const levelAttempts: Record<string, number> = {};
    const levelCount: Record<string, number> = {};
    allTests.forEach((t) => {
      levelAttempts[t.level] =
        (levelAttempts[t.level] || 0) + (t.attemptCount || 0);
      levelCount[t.level] = (levelCount[t.level] || 0) + 1;
    });
    const mostPopular = Object.entries(levelAttempts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      total: allTests.length,
      totalAttempts,
      publishedCount,
      draftCount,
      levelAttempts,
      levelCount,
      mostPopularLevel: mostPopular?.[0] ?? "—",
      mostPopularLevelAttempts: mostPopular?.[1] ?? 0,
    };
  }, [allTests]);

  const tests = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Xác nhận xóa đề thi: "${title}"?`)) {
      try {
        await deleteTest(id).unwrap();
        alert("Xóa đề thi thành công!");
      } catch {
        alert("Xóa thất bại!");
      }
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await updateTest({ id, data: { isPublished: !currentStatus } }).unwrap();
    } catch {
      alert("Cập nhật thất bại!");
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JLPT Tests</h1>
          <p className="text-muted-foreground">Quản lý đề thi JLPT</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/admin/jlpt-question-bank">
              Quản lý ngân hàng câu hỏi
            </Link>
          </Button>
          {canCreate && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo đề thi mới
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          INLINE CREATE FORM — slides in over the page content
      ══════════════════════════════════════════════════════════════════════ */}
      {showCreateForm && (
        <>
          {/* Backdrop — blurs and dims everything below the form */}
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={closeForm}
          />

          {/* Form panel — scrollable overlay */}
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="flex min-h-full items-start justify-center px-4 py-10">
              <div
                className={`w-full pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 ${
                  previewTestId ? "max-w-7xl" : "max-w-2xl"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`grid gap-4 items-start ${
                    previewTestId ? "lg:grid-cols-[1fr_420px]" : "grid-cols-1"
                  }`}
                >
                  <form onSubmit={handleSubmit}>
                    <Card className="shadow-2xl border-border">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                      <div>
                        <CardTitle className="text-xl">
                          {editingTestId
                            ? "Chỉnh sửa đề thi JLPT"
                            : "Tạo đề thi JLPT mới"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {editingTestId
                            ? "Cập nhật thông tin của đề thi"
                            : "Điền thông tin cơ bản của đề thi"}
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={closeForm}
                        className="shrink-0 -mt-1 -mr-1"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="title">Tiêu đề *</Label>
                        <Input
                          id="title"
                          placeholder="VD: JLPT N3 Tháng 7/2024"
                          value={formData.title}
                          onChange={(e) => updateField("title", e.target.value)}
                          required
                        />
                      </div>

                      {/* Level & Test Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="level">Cấp độ *</Label>
                          <Select
                            value={formData.level}
                            onValueChange={(v) => updateField("level", v)}
                          >
                            <SelectTrigger id="level">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="testType">Loại đề thi *</Label>
                          <Select
                            value={formData.testType}
                            onValueChange={(v) => updateField("testType", v)}
                          >
                            <SelectTrigger id="testType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_test">
                                Full Test (Đề thi đầy đủ)
                              </SelectItem>
                              <SelectItem value="vocabulary_grammar">
                                Từ vựng &amp; Ngữ pháp (言語知識)
                              </SelectItem>
                              <SelectItem value="reading">
                                Đọc hiểu (読解)
                              </SelectItem>
                              <SelectItem value="listening">
                                Nghe hiểu (聴解)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowCreateForm(false)}
                          className="shrink-0 -mt-1 -mr-1"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Duration — full width now that totalQuestions is removed */}
                      <div className="space-y-2">
                        <Label htmlFor="duration">Thời gian (phút) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={formData.duration || ""}
                          onChange={(e) =>
                            handleNumberChange("duration", e.target.value)
                          }
                          required
                        />
                      </div>

                      {/* Pass Scores — adaptive per testType */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="description">Mô tả</Label>
                          <Textarea
                            id="description"
                            placeholder="Mô tả ngắn về đề thi này..."
                            rows={2}
                            value={formData.description}
                            onChange={(e) =>
                              updateField("description", e.target.value)
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {formData.testType === "full_test"
                              ? "Thường là 90–100"
                              : "Điểm tối thiểu để đỗ phần thi này"}
                          </p>
                        </div>

                        {/* full_test: hiện cả 3 mục liệt */}
                        {formData.testType === "full_test" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="langPass">Liệt ngôn ngữ</Label>
                                <Input
                                  id="langPass"
                                  type="number"
                                  min="0"
                                  value={
                                    formData.languageKnowledgePassScore || ""
                                  }
                                  onChange={(e) =>
                                    handleNumberChange(
                                      "languageKnowledgePassScore",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="readPass">Liệt đọc</Label>
                                <Input
                                  id="readPass"
                                  type="number"
                                  min="0"
                                  value={formData.readingPassScore || ""}
                                  onChange={(e) =>
                                    handleNumberChange(
                                      "readingPassScore",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="listenPass">Liệt nghe</Label>
                                <Input
                                  id="listenPass"
                                  type="number"
                                  min="0"
                                  value={formData.listeningPassScore || ""}
                                  onChange={(e) =>
                                    handleNumberChange(
                                      "listeningPassScore",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Điểm tối thiểu mỗi phần (thường là 19). Nếu thấp
                              hơn sẽ trượt dù tổng điểm cao.
                            </p>
                          </div>
                        )}

                        {/* vocabulary_grammar: chỉ hiện liệt ngôn ngữ */}
                        {formData.testType === "vocabulary_grammar" && (
                          <div className="space-y-2">
                            <Label htmlFor="langPass">
                              Liệt ngôn ngữ (Từ vựng &amp; Ngữ pháp)
                            </Label>
                            <Input
                              id="langPass"
                              type="number"
                              min="0"
                              value={formData.languageKnowledgePassScore || ""}
                              onChange={(e) =>
                                handleNumberChange(
                                  "languageKnowledgePassScore",
                                  e.target.value,
                                )
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Điểm tối thiểu phần ngôn ngữ (thường là 19)
                            </p>
                          </div>
                        )}

                        {/* reading: chỉ hiện liệt đọc */}
                        {formData.testType === "reading" && (
                          <div className="space-y-2">
                            <Label htmlFor="readPass">
                              Liệt đọc (phần đọc hiểu)
                            </Label>
                            <Input
                              id="readPass"
                              type="number"
                              min="0"
                              value={formData.readingPassScore || ""}
                              onChange={(e) =>
                                handleNumberChange(
                                  "readingPassScore",
                                  e.target.value,
                                )
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Điểm tối thiểu phần đọc (thường là 19)
                            </p>
                          </div>
                        )}

                        {/* listening: chỉ hiện liệt nghe */}
                        {formData.testType === "listening" && (
                          <div className="space-y-2">
                            <Label htmlFor="listenPass">
                              Liệt nghe (phần nghe hiểu)
                            </Label>
                            <Input
                              id="listenPass"
                              type="number"
                              min="0"
                              value={formData.listeningPassScore || ""}
                              onChange={(e) =>
                                handleNumberChange(
                                  "listeningPassScore",
                                  e.target.value,
                                )
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Điểm tối thiểu phần nghe (thường là 19)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        {!editingTestId && (
                          <>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={autoGenerateWithAI}
                                onChange={(e) => {
                                  const next = e.target.checked;
                                  setAutoGenerateWithAI(next);
                                  if (next) setAutoGenerateWithBank(false);
                                }}
                              />
                              Tạo full câu hỏi bằng AI theo cấp độ đã chọn
                            </label>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={autoGenerateWithBank}
                                onChange={(e) => {
                                  const next = e.target.checked;
                                  setAutoGenerateWithBank(next);
                                  if (next) setAutoGenerateWithAI(false);
                                }}
                              />
                              Lấy câu hỏi từ ngân hàng đề thi
                            </label>
                          </>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={
                            isCreating ||
                            isUpdating ||
                            generatingFromBank ||
                            generatingWithAI
                          }
                        >
                          {editingTestId
                            ? isUpdating
                              ? "Đang cập nhật..."
                              : "Lưu thay đổi"
                            : isCreating || generatingFromBank || generatingWithAI
                              ? "Đang tạo..."
                              : "Tạo đề thi và thêm câu hỏi"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeForm}
                        >
                          Hủy
                        </Button>
                      </div>
                    </CardContent>
                    </Card>
                  </form>

                  {previewTestId ? (
                    <Card className="shadow-2xl border-border overflow-hidden lg:sticky lg:top-4">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Review câu hỏi đã tạo
                        </CardTitle>
                        <CardDescription>
                          {isPreviewLoading
                            ? "Đang tải..."
                            : `Test ID: ${previewTestId} • ${flatPreviewQuestions.length} câu`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-md border">
                          <ScrollArea className="h-[320px]">
                            <div className="space-y-3 p-2">
                              {isPreviewLoading || isPreviewFetching ? (
                                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Đang tải cây Mondai...
                                </div>
                              ) : flatPreviewQuestions.length === 0 ||
                                mondaiConfigs.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Chưa có câu hỏi nào.
                                </div>
                              ) : (
                                mondaiConfigs.map((mondai) => {
                                  const node = questionsMap[mondai.number];
                                  if (!node) return null;

                                  const open =
                                    selectedMondaiNumber === mondai.number;
                                  const expected =
                                    getQuestionNumbers(mondai).length;
                                  const filled = Object.keys(
                                    node.children ?? {},
                                  ).length;

                                  return (
                                    <details
                                      key={mondai.number}
                                      open={open}
                                      className={`rounded-md border p-2 ${
                                        open
                                          ? "border-primary/40 bg-muted/30"
                                          : "border-border"
                                      }`}
                                    >
                                      <summary className="list-none cursor-pointer select-none">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="default"
                                            className="text-[10px]"
                                          >
                                            問{mondai.number}
                                          </Badge>
                                          <div className="min-w-0">
                                            <div className="text-xs font-medium truncate">
                                              {mondai.title}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                              {filled}/{expected} câu
                                            </div>
                                          </div>
                                        </div>
                                      </summary>
                                      <div className="mt-2 space-y-1">
                                        {getQuestionNumbers(mondai).map(
                                          (qNum) => {
                                            const child =
                                              node.children?.[qNum];
                                            if (!child) return null;
                                            return (
                                              <button
                                                key={qNum}
                                                type="button"
                                                className={`w-full text-left rounded border px-2 py-1 text-xs ${
                                                  child.id === selectedQuestionId
                                                    ? "border-primary/50 bg-background"
                                                    : "border-border hover:bg-muted/30"
                                                }`}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  setSelectedQuestionId(child.id);
                                                }}
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="font-medium">
                                                    Câu {qNum}
                                                  </span>
                                                  <span className="text-[10px] text-muted-foreground">
                                                    #{child.id}
                                                  </span>
                                                </div>
                                                <div className="mt-1 text-[10px] line-clamp-2 text-muted-foreground">
                                                  {child.contentText}
                                                </div>
                                              </button>
                                            );
                                          },
                                        )}
                                      </div>
                                    </details>
                                  );
                                })
                              )}
                            </div>
                          </ScrollArea>
                        </div>

                        <div className="rounded-md border p-3 space-y-3">
                          {selectedQuestion ? (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="text-sm font-semibold">
                                    Edit câu #{selectedQuestion.id}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Mondai {selectedQuestion.mondaiNumber} •
                                    Order {selectedQuestion.questionOrder}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/admin/jlpt-tests/${previewTestId}/questions`,
                                    )
                                  }
                                  disabled={
                                    shouldRequireReviewConfirm &&
                                    !reviewConfirmed
                                  }
                                >
                                  Đồng ý & chuyển trang{" "}
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>

                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={reviewConfirmed}
                                  onChange={(e) =>
                                    setReviewConfirmed(e.target.checked)
                                  }
                                />
                                Đã review xong, cho phép chuyển trang câu hỏi
                              </label>

                              <div className="space-y-2">
                                <Label>Nội dung (contentText)</Label>
                                <Textarea
                                  value={draftContentText}
                                  onChange={(e) =>
                                    setDraftContentText(e.target.value)
                                  }
                                  rows={4}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Options (JSON string)</Label>
                                <Textarea
                                  value={draftOptions}
                                  onChange={(e) => setDraftOptions(e.target.value)}
                                  rows={3}
                                  placeholder='["a","b","c","d"]'
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Correct option</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={4}
                                    value={draftCorrectOption ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v === "") setDraftCorrectOption(undefined);
                                      else setDraftCorrectOption(Number(v));
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Explanation</Label>
                                  <Input
                                    value={draftExplanation}
                                    onChange={(e) =>
                                      setDraftExplanation(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  onClick={async () => {
                                    if (!selectedQuestion) return;
                                    try {
                                      await updateQuestion({
                                        id: selectedQuestion.id,
                                        data: {
                                          contentText: draftContentText,
                                          options: draftOptions,
                                          correctOption: draftCorrectOption,
                                          explanation: draftExplanation,
                                        },
                                      }).unwrap();
                                      alert("Đã lưu câu hỏi!");
                                    } catch (err: any) {
                                      alert(err?.message || "Lưu thất bại");
                                    }
                                  }}
                                  disabled={updateQuestionState.isLoading}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Lưu
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={async () => {
                                    if (!selectedQuestion) return;
                                    if (!confirm("Xóa câu hỏi này khỏi đề?")) return;
                                    try {
                                      await deleteQuestion(
                                        selectedQuestion.id,
                                      ).unwrap();
                                      setSelectedQuestionId(null);
                                      alert("Đã xóa câu hỏi!");
                                    } catch (err: any) {
                                      alert(err?.message || "Xóa thất bại");
                                    }
                                  }}
                                  disabled={deleteQuestionState.isLoading}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Xóa
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Chọn câu hỏi ở danh sách bên trên để review/sửa.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Stats Cards ── */}
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-300 ${showCreateForm ? "blur-sm opacity-50 pointer-events-none select-none" : ""}`}
      >
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Tổng đề thi</CardDescription>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">
              {stats?.total ?? data?.totalElements ?? 0}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.publishedCount ?? 0} đã xuất bản ·{" "}
              {stats?.draftCount ?? 0} nháp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Tổng lượt thi</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-blue-600">
              {stats?.totalAttempts.toLocaleString() ?? "—"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả người dùng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Level phổ biến nhất</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-purple-600">
              {stats?.mostPopularLevel ?? "—"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.mostPopularLevelAttempts.toLocaleString() ?? 0} lượt thi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Đề đã xuất bản</CardDescription>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-green-600">
              {stats?.publishedCount ?? 0}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total
                ? `${Math.round((stats.publishedCount / stats.total) * 100)}% tổng đề`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Level Distribution Bar Chart ── */}
      {stats && Object.keys(stats.levelAttempts).length > 0 && (
        <Card
          className={`transition-all duration-300 ${showCreateForm ? "blur-sm opacity-50 pointer-events-none select-none" : ""}`}
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Lượt thi theo Level
            </CardTitle>
            <CardDescription>Phân bố lượt thi toàn bộ đề thi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.levelAttempts)
                .sort((a, b) => b[1] - a[1])
                .map(([level, attempts]) => {
                  const pct =
                    stats.totalAttempts > 0
                      ? Math.round((attempts / stats.totalAttempts) * 100)
                      : 0;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-bold text-muted-foreground">
                        {level}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${LEVEL_COLORS[level] ?? "bg-slate-500"} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-28 text-right text-muted-foreground">
                        {attempts.toLocaleString()} lượt ({pct}%)
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {stats.levelCount[level]} đề
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Table ── */}
      <Card
        className={`transition-all duration-300 ${showCreateForm ? "blur-sm opacity-50 pointer-events-none select-none" : ""}`}
      >
        <CardContent className="pt-6">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải...
            </div>
          )}
          {!!error && (
            <div className="text-center py-8 text-destructive">
              Lỗi tải dữ liệu
            </div>
          )}
          {!isLoading && !error && tests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Chưa có đề thi nào</p>
              {canCreate && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo đề thi đầu tiên
                </Button>
              )}
            </div>
          )}

          {!isLoading && tests.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead className="w-[110px]">Loại đề</TableHead>
                    <TableHead className="text-center w-[80px]">
                      Câu hỏi
                    </TableHead>
                    <TableHead className="text-center w-[90px]">
                      Lượt thi
                    </TableHead>
                    <TableHead className="w-[160px]">Tỉ lệ đậu/trượt</TableHead>
                    <TableHead className="text-center w-[110px]">
                      Trạng thái
                    </TableHead>
                    <TableHead className="text-right w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => {
                    const attempts = test.attemptCount || 0;
                    const avgScore = test.averageScore || 0;
                    const passScore = test.passScore || 100;
                    const estimatedPassPct =
                      attempts === 0
                        ? 0
                        : Math.min(
                            100,
                            Math.max(
                              0,
                              Math.round((avgScore / passScore) * 60),
                            ),
                          );

                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">
                          <div>{test.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {test.duration} phút · điểm đậu: {test.passScore}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-bold text-white border-0 ${LEVEL_COLORS[test.level] ?? "bg-slate-500"}`}
                          >
                            {test.level}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm capitalize">
                            {test.testType.replace("_", " ")}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          {test.totalQuestions}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="font-semibold text-blue-600">
                            {attempts.toLocaleString()}
                          </div>
                          {avgScore > 0 && (
                            <div className="text-[11px] text-muted-foreground">
                              TB: {avgScore.toFixed(1)}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {attempts === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              Chưa có lượt thi
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${estimatedPassPct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-green-600 font-semibold w-8 text-right">
                                  ~{estimatedPassPct}%
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Ước tính · TB{" "}
                                {avgScore > 0 ? avgScore.toFixed(1) : "—"}/
                                {test.passScore}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            onClick={() =>
                              canEdit &&
                              handleTogglePublish(test.id, test.isPublished)
                            }
                            className={`inline-flex items-center gap-1 transition-opacity ${canEdit ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
                          >
                            {test.isPublished ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">
                                  Published
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-orange-500" />
                                <span className="text-xs text-orange-500 font-medium">
                                  Draft
                                </span>
                              </>
                            )}
                          </button>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/jlpt-tests/${test.id}/questions`}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Quản lý câu hỏi
                                </Link>
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/jlpt-tests/${test.id}/edit`}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    handleDelete(test.id, test.title)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
