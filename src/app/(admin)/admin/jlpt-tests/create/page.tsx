"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateTestMutation,
  useAddQuestionMutation,
  useAttachQuestionBankItemToTestMutation,
  useGetTestByIdQuery,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  type CreateQuestionDTO,
  type QuestionBankItem,
  type JlptQuestionAdmin,
} from "@/store/services/adminJlptApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Pencil, Trash2, ArrowRight } from "lucide-react";
import {
  getStructureForTestType,
  type JLPTLevel,
  type MondaiConfig,
  type SectionKey,
  getQuestionNumbers,
} from "@/lib/jlpt-structure";

export default function CreateJLPTTestPage() {
  const router = useRouter();
  const [createTest, { isLoading }] = useCreateTestMutation();
  const [addQuestion] = useAddQuestionMutation();
  const [attachQuestionBankItemToTest] = useAttachQuestionBankItemToTestMutation();
  const [updateQuestion, updateQuestionState] = useUpdateQuestionMutation();
  const [deleteQuestion, deleteQuestionState] = useDeleteQuestionMutation();

  const [formData, setFormData] = useState({
    title: "",
    level: "" as any,
    testType: "" as any,
    description: "",
    duration: 120,
    totalQuestions: 0,
    passScore: 90,
    languageKnowledgePassScore: 19,
    readingPassScore: 19,
    listeningPassScore: 19,
  });

  const [autoGenerateWithAI, setAutoGenerateWithAI] = useState(false);
  const [autoGenerateWithBank, setAutoGenerateWithBank] = useState(false);
  const [creatingQuestions, setCreatingQuestions] = useState(false);

  const searchParams = useSearchParams();
  const previewTestIdParam = searchParams.get("previewTestId");
  const previewTestId = previewTestIdParam ? Number(previewTestIdParam) : null;
  const isPreviewOnly = previewTestIdParam != null && previewTestId != null && !Number.isNaN(previewTestId);

  const [createdTestId, setCreatedTestId] = useState<number | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [creationFromBank, setCreationFromBank] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const shouldRequireReviewConfirm = creationFromBank || isPreviewOnly;

  const [draftContentText, setDraftContentText] = useState("");
  const [draftOptions, setDraftOptions] = useState("");
  const [draftCorrectOption, setDraftCorrectOption] = useState<number | undefined>(
    undefined,
  );
  const [draftExplanation, setDraftExplanation] = useState("");

  const {
    data: createdTest,
    isLoading: isCreatedTestLoading,
    isFetching: isCreatedTestFetching,
  } = useGetTestByIdQuery(createdTestId ?? 0, { skip: createdTestId == null });

  useEffect(() => {
    if (!isPreviewOnly) return;
    setCreatedTestId(previewTestId);
    setSelectedQuestionId(null);
    setCreationFromBank(true);
    setReviewConfirmed(false);
  }, [isPreviewOnly, previewTestId]);

  interface MondaiNode {
    parent: JlptQuestionAdmin | null; // passage parent (parentId=null)
    children: Record<number, JlptQuestionAdmin>; // keyed by questionOrder
  }
  type QuestionsMap = Record<number, MondaiNode>; // keyed by mondaiNumber

  function buildQuestionsMap(questions: JlptQuestionAdmin[]): QuestionsMap {
    const map: QuestionsMap = {};
    for (const q of questions) {
      if (!map[q.mondaiNumber]) map[q.mondaiNumber] = { parent: null, children: {} };

      if (q.parentId == null) {
        if (q.children && q.children.length > 0) {
          // Passage parent
          map[q.mondaiNumber].parent = q;
          for (const child of q.children) {
            map[q.mondaiNumber].children[child.questionOrder] = child;
          }
        } else {
          // Standalone leaf (options/correctOption) OR passage-only parent (no children yet)
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

  const flatQuestions = useMemo(() => {
    const parents = createdTest?.questions ?? [];
    const out: JlptQuestionAdmin[] = [];
    for (const p of parents) {
      out.push(p);
      const children = p.children ?? [];
      for (const c of children) out.push(c);
    }
    return out;
  }, [createdTest]);

  const questionsMap = useMemo<QuestionsMap>(() => {
    const parents = createdTest?.questions ?? [];
    return parents.length > 0 ? buildQuestionsMap(parents) : {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdTest?.questions]);

  const structure = useMemo(() => {
    const level = formData.level as JLPTLevel | undefined;
    const testType = formData.testType as string | undefined;
    if (!level || !testType) return [];
    return getStructureForTestType(level, testType);
  }, [formData.level, formData.testType]);

  const mondaiConfigs = useMemo<MondaiConfig[]>(() => {
    const map = new Map<number, MondaiConfig>();
    for (const section of structure) {
      for (const mondai of section.mondai) {
        if (!map.has(mondai.number)) map.set(mondai.number, mondai);
      }
    }
    return Array.from(map.values());
  }, [structure]);

  const selectedQuestion = useMemo(() => {
    if (selectedQuestionId == null) return null;
    return flatQuestions.find((q) => q.id === selectedQuestionId) ?? null;
  }, [flatQuestions, selectedQuestionId]);

  const selectedMondaiNumber = selectedQuestion?.mondaiNumber ?? null;

  useEffect(() => {
    if (createdTestId == null) return;
    if (selectedQuestionId != null) return;
    if (flatQuestions.length === 0) return;
    setSelectedQuestionId(flatQuestions[0].id);
  }, [createdTestId, flatQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) return;
    setDraftContentText(selectedQuestion.contentText ?? "");

    const opts = selectedQuestion.options;
    if (Array.isArray(opts)) setDraftOptions(JSON.stringify(opts));
    else if (typeof opts === "string") setDraftOptions(opts);
    else setDraftOptions("");

    setDraftCorrectOption(selectedQuestion.correctOption ?? undefined);
    setDraftExplanation(selectedQuestion.explanation ?? "");
  }, [selectedQuestion?.id]);

  const generateQuestionsFromBank = async (testId: number) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error("Chưa đăng nhập hoặc không có access token.");
    }

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
        const pageSize = count + extra;

        const params = new URLSearchParams({
          level,
          section: sectionKey,
          mondaiNumber: String(mondai.number),
          page: "0",
          size: String(pageSize),
        });

        const bankRes = await fetch(
          `${API_CONFIG.BASE_URL}/jlpt-question-bank?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": localStorage.getItem("i18nextLng") || "vi",
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
            sorted.find((i) => (i.passageText ?? "").trim().length > 0) ?? sorted[0];
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

          const childrenCandidates = sorted.filter((i) => i.id !== parentItem.id);
          if (childrenCandidates.length < count) {
            console.warn(
              `Mondai ${mondai.number}: thiếu câu hỏi từ ngân hàng (cần ${count}, có ${childrenCandidates.length}).`,
            );
          }

          for (let i = 0; i < count && i < childrenCandidates.length; i++) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createTest(formData).unwrap();
      if (autoGenerateWithBank) {
        setCreatingQuestions(true);
        setCreatedTestId(result.id);
        setSelectedQuestionId(null);
        setCreationFromBank(true);
        setReviewConfirmed(false);
        try {
          await generateQuestionsFromBank(result.id);
          alert("Tạo đề thi + tạo sẵn câu hỏi từ ngân hàng thành công!");
          return;
        } finally {
          setCreatingQuestions(false);
        }
      }

      if (!autoGenerateWithAI) {
        setCreationFromBank(false);
        setReviewConfirmed(false);
        alert("Tạo đề thi thành công!");
        router.push(`/admin/jlpt-tests/${result.id}/questions`);
        return;
      }

      // Auto-generate questions with AI (1-step flow)
      setCreatingQuestions(true);
      setCreationFromBank(false);
      setReviewConfirmed(false);
      try {
        const level = formData.level as JLPTLevel;
        const testType = formData.testType as string;
        const structure = getStructureForTestType(level, testType);

        for (const section of structure) {
          const sectionKey = section.sectionKeys[0] as SectionKey;
          for (const mondai of section.mondai) {
            const nums = getQuestionNumbers(mondai);
            const count = nums.length;

            // Call AI for this mondai
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
              const createdParent = await addQuestion({ testId: result.id, data: parentPayload }).unwrap();
              parentId = createdParent.id;
            }

            // Create children / standalone
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
              await addQuestion({ testId: result.id, data: payload }).unwrap();
            }
          }
        }

        alert("Tạo đề thi + sinh sẵn câu hỏi thành công! (Lưu ý: Listening cần upload audio sau)");
        router.push(`/admin/jlpt-tests/${result.id}/questions`);
      } finally {
        setCreatingQuestions(false);
      }
    } catch (err) {
      alert("Tạo đề thi thất bại!");
      console.error(err);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value);
    if (!isNaN(numValue)) {
      updateField(field, numValue);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {!isPreviewOnly && (
          <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tạo đề thi JLPT mới</h1>
            <p className="text-muted-foreground mt-2">
              Điền thông tin cơ bản của đề thi
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đề thi</CardTitle>
                <CardDescription>
                  Các thông tin cơ bản về cấu trúc và cấu hình điểm của đề thi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  onValueChange={(value) => updateField("level", value)}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Chọn cấp độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N5">N5</SelectItem>
                    <SelectItem value="N4">N4</SelectItem>
                    <SelectItem value="N3">N3</SelectItem>
                    <SelectItem value="N2">N2</SelectItem>
                    <SelectItem value="N1">N1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testType">Loại đề thi *</Label>
                <Select
                  value={formData.testType}
                  onValueChange={(value) => updateField("testType", value)}
                >
                  <SelectTrigger id="testType">
                    <SelectValue placeholder="Chọn loại đề thi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_test">Full Test</SelectItem>
                    <SelectItem value="vocabulary_grammar">Vocabulary & Grammar</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về đề thi này..."
                rows={3}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            {/* Duration & Total Questions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian (phút) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration || ""}
                  onChange={(e) => handleNumberChange("duration", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalQuestions">Tổng số câu hỏi *</Label>
                <Input
                  id="totalQuestions"
                  type="number"
                  min="1"
                  value={formData.totalQuestions || ""}
                  onChange={(e) => handleNumberChange("totalQuestions", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Có thể để 0 và cập nhật sau khi thêm câu hỏi
                </p>
              </div>
            </div>

            {/* Pass Scores */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passScore">Điểm đỗ tổng *</Label>
                <Input
                  id="passScore"
                  type="number"
                  min="1"
                  max="180"
                  value={formData.passScore || ""}
                  onChange={(e) => handleNumberChange("passScore", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Điểm tối thiểu để đỗ (thường là 90-100)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="langPass">Điểm liệt ngôn ngữ</Label>
                  <Input
                    id="langPass"
                    type="number"
                    min="0"
                    value={formData.languageKnowledgePassScore || ""}
                    onChange={(e) => handleNumberChange("languageKnowledgePassScore", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="readPass">Điểm liệt đọc</Label>
                  <Input
                    id="readPass"
                    type="number"
                    min="0"
                    value={formData.readingPassScore || ""}
                    onChange={(e) => handleNumberChange("readingPassScore", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listenPass">Điểm liệt nghe</Label>
                  <Input
                    id="listenPass"
                    type="number"
                    min="0"
                    value={formData.listeningPassScore || ""}
                    onChange={(e) => handleNumberChange("listeningPassScore", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Điểm tối thiểu mỗi phần (thường là 19). Nếu thấp hơn sẽ trượt dù tổng điểm cao.
              </p>
            </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isLoading || creatingQuestions}>
                    {isLoading || creatingQuestions ? "Đang tạo..." : "Tạo đề thi"}
                  </Button>
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
                    Sinh sẵn câu hỏi bằng AI (1 bước)
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
                    Tạo sẵn câu hỏi từ ngân hàng (1 bước)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
          </div>
        )}

        <div className="space-y-3">
          {createdTestId ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Review câu hỏi đã tạo</CardTitle>
                <CardDescription>
                  {isCreatedTestLoading
                    ? "Đang tải..."
                    : `Test ID: ${createdTestId} • ${flatQuestions.length} câu`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border">
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3 p-2">
                      {isCreatedTestLoading || isCreatedTestFetching ? (
                        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải cây Mondai...
                        </div>
                      ) : flatQuestions.length === 0 || mondaiConfigs.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Chưa có câu hỏi nào.
                        </div>
                      ) : (
                        mondaiConfigs.map((mondai) => {
                          const node = questionsMap[mondai.number];
                          if (!node) return null;

                          const open = selectedMondaiNumber === mondai.number;
                          const expected = getQuestionNumbers(mondai).length;
                          const filled = Object.keys(node.children ?? {}).length;

                          return (
                            <details
                              key={mondai.number}
                              open={open}
                              className={`rounded-md border p-2 ${
                                open ? "border-primary/40 bg-muted/30" : "border-border"
                              }`}
                            >
                              <summary className="list-none cursor-pointer select-none">
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="text-[10px]">
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
                                  <div className="ml-auto flex items-center gap-1">
                                    {mondai.requires_passage && (
                                      <Badge variant="outline" className="text-[10px]">
                                        Passage
                                      </Badge>
                                    )}
                                    {mondai.requires_audio && (
                                      <Badge variant="outline" className="text-[10px]">
                                        Audio
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </summary>

                              <div className="mt-2 space-y-2 pl-1">
                                {mondai.requires_passage && node.parent ? (
                                  <button
                                    type="button"
                                    className={`w-full text-left rounded border px-2 py-1 text-xs ${
                                      node.parent.id === selectedQuestionId
                                        ? "border-primary/50 bg-background"
                                        : "border-border hover:bg-muted/30"
                                    }`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedQuestionId(node.parent!.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-2 justify-between">
                                      <span className="font-medium">PASSAGE</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        Order {node.parent.questionOrder}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[10px] line-clamp-2 text-muted-foreground">
                                      {node.parent.contentText}
                                    </div>
                                  </button>
                                ) : null}

                                <div className="space-y-1">
                                  {getQuestionNumbers(mondai).map((qNum) => {
                                    const child = node.children?.[qNum];
                                    const isSelected = child?.id === selectedQuestionId;
                                    if (!child) {
                                      return (
                                        <div
                                          key={qNum}
                                          className="px-2 py-1 text-[10px] text-muted-foreground rounded border border-dashed"
                                        >
                                          Câu {qNum} (trống)
                                        </div>
                                      );
                                    }
                                    return (
                                      <button
                                        key={qNum}
                                        type="button"
                                        className={`w-full text-left rounded border px-2 py-1 text-xs ${
                                          isSelected
                                            ? "border-primary/50 bg-background"
                                            : "border-border hover:bg-muted/30"
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedQuestionId(child.id);
                                        }}
                                      >
                                        <div className="flex items-center gap-2 justify-between">
                                          <span className="font-medium">Câu {qNum}</span>
                                          <span className="text-[10px] text-muted-foreground">
                                            #{child.id}
                                          </span>
                                        </div>
                                        <div className="mt-1 text-[10px] line-clamp-2 text-muted-foreground">
                                          {child.contentText}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
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
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold">
                            Edit câu #{selectedQuestion.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Mondai {selectedQuestion.mondaiNumber} • Order{" "}
                            {selectedQuestion.questionOrder} • {selectedQuestion.section}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/admin/jlpt-tests/${createdTestId}/questions`,
                              )
                            }
                            disabled={shouldRequireReviewConfirm && !reviewConfirmed}
                          >
                            Mở trang chỉnh sửa đầy đủ <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>

                      {shouldRequireReviewConfirm && (
                        <div className="pt-1">
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={reviewConfirmed}
                              onChange={(e) => setReviewConfirmed(e.target.checked)}
                            />
                            Đã review xong, cho phép chuyển sang chỉnh sửa đầy đủ
                          </label>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Nội dung (contentText)</Label>
                        <Textarea
                          value={draftContentText}
                          onChange={(e) => setDraftContentText(e.target.value)}
                          rows={4}
                        />
                      </div>

                      {/* Leaf question editor (options / correctOption / explanation) */}
                      {selectedQuestion.options != null || selectedQuestion.correctOption != null ? (
                        <>
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
                                onChange={(e) => setDraftExplanation(e.target.value)}
                                placeholder="(tuỳ chọn)"
                              />
                            </div>
                          </div>
                        </>
                      ) : null}

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
                                  ...(selectedQuestion.options != null ||
                                  selectedQuestion.correctOption != null
                                    ? {
                                        options: draftOptions,
                                        correctOption: draftCorrectOption,
                                        explanation: draftExplanation,
                                      }
                                    : {}),
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
                              await deleteQuestion(selectedQuestion.id).unwrap();
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
                      Chọn một câu trong bảng bên trên để xem/sửa.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review câu hỏi</CardTitle>
                <CardDescription>
                  Sau khi tạo đề bằng chế độ “từ ngân hàng”, danh sách câu hỏi sẽ hiện ở đây.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {creatingQuestions ? (
            <div className="text-xs text-muted-foreground">
              Đang tạo câu hỏi... (có thể mất vài phút tùy lượng câu trong ngân hàng)
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
