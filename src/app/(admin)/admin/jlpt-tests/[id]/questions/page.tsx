"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetTestByIdQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useUploadAudioMutation,
  useUploadImageMutation,
  useAttachQuestionBankItemToTestMutation,
  useGetQuestionBankItemsQuery,
  useBulkCreateQuestionBankItemsMutation,
  type QuestionBankItem,
  type JlptQuestionAdmin,
  type CreateQuestionDTO,
} from "@/store/services/adminJlptApi";
import {
  JLPT_STRUCTURE,
  rebuildStructureWithCounts,
  findMondaiForQuestion,
  getQuestionNumbers,
  getStructureForTestType,
  type JLPTLevel,
  type MondaiConfig,
  type SectionConfig,
} from "@/lib/jlpt-structure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, Loader2, Volume2, FileText, CheckCircle, Underline, Settings, Sparkles } from "lucide-react";
import AIQuestionGenerator, { type AIGeneratedQuestion } from "@/components/admin/AIQuestionGenerator";
import type { SectionKey } from "@/lib/jlpt-structure";
import { renderJlptText } from "@/lib/renderJlptText";
// ─── Mondai override types ────────────────────────────────────────────────────
interface MondaiOverride {
  count: number;        // number of questions in this mondai
  instruction: string; // direction text shown to students
}


interface MondaiNode {
  parent: JlptQuestionAdmin | null;  // passage question (parentId = null)
  children: Record<number, JlptQuestionAdmin>; // keyed by questionOrder
}

type QuestionsMap = Record<number, MondaiNode>; // keyed by mondaiNumber

// ─── Build questionsMap from backend tree ────────────────────────────────────

function buildQuestionsMap(questions: JlptQuestionAdmin[]): QuestionsMap {
  const map: QuestionsMap = {};

  for (const q of questions) {
    if (!map[q.mondaiNumber]) map[q.mondaiNumber] = { parent: null, children: {} };

    if (q.parentId == null) {
      // Parent or standalone question
      if (q.children && q.children.length > 0) {
        // Has children → it's a passage parent
        map[q.mondaiNumber].parent = q;
        for (const child of q.children) {
          map[q.mondaiNumber].children[child.questionOrder] = child;
        }
      } else {
        // Standalone answerable question (no passage group)
        // Check if it has options → it's a leaf question
        if (q.options || q.correctOption != null) {
          map[q.mondaiNumber].children[q.questionOrder] = q;
        } else {
          // It's a passage-only parent (no children loaded yet)
          map[q.mondaiNumber].parent = q;
        }
      }
    }
    // Skip questions with parentId (they come via parent.children[])
  }

  return map;
}

// ─── Collapsible Passage Editor Panel ────────────────────────────────────────
// Toggling OFF clears passageText → saved without passage → exam won't show passage
// Toggling ON shows textarea → admin enters text → saved with passage → exam shows it
function PassagePanel({
  mondaiNumber,
  passageText,
  setPassageText,
  requires_audio,
  audioPreviewUrl,
  handleAudioUpload,
  uploadingAudio,
}: {
  mondaiNumber: number;
  passageText: string;
  setPassageText: (v: string) => void;
  requires_audio: boolean;
  audioPreviewUrl: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleAudioUpload: (arg: any) => any;
  uploadingAudio: boolean;
}) {
  // Open by default only when there's existing passage content
  const [open, setOpen] = useState(() => passageText.trim().length > 0);

  const handleToggle = () => {
    if (open) {
      // Closing → clear passage so exam won't show it
      setPassageText("");
    }
    setOpen((v) => !v);
  };

  return (
    <div className="rounded-lg border overflow-hidden transition-all"
      style={{ borderColor: open ? "#93c5fd" : "#e2e8f0", background: open ? "rgb(239 246 255 / 0.5)" : "#f8fafc" }}
    >
      {/* Header — click to toggle with clear warning */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100/60 transition-colors"
      >
        <Label className="flex items-center gap-2 font-semibold cursor-pointer pointer-events-none"
          style={{ color: open ? "#1e40af" : "#64748b" }}
        >
          <FileText className="h-4 w-4" />
          Đoạn văn (Passage)
          <span className="text-xs font-normal" style={{ color: open ? "#2563eb" : "#94a3b8" }}>
            — dùng chung cho cả nhóm 問題{mondaiNumber}
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${open ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
            {open ? "Hiện" : "Ẩn"}
          </span>
          <ChevronLeft
            className="h-4 w-4 transition-transform"
            style={{ color: open ? "#3b82f6" : "#94a3b8", transform: open ? "rotate(-90deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Collapsible textarea */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <Textarea
            rows={8}
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Nhập đoạn văn / bài đọc tiếng Nhật..."
            className="font-jp text-sm bg-background text-foreground resize-y"
          />
          {requires_audio && (
            <AudioUploader
              label="Audio đoạn hội thoại"
              required
              currentUrl={audioPreviewUrl}
              onUpload={handleAudioUpload}
              uploading={uploadingAudio}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionSidebar({
  sections,
  mondaiLeaves,
  selectedQ,
  onSelect,
  subLabels,
}: {
  sections: SectionConfig[];
  mondaiLeaves: Map<number, JlptQuestionAdmin[]>;
  selectedQ: number | null;
  onSelect: (n: number) => void;
  subLabels: Record<number, string>;
}) {
  return (
    <aside className="w-72 shrink-0 border-r border-border bg-muted/30 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cấu trúc đề</p>
      </div>

      {sections.map((section, si) => (
        <div key={si} className="border-b border-border last:border-0">
          <div className="px-4 py-2.5 bg-muted/50">
            <p className="text-xs font-bold text-foreground">{section.name}</p>
          </div>

          {section.mondai.map((mondai) => {
            const nums = getQuestionNumbers(mondai);
            const actualQuestions = mondaiLeaves.get(mondai.number) || [];
            const actualNums = actualQuestions.map((q) => q.questionOrder);
            const displayNums = Array.from(new Set([...nums, ...actualNums])).sort((a, b) => a - b);
            
            // Re-calculate "filled" based on actual answerable ones
            const filled = actualQuestions.length;

            return (
              <div key={mondai.number} className="px-4 py-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    問題{mondai.number}
                  </span>
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                    {filled}/{nums.length}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 mb-2">{mondai.title}</p>

                {/* Audio / Passage badges */}
                <div className="flex gap-1 mb-2">
                  {mondai.requires_audio && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5 border-violet-400 text-violet-600">
                      <Volume2 className="h-2.5 w-2.5" />Audio
                    </Badge>
                  )}
                  {mondai.requires_passage && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5 border-blue-400 text-blue-600">
                      <FileText className="h-2.5 w-2.5" />Passage
                    </Badge>
                  )}
                </div>

                {/* Question number dots */}
                <div className="flex flex-wrap gap-1">
                  {displayNums.map((n) => {
                    const isSaved = actualQuestions.some(q => q.questionOrder === n);
                    const isCurrent = selectedQ === n;
                    // Exact match sequential subLabel from DB logic: 45.1, 46.1...
                    const subLabel = subLabels[n] ?? String(n);
                    return (
                      <button
                        key={n}
                        onClick={() => onSelect(n)}
                        title={`Câu ${n}`}
                        className={`h-7 rounded text-xs font-medium transition-all px-1.5
                          ${subLabel.includes('.') ? "min-w-[2.8rem]" : "w-7"}
                          ${isCurrent
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                            : isSaved
                            ? "bg-green-500/20 text-green-700 border border-green-400"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                      >
                        {subLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

function AudioUploader({
  label = "Audio",
  required = false,
  currentUrl,
  onUpload,
  uploading,
}: {
  label?: string;
  required?: boolean;
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Volume2 className="h-3.5 w-3.5 text-violet-500" />
        {label}
        {required && <span className="text-destructive text-xs">*</span>}
      </Label>
      {currentUrl && (
        <audio controls className="w-full h-10" src={currentUrl}>
          Your browser does not support audio.
        </audio>
      )}
      <div className="flex gap-2">
        <Input
          ref={ref}
          type="file"
          accept="audio/*"
          className="flex-1 text-sm"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
        {uploading && <Loader2 className="h-4 w-4 animate-spin self-center shrink-0" />}
      </div>
      {currentUrl && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Audio đã lưu</p>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminExamLayout() {
  const params = useParams();
  const router = useRouter();
  const testId = Number(params.id);

  const { data: test, isLoading } = useGetTestByIdQuery(testId);
  const [addQuestion] = useAddQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [uploadAudio] = useUploadAudioMutation();
  const [uploadImage] = useUploadImageMutation();
  const [attachFromBank] = useAttachQuestionBankItemToTestMutation();
  const [bulkCreateBank] = useBulkCreateQuestionBankItemsMutation();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<number | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Mondai config (count + instruction per mondai) — persisted to localStorage
  const STORAGE_KEY = `jlpt_mondai_config_${testId}`;
  const [mondaiOverrides, setMondaiOverrides] = useState<Record<number, MondaiOverride>>({});

  // Load from localStorage once test is known
  useEffect(() => {
    if (!test?.level) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMondaiOverrides(JSON.parse(raw));
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?.level]);

  const updateOverride = useCallback((mondaiNum: number, field: keyof MondaiOverride, value: string | number) => {
    setMondaiOverrides((prev) => {
      const next = { ...prev, [mondaiNum]: { ...(prev[mondaiNum] ?? { count: 0, instruction: "" }), [field]: value } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [STORAGE_KEY]);

  // Form state (resets when switching question)
  const [passageText, setPassageText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(1.0);
  const [audioMediaId, setAudioMediaId] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [imageMediaId, setImageMediaId] = useState<number | null>(null);

  // ── Derived from API + structure ──────────────────────────────────────────
  // Build count map from overrides (fallback to JLPT_STRUCTURE defaults)
  const countMap = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    Object.entries(mondaiOverrides).forEach(([k, v]) => { map[Number(k)] = v.count || 0; });
    return map;
  }, [mondaiOverrides]);

  const structure = useMemo<SectionConfig[]>(() => {
    if (!test?.level) return [];
    const testType = test.testType ?? "full_test";
    const hasAnyCount = Object.values(countMap).some((c) => c > 0);
    if (hasAnyCount) {
      // Rebuild with custom counts but still filter by testType
      const rebuilt = rebuildStructureWithCounts(test.level as JLPTLevel, countMap);
      const targetSectionNames = new Set(
        getStructureForTestType(test.level as JLPTLevel, testType).map((s) => s.name)
      );
      return rebuilt.filter((s) => targetSectionNames.has(s.name));
    }
    return getStructureForTestType(test.level as JLPTLevel, testType);
  }, [test?.level, test?.testType, countMap]);

  const questionsMap = useMemo<QuestionsMap>(() => {
    if (!test?.questions) return {};
    return buildQuestionsMap(test.questions);
  }, [test?.questions]);

  // Helper: find mondai in the CURRENT structure (respects custom counts from mondaiOverrides)
  const findMondaiInStructure = useCallback((qNum: number) => {
    for (const section of structure) {
      for (const mondai of section.mondai) {
        if (qNum >= mondai.start && qNum <= mondai.end) {
          return { section, mondai };
        }
      }
    }
    return null;
  }, [structure]);

  const derived = useMemo(() => {
    if (!selectedQuestionNumber) return null;
    const found = findMondaiInStructure(selectedQuestionNumber);
    if (!found) return null;
    const node = questionsMap[found.mondai.number];
    const existingChild = node?.children[selectedQuestionNumber] ?? null;
    const existingParent = node?.parent ?? null;
    return { ...found, node, existingChild, existingParent };
  }, [selectedQuestionNumber, findMondaiInStructure, questionsMap]);

  const { subLabels, mondaiLeaves } = useMemo(() => {
    const labels: Record<number, string> = {};
    const leavesMap = new Map<number, JlptQuestionAdmin[]>();
    
    if (!test?.questions) return { subLabels: labels, mondaiLeaves: leavesMap };

    // 1. Group only answerable questions (leaves) by mondaiNumber for the sidebar dots status
    test.questions.forEach((q) => {
      // If it's a child OR a standalone question with options/correctOption, it's a leaf
      if (q.parentId != null || q.options != null || q.correctOption != null) {
        if (!leavesMap.has(q.mondaiNumber)) leavesMap.set(q.mondaiNumber, []);
        leavesMap.get(q.mondaiNumber)!.push(q);
      }
    });

    // 2. Pre-generate EXACT labels for every possible slot statically from structure
    // This allows even unsaved/empty placeholders (like "46", "47") to show as "46.1"
    let currentLabelNumber = 1;

    structure.forEach((section) => {
      section.mondai.forEach((mondai) => {
        const nums = getQuestionNumbers(mondai);

        if (mondai.requires_passage) {
          nums.forEach((qNum, idx) => {
            labels[qNum] = `${currentLabelNumber}.${idx + 1}`;
          });
          currentLabelNumber++;
        } else {
          nums.forEach((qNum) => {
            labels[qNum] = String(currentLabelNumber);
            currentLabelNumber++;
          });
        }
      });
    });

    return { subLabels: labels, mondaiLeaves: leavesMap };
  }, [test?.questions, structure]);

  // Human-readable label for the selected question: "45.1" for passage mondai child, raw number otherwise
  const selectedSubLabel = useMemo(() => {
    if (!selectedQuestionNumber) return "";
    return subLabels[selectedQuestionNumber] ?? String(selectedQuestionNumber);
  }, [selectedQuestionNumber, subLabels]);

  // ── Question bank modal state ───────────────────────────────────────────────
  const [bankSearch, setBankSearch] = useState("");
  const bankLevel = test?.level as JLPTLevel | undefined;
  const bankSection = derived?.section.sectionKeys[0] as SectionKey | undefined;
  const { data: bankPage } = useGetQuestionBankItemsQuery(
    showBankModal && bankLevel && bankSection
      ? {
          level: bankLevel,
          section: bankSection,
          search: bankSearch || undefined,
          page: 0,
          size: 20,
        }
      : undefined,
  );
  const bankItems: QuestionBankItem[] = bankPage?.content ?? [];

  // ── Select question → populate form ──────────────────────────────────────
  const handleSelectQuestion = (n: number) => {
    setSelectedQuestionNumber(n);
    setShowAIPanel(false);

    const found = findMondaiInStructure(n);
    if (!found) return;

    const node = questionsMap[found.mondai.number];
    const child = node?.children[n] ?? null;
    const parent = node?.parent ?? null;

    setPassageText(parent?.contentText ?? "");
    setQuestionText(child?.contentText ?? "");
    // Parse options: backend may return string[] or JSON string
    let parsedOptions: string[] = ["", "", "", ""];
    if (child?.options) {
      if (Array.isArray(child.options)) {
        parsedOptions = child.options.length === 4 ? child.options : ["", "", "", ""];
      } else if (typeof child.options === "string") {
        try {
          const arr = JSON.parse(child.options as string);
          parsedOptions = Array.isArray(arr) && arr.length === 4 ? arr : ["", "", "", ""];
        } catch { /* leave empty */ }
      }
    }
    setOptions(parsedOptions);
    setCorrectOption(child?.correctOption ?? 1);
    setExplanation(child?.explanation ?? "");
    setPoints(child?.points ?? 1.0);
    setAudioMediaId(child?.audioMedia?.id ?? parent?.audioMedia?.id ?? null);
    setAudioPreviewUrl(child?.audioMedia?.url ?? parent?.audioMedia?.url ?? null);
    setImageMediaId(child?.imageMedia?.id ?? null);
  };

  // ── Upload handlers ───────────────────────────────────────────────────────
  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadAudio(fd).unwrap();
      setAudioMediaId(result.id);
      setAudioPreviewUrl(result.url);
    } catch {
      alert("Upload audio thất bại");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd).unwrap();
      setImageMediaId(result.id);
    } catch {
      alert("Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!derived || !selectedQuestionNumber) return;
    const { mondai, section, existingChild, existingParent } = derived;

    setSaving(true);
    try {
      // Determine correct section key: pick first sectionKey as primary
      const sectionKey = section.sectionKeys[0] as SectionKey;

      let parentId: number | null = existingParent?.id ?? null;

      // Step 1: Upsert passage (parent question) if this mondai requires passage
      const overrideInstruction = mondaiOverrides[mondai.number]?.instruction?.trim();
      const effectiveMondaiTitle = overrideInstruction || mondai.title;

      if (mondai.requires_passage && passageText.trim()) {
        const passagePayload: CreateQuestionDTO = {
          mondaiNumber: mondai.number,
          mondaiTitle: effectiveMondaiTitle,
          parentId: null,
          questionOrder: mondai.start - 1, // parent gets order before first child
          section: sectionKey,
          contentText: passageText,
          options: undefined,
          correctOption: undefined,
          audioMediaId: mondai.requires_audio ? (audioMediaId ?? undefined) : undefined,
        };

        if (existingParent) {
          const updated = await updateQuestion({ id: existingParent.id, data: passagePayload }).unwrap();
          parentId = updated.id;
        } else {
          const created = await addQuestion({ testId, data: passagePayload }).unwrap();
          parentId = created.id;
        }
      }

      // Step 2: Upsert child question
      const childPayload: CreateQuestionDTO = {
        mondaiNumber: mondai.number,
        mondaiTitle: effectiveMondaiTitle,
        parentId: parentId,
        questionOrder: selectedQuestionNumber,
        section: sectionKey,
        contentText: questionText,
        options: JSON.stringify(options) as any,  // backend expects JSON string, not array
        correctOption,
        explanation: explanation || undefined,
        points,
        audioMediaId: mondai.requires_audio && !mondai.requires_passage ? (audioMediaId ?? undefined) : undefined,
        imageMediaId: imageMediaId ?? undefined,
      };

      if (existingChild) {
        await updateQuestion({ id: existingChild.id, data: childPayload }).unwrap();
      } else {
        await addQuestion({ testId, data: childPayload }).unwrap();
      }

      // Move to next question automatically
      const nextQ = selectedQuestionNumber < mondai.end
        ? selectedQuestionNumber + 1
        : selectedQuestionNumber;
      handleSelectQuestion(nextQ);

    } catch (err) {
      console.error(err);
      alert("Lưu câu hỏi thất bại!");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test) {
    return <div className="text-center py-12 text-muted-foreground">Không tìm thấy đề thi</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-sm">{test.title}</h1>
            <p className="text-xs text-muted-foreground">
              {test.level} • {test.questions?.reduce((acc, q) => acc + (q.children?.length || (q.parentId ? 0 : 1)), 0)} câu hỏi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSetup((s) => !s)}
            className={showSetup ? "border-primary text-primary" : ""}
          >
            <Settings className="h-4 w-4 mr-1" />
            Cấu hình mondai
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPanel((s) => !s)}
            className={showAIPanel ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20" : ""}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            AI Tạo câu hỏi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBankModal(true)}
          >
            Ngân hàng câu hỏi
          </Button>
          <Badge variant="outline">{test.isPublished ? "Published" : "Draft"}</Badge>
        </div>
      </header>

      {/* ── Setup Panel overlay ─────────────────────────────────────────── */}
      {showSetup && (
        <div className="shrink-0 border-b border-border bg-muted/20 overflow-y-auto max-h-[55vh] px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">⚙️ Cấu hình số câu hỏi & yêu cầu đề bài mỗi mondai</h2>
            <p className="text-xs text-muted-foreground">Lưu tự động vào trình duyệt (localStorage)</p>
          </div>

          {structure.map((section) => (
            <div key={section.name} className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">{section.name}</p>
              <div className="grid gap-4">
                {section.mondai.map((mondai) => {
                  const ov = mondaiOverrides[mondai.number];
                  const defaultCount = (JLPT_STRUCTURE[test.level as JLPTLevel] ?? [])
                    .flatMap((s) => s.mondai)
                    .find((m) => m.number === mondai.number);
                  return (
                    <div key={mondai.number} className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">問{mondai.number}</span>
                        <span className="font-medium text-sm">{mondai.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Mặc định: {defaultCount ? `${defaultCount.end - defaultCount.start + 1}` : "?"} câu
                        </span>
                      </div>

                      <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                        {/* Question count */}
                        <div className="space-y-1">
                          <Label className="text-xs">Số câu hỏi</Label>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            placeholder={String(defaultCount ? defaultCount.end - defaultCount.start + 1 : "")}
                            value={ov?.count || ""}
                            onChange={(e) => updateOverride(mondai.number, "count", Number(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* Instruction text */}
                        <div className="space-y-1">
                          <Label className="text-xs">Yêu cầu đề bài (mondaiTitle)</Label>
                          <Textarea
                            rows={2}
                            placeholder="VD: ___のことばはひらがなで どう かきますか。1・2・3・4から いちばん いいものをひとつ えらんでください。"
                            value={ov?.instruction || ""}
                            onChange={(e) => updateOverride(mondai.number, "instruction", e.target.value)}
                            className="text-sm resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body: Sidebar + Form */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: List questions grouped by section / mondai */}
        <SectionSidebar
          sections={structure}
          mondaiLeaves={mondaiLeaves}
          selectedQ={selectedQuestionNumber}
          onSelect={handleSelectQuestion}
          subLabels={subLabels}
        />

        {/* Right: Question Form */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {!selectedQuestionNumber ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Chọn số câu từ thanh sidebar bên trái</p>
                <p className="text-sm mt-1 opacity-60">Click vào một số câu để bắt đầu nhập nội dung</p>
              </div>
            </div>
          ) : !derived ? (
            <div className="text-muted-foreground">Không tìm thấy cấu trúc cho câu {selectedQuestionNumber}</div>
          ) : (
            <div className="max-w-2xl space-y-6">
              {/* AI Question Generator Panel */}
              {showAIPanel && derived && (
                <AIQuestionGenerator
                  level={test.level}
                  mondaiNumber={derived.mondai.number}
                  mondaiTitle={mondaiOverrides[derived.mondai.number]?.instruction || derived.mondai.title}
                  mondaiStart={derived.mondai.start}
                  mondaiEnd={derived.mondai.end}
                  initialStart={selectedQuestionNumber}
                  section={derived.section.sectionKeys[0] as "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING"}
                  onConfirm={async (questions: AIGeneratedQuestion[], startFrom: number, saveToBank: boolean) => {
                    if (!derived) return;
                    
                    setSaving(true);
                    setShowAIPanel(false);
                    
                    try {
                      // Bắt đầu chèn từ startFrom do User chỉ định
                      let currentQNum = startFrom;
                      const { section, mondai } = derived;
                      const sectionKey = section.sectionKeys[0] as SectionKey;
                      const overrideInstruction = mondaiOverrides[mondai.number]?.instruction?.trim();
                      const effectiveMondaiTitle = overrideInstruction || mondai.title;

                      // Step 1: Handle passage if required (only once for the batch)
                      let parentId: number | null = derived.existingParent?.id ?? null;
                      
                      const firstQ = questions[0];
                      if (firstQ?.passageText && mondai.requires_passage) {
                        setPassageText(firstQ.passageText); // Update UI
                        
                        const passagePayload: CreateQuestionDTO = {
                          mondaiNumber: mondai.number,
                          mondaiTitle: effectiveMondaiTitle,
                          parentId: null,
                          questionOrder: mondai.start - 1,
                          section: sectionKey,
                          contentText: firstQ.passageText,
                          options: undefined,
                          correctOption: undefined,
                          audioMediaId: mondai.requires_audio ? (audioMediaId ?? undefined) : undefined,
                        };

                        if (derived.existingParent) {
                          const updated = await updateQuestion({ id: derived.existingParent.id, data: passagePayload }).unwrap();
                          parentId = updated.id;
                        } else {
                          const created = await addQuestion({ testId, data: passagePayload }).unwrap();
                          parentId = created.id;
                        }
                      }

                      // Step 2: Save each generated question sequentially
                      for (let i = 0; i < questions.length; i++) {
                        const q = questions[i];
                        if (currentQNum > mondai.end) break; // Don't overflow mondai bounds
                        
                        const targetNode = questionsMap[mondai.number];
                        const existingChild = targetNode?.children[currentQNum] ?? null;
                        
                        // Parse options array to string length 4 for frontend UI state consistency, but send JSON string
                        const parsedOptions = q.options.length === 4 ? q.options : [...q.options, "", "", "", ""].slice(0, 4);

                        const childPayload: CreateQuestionDTO = {
                          mondaiNumber: mondai.number,
                          mondaiTitle: effectiveMondaiTitle,
                          parentId: parentId,
                          questionOrder: currentQNum,
                          section: sectionKey,
                          contentText: q.contentText,
                          options: JSON.stringify(parsedOptions) as any,
                          correctOption: q.correctOption,
                          explanation: q.explanation || undefined,
                          points: 1.0,
                          audioMediaId: mondai.requires_audio && !mondai.requires_passage ? (audioMediaId ?? undefined) : undefined,
                          imageMediaId: imageMediaId ?? undefined,
                        };

                        if (existingChild) {
                          await updateQuestion({ id: existingChild.id, data: childPayload }).unwrap();
                        } else {
                          await addQuestion({ testId, data: childPayload }).unwrap();
                        }

                        currentQNum++;
                      }

                      // Optionally save to bank
                      if (saveToBank) {
                        try {
                          const baseTags = [test.level as JLPTLevel, sectionKey, "ai"];
                          let extraTag = "";
                          const lowerTitle = (effectiveMondaiTitle || "").toLowerCase();
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

                          const payloads = questions.map((q) => ({
                            level: test.level as JLPTLevel,
                            section: sectionKey,
                            difficulty: "MEDIUM" as const,
                            mondaiNumber: mondai.number,
                            mondaiTitle: effectiveMondaiTitle,
                            passageText: q.passageText,
                            contentText: q.contentText,
                            options: JSON.stringify(q.options),
                            correctOption: q.correctOption,
                            explanation: q.explanation,
                            points: 1.0,
                            tags: [baseTags.join(","), extraTag].filter(Boolean).join(","),
                          }));
                          await bulkCreateBank(payloads as any).unwrap();
                        } catch (err) {
                          console.error("Lưu ngân hàng câu hỏi thất bại", err);
                        }
                      }

                      // Move UI selection to the last created question (or its end)
                      const finalQNum = Math.min(currentQNum, mondai.end);
                      handleSelectQuestion(finalQNum);
                      alert(`Đã chèn và lưu thành công ${questions.length} câu hỏi! (Từ câu ${startFrom})`);
                      
                    } catch (error) {
                      console.error("Lỗi khi lưu batch AI:", error);
                      alert("Có lỗi xảy ra khi lưu hàng loạt câu hỏi.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              )}

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{derived.section.name}</span>
                <span className="text-muted-foreground">›</span>
                <span className="font-medium">問題{derived.mondai.number} — {derived.mondai.title}</span>
                <span className="text-muted-foreground">›</span>
                <span className="text-primary font-bold">Câu {selectedSubLabel}</span>
              </div>

              {/* Instruction preview from mondai config */}
              {mondaiOverrides[derived.mondai.number]?.instruction && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 font-jp leading-relaxed">
                  <span className="font-semibold not-font-jp text-amber-600 mr-1">Yêu cầu đề:</span>
                  {mondaiOverrides[derived.mondai.number].instruction}
                </div>
              )}

              {/* Passage Editor — collapsible */}
              {derived.mondai.requires_passage && (
                <PassagePanel
                  mondaiNumber={derived.mondai.number}
                  passageText={passageText}
                  setPassageText={setPassageText}
                  requires_audio={derived.mondai.requires_audio}
                  audioPreviewUrl={audioPreviewUrl}
                  handleAudioUpload={handleAudioUpload}
                  uploadingAudio={uploadingAudio}
                />
              )}

              {/* Audio (for non-passage listening) */}
              {derived.mondai.requires_audio && !derived.mondai.requires_passage && (
                <AudioUploader
                  label="File Audio"
                  required
                  currentUrl={audioPreviewUrl}
                  onUpload={handleAudioUpload}
                  uploading={uploadingAudio}
                />
              )}

              {/* Question Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">
                    Nội dung câu hỏi <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    title="Gạch chân từ được chọn (select text rồi click)"
                    onClick={() => {
                      const textarea = document.getElementById("question-content") as HTMLTextAreaElement;
                      if (!textarea) return;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      if (start === end) {
                        alert("Hãy chọn (bôi đen) từ bạn muốn gạch chân trước!");
                        return;
                      }
                      const selected = questionText.slice(start, end);
                      const before = questionText.slice(0, start);
                      const after = questionText.slice(end);
                      const newText = `${before}__${selected}__${after}`;
                      setQuestionText(newText);
                      // Restore cursor after the closing __
                      requestAnimationFrame(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start, end + 4);
                      });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <Underline className="h-3.5 w-3.5" />
                    Gạch chân
                  </button>
                </div>
                <Textarea
                  id="question-content"
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi... Dùng __từ__ để gạch chân."
                  className="text-sm resize-y font-mono"
                />
                {/* Live preview */}
                {questionText && (
                  <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-2">Preview:</span>
                    {renderJlptText(questionText)}
                  </div>
                )}
              </div>

              {/* Image Upload (optional) */}
              <div className="space-y-2">
                <Label className="text-sm">Hình ảnh (tùy chọn)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                />
                {imageMediaId && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Ảnh đã upload</p>}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Label className="font-semibold">Đáp án (chọn đáp án đúng) <span className="text-destructive">*</span></Label>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCorrectOption(i + 1)}
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                        ${correctOption === i + 1
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/30 text-muted-foreground hover:border-primary"
                        }`}
                    >
                      {i + 1}
                    </button>
                    <Input
                      value={options[i]}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`Đáp án ${i + 1}`}
                      className={correctOption === i + 1 ? "border-primary bg-primary/5 font-medium" : ""}
                    />
                  </div>
                ))}
              </div>

              {/* Explanation + Points */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Giải thích (tùy chọn)</Label>
                  <Textarea
                    rows={2}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Giải thích đáp án đúng..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Điểm</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Save Bar */}
              <div className="sticky bottom-0 -mx-8 px-8 py-4 border-t border-border bg-background/95 backdrop-blur flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || !questionText.trim() || (derived.mondai.requires_audio && !audioMediaId)}
                  className="min-w-32"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Lưu câu {selectedSubLabel}</>
                  )}
                </Button>
                {derived.mondai.requires_audio && !audioMediaId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    Bắt buộc upload audio cho phần Listening
                  </p>
                )}
                {derived.existingChild && (
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Đã có nội dung
                  </span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Question Bank Modal */}
      {showBankModal && derived && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold">Chọn câu hỏi từ ngân hàng</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBankModal(false)}>
                Đóng
              </Button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              <Input
                placeholder="Tìm theo nội dung / tags..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="space-y-2">
                {bankItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left border rounded-md p-3 text-xs flex flex-col gap-1 hover:bg-muted/40"
                    onClick={async () => {
                      if (!derived || !selectedQuestionNumber) return;
                      try {
                        await attachFromBank({
                          bankItemId: item.id,
                          testId,
                          section: derived.section.sectionKeys[0] as any,
                          questionOrder: selectedQuestionNumber,
                          mondaiNumber: derived.mondai.number,
                          mondaiTitle: derived.mondai.title,
                          parentQuestionId: derived.existingParent?.id ?? null,
                        }).unwrap();
                        setShowBankModal(false);
                        handleSelectQuestion(selectedQuestionNumber);
                      } catch (e) {
                        console.error(e);
                        alert("Gắn câu hỏi từ ngân hàng thất bại");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {item.level} • {item.section}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="line-clamp-2">{item.contentText}</p>
                    {item.tags && (
                      <p className="text-[10px] text-muted-foreground">Tags: {item.tags}</p>
                    )}
                  </button>
                ))}
                {bankItems.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Không có câu hỏi nào trong ngân hàng với bộ lọc hiện tại.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
