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
  useUpdateMondaiCountsMutation,
} from "@/store/services/adminJlptApi";
import {
  JLPT_STRUCTURE,
  rebuildStructureWithCounts,
  getQuestionNumbers,
  getStructureForTestType,
  type JLPTLevel,
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
import { toast } from "sonner";
import { renderJlptText } from "@/lib/renderJlptText";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MondaiOverride {
  count: number;
  instruction: string;
}

const JLPT_MONDAI_DEFAULTS: Record<string, Record<number, number>> = {
  N5: { 8: 5, 9: 4, 10: 3 },
  N4: { 8: 4, 9: 5, 10: 3 },
  N3: { 8: 6, 9: 6, 10: 3, 11: 3 },
  N2: { 9: 6, 10: 6, 11: 4, 12: 4, 13: 3, 14: 4, 15: 4, 16: 4, 17: 4 },
  N1: { 7: 5, 8: 6, 9: 5, 10: 5, 11: 5, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4, 21: 4, 22: 4, 23: 4, 24: 4, 25: 4 },
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
        if (q.options || q.correctOption != null) {
          map[q.mondaiNumber].children[q.questionOrder] = q;
        } else {
          map[q.mondaiNumber].parent = q;
        }
      }
    }
  }

  return map;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionSidebar({
  sections,
  mondaiLeaves,
  selectedQ,
  selectedSlotPerMondai,
  onSelect,
}: {
  sections: SectionConfig[];
  mondaiLeaves: Map<number, JlptQuestionAdmin[]>;
  selectedQ: number | null;
  selectedSlotPerMondai: Record<number, number>;
  onSelect: (questionOrder: number, slotIndex: number, mondaiNumber: number) => void;
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
            const isPassage = mondai.requires_passage;

            return (
              <div key={mondai.number} className="px-4 py-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    問題{mondai.number}
                  </span>
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                    {actualQuestions.length}/{mondai._totalCount ?? (mondai.end - mondai.start + 1)}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 mb-2">{mondai.title}</p>

                <div className="flex gap-1 mb-2">
                  {mondai.requires_audio && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5 border-violet-400 text-violet-600">
                      <Volume2 className="h-2.5 w-2.5" />Audio
                    </Badge>
                  )}
                  {isPassage && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5 border-blue-400 text-blue-600">
                      <FileText className="h-2.5 w-2.5" />Passage
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {nums.map((questionOrder, idx) => {
                    const slotIndex = idx + 1;
                    const selectedSlot = selectedSlotPerMondai[mondai.number];
                    const isCurrent = selectedSlot === slotIndex;
                    const isSaved = actualQuestions.some(q => q.questionOrder === questionOrder);

                    const displayLabel = isPassage
                      ? `${mondai.start}.${slotIndex}`
                      : String(questionOrder);

                    return (
                      <button
                        key={questionOrder}
                        onClick={() => onSelect(questionOrder, slotIndex, mondai.number)}
                        title={`Câu ${displayLabel}`}
                        className={`h-7 rounded text-xs font-medium transition-all px-1.5 min-w-[2rem]
                          ${isCurrent
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                            : isSaved
                            ? "bg-green-500/20 text-green-700 border border-green-400"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                      >
                        {displayLabel}
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
  handleAudioUpload: (file: File) => void;
  uploadingAudio: boolean;
}) {
  const [open, setOpen] = useState(() => passageText.trim().length > 0);

  const handleToggle = () => {
    if (open) {
      setPassageText("");
    }
    setOpen((v) => !v);
  };

  return (
    <div className="rounded-lg border overflow-hidden transition-all"
      style={{ borderColor: open ? "#93c5fd" : "#e2e8f0", background: open ? "rgb(239 246 255 / 0.5)" : "#f8fafc" }}
    >
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
  const [updateMondaiCounts] = useUpdateMondaiCountsMutation();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<number | null>(null);
  // mondaiNumber → slotIndex (1-based) of selected question within that mondai
  const [selectedSlotPerMondai, setSelectedSlotPerMondai] = useState<Record<number, number>>({});
  const [showSetup, setShowSetup] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Mondai config ─────────────────────────────────────────────────────────
  const STORAGE_KEY = `jlpt_mondai_config_${testId}`;
  const [mondaiOverrides, setMondaiOverrides] = useState<Record<number, MondaiOverride>>({});

  useEffect(() => {
    if (!test?.level) return;
    const merged: Record<number, MondaiOverride> = {};
    const levelDefaults = JLPT_MONDAI_DEFAULTS[test.level] || {};

    if (test.mondaiCounts && Object.keys(test.mondaiCounts).length > 0) {
      Object.entries(test.mondaiCounts).forEach(([k, v]) => {
        merged[Number(k)] = { count: v, instruction: "" };
      });
    } else {
      Object.entries(levelDefaults).forEach(([k, v]) => {
        merged[Number(k)] = { count: v, instruction: "" };
      });
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<number, MondaiOverride>;
        Object.entries(stored).forEach(([k, v]) => {
          if (!merged[Number(k)]) merged[Number(k)] = { count: 0, instruction: "" };
          merged[Number(k)].instruction = v.instruction ?? "";
          if (v.count > 0) merged[Number(k)].count = v.count;
        });
      }
    } catch { /* ignore */ }

    setMondaiOverrides(merged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?.level, test?.mondaiCounts]);

  const updateOverride = useCallback((mondaiNum: number, field: keyof MondaiOverride, value: string | number) => {
    setMondaiOverrides((prev) => {
      const next = { ...prev, [mondaiNum]: { ...(prev[mondaiNum] ?? { count: 0, instruction: "" }), [field]: value } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (field === "count" && testId && (value as number) > 0) {
      updateMondaiCounts({ testId, mondaiCounts: { [mondaiNum]: value as number } }).catch(console.error);
    }
  }, [STORAGE_KEY, testId, updateMondaiCounts]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [passageText, setPassageText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(1.0);
  const [audioMediaId, setAudioMediaId] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [imageMediaId, setImageMediaId] = useState<number | null>(null);

  // ── Question bank modal state ──────────────────────────────────────────────
  const [bankSearch, setBankSearch] = useState("");
  const [bankLevel, setBankLevel] = useState<JLPTLevel | "">("");
  const [bankSection, setBankSection] = useState<string>("");

  // ── Derived from API + structure ──────────────────────────────────────────
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

  // ── Map from slotIndex → questionOrder for passage mondai children ───────────
  // Built from test.questions by iterating children, sorting by questionOrder within parent, mapping position
  const slotIndexToQuestionOrder = useMemo<Map<number, number>>(() => {
    const map = new Map<number, number>();
    if (!test?.questions) return map;

    test.questions.forEach((q) => {
      if (q.parentId != null) {
        const node = questionsMap[q.mondaiNumber];
        const parent = node?.parent;
        if (parent) {
          const siblings = (node?.children ? Object.values(node.children) : [])
            .filter((c) => c.parentId === parent.id)
            .sort((a, b) => a.questionOrder - b.questionOrder);
          const slotIdx = siblings.findIndex((s) => s.id === q.id) + 1;
          if (slotIdx > 0) map.set(slotIdx, q.questionOrder);
        }
      }
    });
    return map;
  }, [test?.questions, questionsMap]);

  // ── Cumulative offset (display counter start) for each passage mondai ────────
  // mondaiNumber → display counter at which this passage's FIRST slot starts (1-based)
  // Must count ALL questions (standalone + passage children) before each passage mondai.
  // ── Cumulative count of ALL questions (standalone + passage children) before each mondai ─
  // mondaiNumber → count of ALL questions before this mondai (used for both display counter mapping and passage slot resolution)
  const mondaiCumulativeCount = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    let cumulative = 0;
    structure.forEach((section) => {
      if (section.sectionKeys.includes("LISTENING")) return;
      section.mondai.forEach((mondai) => {
        map[mondai.number] = cumulative;
        if (mondai.requires_passage) {
          cumulative += mondai._totalCount ?? 1;
        } else {
          cumulative += mondai.end - mondai.start + 1;
        }
      });
    });
    return map;
  }, [structure]);

  // ── Find mondai in structure ───────────────────────────────────────────────
  // n: display counter value (1..57 for non-listening)
  // For passage mondai: finds by cumulative display counter range
  // For standalone: finds by display counter (which equals question_order)
  // Returns {section, mondai, passageSlotIndex} where passageSlotIndex is 1-based slot within passage (or null for standalone)
  const findMondaiInStructure = useCallback((n: number) => {
    // First check passage mondai via cumulative display counter
    for (const section of structure) {
      if (section.sectionKeys.includes("LISTENING")) continue;
      for (const mondai of section.mondai) {
        if (mondai.requires_passage) {
          const offset = mondaiCumulativeCount[mondai.number] ?? 0;
          const count = mondai._totalCount ?? 1;
          const rangeStart = offset + 1;
          const rangeEnd = offset + count;
          if (n >= rangeStart && n <= rangeEnd) {
            return { section, mondai, passageSlotIndex: n - offset };
          }
        }
      }
    }
    // Not a passage slot — check standalone mondai by display counter (== question_order)
    for (const section of structure) {
      if (section.sectionKeys.includes("LISTENING")) continue;
      for (const mondai of section.mondai) {
        if (!mondai.requires_passage) {
          if (n >= mondai.start && n <= mondai.end) {
            return { section, mondai, passageSlotIndex: null };
          }
        }
      }
    }
    // Listening
    for (const section of structure) {
      if (!section.sectionKeys.includes("LISTENING")) continue;
      for (const mondai of section.mondai) {
        if (n >= mondai.start && n <= mondai.end) {
          return { section, mondai, passageSlotIndex: null };
        }
      }
    }
    return null;
  }, [structure, mondaiCumulativeCount]);

  // ── Derived: current selection resolved ───────────────────────────────────
  const derived = useMemo(() => {
    if (!selectedQuestionNumber) return null;
    const found = findMondaiInStructure(selectedQuestionNumber);
    if (!found) return null;
    const node = questionsMap[found.mondai.number];
    const slotIdx = selectedSlotPerMondai[found.mondai.number] ?? found.passageSlotIndex;

    let existingChild: JlptQuestionAdmin | null = null;
    if (found.mondai.requires_passage && slotIdx != null) {
      const qOrder = slotIndexToQuestionOrder.get(slotIdx);
      if (qOrder != null) {
        existingChild = node?.children[qOrder] ?? null;
      }
    } else {
      existingChild = node?.children[selectedQuestionNumber] ?? null;
    }

    const existingParent = node?.parent ?? null;
    return { ...found, node, existingChild, existingParent, slotIdx };
  }, [selectedQuestionNumber, findMondaiInStructure, questionsMap, slotIndexToQuestionOrder, selectedSlotPerMondai]);

  // ── SubLabels and mondaiLeaves ────────────────────────────────────────────
  const { subLabels, mondaiLeaves } = useMemo(() => {
    const labels: Record<number, string> = {};
    const leavesMap = new Map<number, JlptQuestionAdmin[]>();

    if (!test?.questions) return { subLabels: labels, mondaiLeaves: leavesMap };

    const listeningMondaiNums = new Set<number>();
    structure.forEach((section) => {
      if (section.sectionKeys.includes("LISTENING")) {
        section.mondai.forEach((m) => listeningMondaiNums.add(m.number));
      }
    });

    test.questions.forEach((q) => {
      if (listeningMondaiNums.has(q.mondaiNumber)) return;
      if (q.parentId != null || q.options != null || q.correctOption != null) {
        if (!leavesMap.has(q.mondaiNumber)) leavesMap.set(q.mondaiNumber, []);
        leavesMap.get(q.mondaiNumber)!.push(q);
      }
    });

  // Build subLabels: displayCounter (questionOrder for standalone) → display label
  // For passage: "M.slot" (e.g. "8.1", "8.2"); for standalone: String(questionOrder)
  let displayCounter = 1;

  structure.forEach((section) => {
    if (section.sectionKeys.includes("LISTENING")) return;

    section.mondai.forEach((mondai) => {
      const nums = getQuestionNumbers(mondai);

      if (mondai.requires_passage) {
        const passageBase = mondai.start;
        nums.forEach((_qOrder, idx) => {
          const slotIndex = idx + 1;
          labels[displayCounter] = `${passageBase}.${slotIndex}`;
          displayCounter++;
        });
      } else {
        nums.forEach((qNum) => {
          labels[displayCounter] = String(qNum);
          displayCounter++;
        });
      }
    });
  });

    return { subLabels: labels, mondaiLeaves: leavesMap };
  }, [test?.questions, structure]);

  // ── Question bank query ───────────────────────────────────────────────────
  const { data: bankPage } = useGetQuestionBankItemsQuery(
    showBankModal && bankLevel && bankSection
      ? {
          level: bankLevel,
          section: bankSection as "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING",
          search: bankSearch || undefined,
          page: 0,
          size: 20,
        }
      : undefined,
  );
  const bankItems: QuestionBankItem[] = bankPage?.content ?? [];

  // ── Select question → populate form ──────────────────────────────────────
  const handleSelectQuestion = useCallback((
    n: number,
    slotIdx?: number,
    mondaiNum?: number,
    passedSlotIdx?: number
  ) => {
    // If called with 1 arg (old internal calls), derive from structure
    if (slotIdx === undefined || mondaiNum === undefined) {
      const found = findMondaiInStructure(n);
      if (!found) return;
      const effectiveSlot = passedSlotIdx ?? found.passageSlotIndex ?? selectedSlotPerMondai[found.mondai.number];
      setSelectedQuestionNumber(n);
      setSelectedSlotPerMondai(prev => ({ ...prev, [found.mondai.number]: effectiveSlot ?? 1 }));
      setShowAIPanel(false);
      const node = questionsMap[found.mondai.number];
      const isPassage = found.mondai.requires_passage;
      let child: JlptQuestionAdmin | null = null;
      let parent: JlptQuestionAdmin | null = node?.parent ?? null;
      if (isPassage && effectiveSlot != null) {
        const qOrder = slotIndexToQuestionOrder.get(effectiveSlot);
        if (qOrder != null) child = node?.children[qOrder] ?? null;
      } else {
        child = node?.children[n] ?? null;
      }
      setPassageText(parent?.contentText ?? "");
      setQuestionText(child?.contentText ?? "");
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
      return;
    }

    // Full call with all 3 args (from sidebar button)
    const effectiveSlotIdx = passedSlotIdx ?? slotIdx;
    setSelectedQuestionNumber(n);
    setSelectedSlotPerMondai(prev => ({ ...prev, [mondaiNum]: effectiveSlotIdx }));
    setShowAIPanel(false);

    const node = questionsMap[mondaiNum];
    const found = findMondaiInStructure(n);
    const mondai = found?.mondai;
    const isPassage = mondai?.requires_passage ?? false;

    let child: JlptQuestionAdmin | null = null;
    let parent: JlptQuestionAdmin | null = node?.parent ?? null;

    if (isPassage && effectiveSlotIdx != null) {
      const qOrder = slotIndexToQuestionOrder.get(effectiveSlotIdx);
      if (qOrder != null) child = node?.children[qOrder] ?? null;
    } else {
      child = node?.children[n] ?? null;
    }

    setPassageText(parent?.contentText ?? "");
    setQuestionText(child?.contentText ?? "");
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
  }, [findMondaiInStructure, questionsMap, slotIndexToQuestionOrder, selectedSlotPerMondai]);

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
      toast.error("Upload audio thất bại");
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
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!derived || !selectedQuestionNumber) return;
    const { mondai, section, existingChild, existingParent, passageSlotIndex } = derived;

    // For passage: questionOrder = mondai.start + passageSlotIndex (passage at mondai.start, children at mondai.start+1...)
    // For standalone: questionOrder = selectedQuestionNumber
    const isPassage = mondai.requires_passage;
    const questionOrder = isPassage && passageSlotIndex != null
      ? mondai.start + passageSlotIndex
      : selectedQuestionNumber;

    const resolveSectionKey = (): SectionKey => {
      const keys = section.sectionKeys;
      if (keys.length === 1) return keys[0] as SectionKey;
      if (mondai.requires_audio && keys.includes("LISTENING")) return "LISTENING";
      if (mondai.requires_passage && keys.includes("READING")) return "READING";
      const title = mondai.title || "";
      if (keys.includes("GRAMMAR") && keys.includes("READING")) {
        if (mondai.requires_passage || /読解|情報検索|統合/.test(title)) return "READING";
        return "GRAMMAR";
      }
      if (keys.includes("VOCABULARY") && keys.includes("GRAMMAR") && keys.includes("READING")) {
        if (mondai.requires_passage || /読解|情報検索|統合/.test(title)) return "READING";
        if (/文法/.test(title)) return "GRAMMAR";
        return "VOCABULARY";
      }
      return keys[0] as SectionKey;
    };

    const sectionKey = resolveSectionKey();
    const isListeningSection =
      sectionKey === "LISTENING" || section.sectionKeys.includes("LISTENING");

    if (isListeningSection && !explanation.trim()) {
      toast.error("Phần nghe bắt buộc nhập script nghe trước khi lưu.");
      return;
    }

    setSaving(true);
    try {
      let parentId: number | null = existingParent?.id ?? null;

      const overrideInstruction = mondaiOverrides[mondai.number]?.instruction?.trim();
      const effectiveMondaiTitle = overrideInstruction || mondai.title;

      if (mondai.requires_passage && passageText.trim()) {
        const passagePayload: CreateQuestionDTO = {
          mondaiNumber: mondai.number,
          mondaiTitle: effectiveMondaiTitle,
          parentId: null,
          questionOrder: mondai.start,
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

      const childPayload: CreateQuestionDTO = {
        mondaiNumber: mondai.number,
        mondaiTitle: effectiveMondaiTitle,
        parentId: parentId,
        questionOrder,
        section: sectionKey,
        contentText: questionText,
        options: JSON.stringify(options) as unknown as string,
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

      // For passage: advance within mondai children (e.g. 54→55→56)
      // For standalone: advance to next slot (e.g. 52→53)
      const nextQ = isPassage
        ? questionOrder < mondai.start + (mondai._totalCount ?? 1) - 1
          ? questionOrder + 1
          : selectedQuestionNumber
        : selectedQuestionNumber < mondai.end
        ? selectedQuestionNumber + 1
        : selectedQuestionNumber;
      handleSelectQuestion(nextQ);

    } catch (err) {
      console.error(err);
      toast.error("Lưu câu hỏi thất bại!");
    } finally {
      setSaving(false);
    }
  };

  // ── Human-readable label for selected question ─────────────────────────────
  const selectedSubLabel = useMemo(() => {
    if (!selectedQuestionNumber) return "";
    return subLabels[selectedQuestionNumber] ?? String(selectedQuestionNumber);
  }, [selectedQuestionNumber, subLabels]);

  // ─── Render ───────────────────────────────────────────────────────────────

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

      {/* Setup Panel */}
      {showSetup && (
        <div className="shrink-0 border-b border-border bg-muted/20 overflow-y-auto max-h-[55vh] px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Cấu hình số câu hỏi & yêu cầu đề bài mỗi mondai</h2>
            <p className="text-xs text-muted-foreground">Số câu tự động lưu vào database, hướng dẫn lưu localStorage</p>
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
        <SectionSidebar
          sections={structure}
          mondaiLeaves={mondaiLeaves}
          selectedQ={selectedQuestionNumber}
          selectedSlotPerMondai={selectedSlotPerMondai}
          onSelect={handleSelectQuestion}
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
                  subLabels={subLabels}
                  requiresPassage={derived.mondai.requires_passage}
                  onConfirm={async (questions: AIGeneratedQuestion[], startFrom: number, saveToBank: boolean) => {
                    if (!derived) return;

                    setSaving(true);
                    setShowAIPanel(false);

                    try {
                      let currentQNum = startFrom;
                      const { section, mondai } = derived;

                      const resolveSectionKey = (): SectionKey => {
                        const keys = section.sectionKeys;
                        if (keys.length === 1) return keys[0] as SectionKey;
                        if (mondai.requires_audio && keys.includes("LISTENING")) return "LISTENING";
                        if (mondai.requires_passage && keys.includes("READING")) return "READING";
                        const title = mondai.title || "";
                        if (keys.includes("GRAMMAR") && keys.includes("READING")) {
                          if (mondai.requires_passage || /読解|情報検索|統合/.test(title)) return "READING";
                          return "GRAMMAR";
                        }
                        if (keys.includes("VOCABULARY") && keys.includes("GRAMMAR") && keys.includes("READING")) {
                          if (mondai.requires_passage || /読解|情報検索|統合/.test(title)) return "READING";
                          if (/文法/.test(title)) return "GRAMMAR";
                          return "VOCABULARY";
                        }
                        return keys[0] as SectionKey;
                      };
                      const sectionKey = resolveSectionKey();

                      const overrideInstruction = mondaiOverrides[mondai.number]?.instruction?.trim();
                      const effectiveMondaiTitle = overrideInstruction || mondai.title;

                      let parentId: number | null = derived.existingParent?.id ?? null;
                      let passageSaved = false;

                      const firstQ = questions[0];
                      if (firstQ?.passageText && mondai.requires_passage) {
                        try {
                          setPassageText(firstQ.passageText);

                          const passagePayload: CreateQuestionDTO = {
                            mondaiNumber: mondai.number,
                            mondaiTitle: effectiveMondaiTitle,
                            parentId: null,
                            questionOrder: mondai.start,
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
                          passageSaved = true;
                        } catch (passageErr) {
                          const msg = (passageErr as { messageKey?: string; message?: string; errors?: Record<string, string[]> })?.messageKey
                            ?? Object.values((passageErr as { errors?: Record<string, string[]> })?.errors ?? {}).join("; ")
                            ?? (typeof (passageErr as { message?: string })?.message === "string" ? (passageErr as { message: string }).message : String(passageErr));
                          console.error("Lưu passage thất bại:", msg);
                          toast.error(`Lưu passage thất bại: ${msg}. Vẫn tiếp tục lưu câu hỏi...`);
                        }
                      }

                      let savedCount = 0;
                      let failedCount = 0;
                      for (let i = 0; i < questions.length; i++) {
                        const q = questions[i];
                        if (currentQNum > mondai.end) break;

                        const targetNode = questionsMap[mondai.number];
                        const existingChild = targetNode?.children[currentQNum] ?? null;

                        const parsedOptions = q.options.length === 4 ? q.options : [...q.options, "", "", "", ""].slice(0, 4);

                        const childPayload: CreateQuestionDTO = {
                          mondaiNumber: mondai.number,
                          mondaiTitle: effectiveMondaiTitle,
                          parentId: parentId,
                          questionOrder: currentQNum,
                          section: sectionKey,
                          contentText: q.contentText,
                          options: JSON.stringify(parsedOptions) as unknown as string,
                          correctOption: (q.correctOption ?? 0) + 1,
                          explanation: q.explanation || undefined,
                          points: 1.0,
                          audioMediaId: mondai.requires_audio && !mondai.requires_passage ? (audioMediaId ?? undefined) : undefined,
                          imageMediaId: imageMediaId ?? undefined,
                        };

                        try {
                          if (existingChild) {
                            await updateQuestion({ id: existingChild.id, data: childPayload }).unwrap();
                          } else {
                            await addQuestion({ testId, data: childPayload }).unwrap();
                          }
                          savedCount++;
                        } catch (qErr) {
                          failedCount++;
                          const errMsg = (qErr as { messageKey?: string; message?: string; errors?: Record<string, string[]> })?.messageKey
                            ?? Object.values((qErr as { errors?: Record<string, string[]> })?.errors ?? {}).join("; ")
                            ?? (typeof (qErr as { message?: string })?.message === "string" ? (qErr as { message: string }).message : JSON.stringify(qErr));
                          console.error(`Lưu câu hỏi ${currentQNum} thất bại:`, errMsg);
                        }

                        currentQNum++;
                      }

                      let summaryParts: string[] = [];
                      if (savedCount > 0) summaryParts.push(`${savedCount} câu hỏi`);
                      if (failedCount > 0) summaryParts.push(`${failedCount} câu thất bại`);
                      const summaryText = summaryParts.join(", ") || "0 câu hỏi";

                      if (saveToBank && savedCount > 0) {
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

                          const payloads = questions.slice(0, savedCount).map((q) => ({
                            level: test.level as JLPTLevel,
                            section: sectionKey,
                            difficulty: "MEDIUM" as const,
                            mondaiNumber: mondai.number,
                            mondaiTitle: effectiveMondaiTitle,
                            passageText: q.passageText || undefined,
                            contentText: q.contentText,
                            options: JSON.stringify(q.options),
                            correctOption: (q.correctOption ?? 0) + 1,
                            explanation: q.explanation || undefined,
                            points: 1.0,
                            tags: [baseTags.join(","), extraTag].filter(Boolean).join(","),
                          }));

                          const result = await bulkCreateBank(payloads).unwrap();
                          console.log("[Bank] Saved successfully:", result.length, "items");
                          toast.success(`Đã lưu ${result.length} câu hỏi vào ngân hàng.`);
                        } catch (bankErr) {
                          const msg = (bankErr as { messageKey?: string; message?: string; errors?: Record<string, string[]> })?.messageKey
                            ?? Object.values((bankErr as { errors?: Record<string, string[]> })?.errors ?? {}).join("; ")
                            ?? (typeof (bankErr as { message?: string })?.message === "string" ? (bankErr as { message: string }).message : JSON.stringify(bankErr));
                          console.error("[Bank] Save failed:", msg, bankErr);
                          toast.error(`Lưu ngân hàng câu hỏi thất bại: ${msg}`);
                        }
                      }

                      const finalQNum = Math.min(currentQNum, mondai.end);
                      handleSelectQuestion(finalQNum);

                      if (failedCount === 0) {
                        toast.success(`Đã chèn và lưu thành công ${savedCount} câu hỏi! (Từ câu ${startFrom})`);
                      } else {
                        toast(`Đã lưu ${savedCount}/${savedCount + failedCount} câu hỏi. ${failedCount} câu thất bại — kiểm tra console.`, {
                          duration: 8000,
                        });
                      }

                    } catch (error) {
                      const msg = (error as { messageKey?: string; message?: string; errors?: Record<string, string[]> })?.messageKey
                        ?? Object.values((error as { errors?: Record<string, string[]> })?.errors ?? {}).join("; ")
                        ?? (typeof (error as { message?: string })?.message === "string" ? (error as { message: string }).message : "Lỗi không xác định");
                      console.error("Lỗi khi lưu batch AI:", msg);
                      toast.error(`Có lỗi xảy ra khi lưu hàng loạt câu hỏi: ${msg}`);
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

              {/* Instruction preview */}
              {mondaiOverrides[derived.mondai.number]?.instruction && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 font-jp leading-relaxed">
                  <span className="font-semibold not-font-jp text-amber-600 mr-1">Yêu cầu đề:</span>
                  {mondaiOverrides[derived.mondai.number].instruction}
                </div>
              )}

              {/* Passage Editor */}
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

              {/* Audio (non-passage listening) */}
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
                        toast.error("Hãy chọn (bôi đen) từ bạn muốn gạch chân trước!");
                        return;
                      }
                      const selected = questionText.slice(start, end);
                      const before = questionText.slice(0, start);
                      const after = questionText.slice(end);
                      const newText = `${before}__${selected}__${after}`;
                      setQuestionText(newText);
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
                {questionText && (
                  <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-2">Preview:</span>
                    {renderJlptText(questionText)}
                  </div>
                )}
              </div>

              {/* Image Upload */}
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
                  <Label className="text-sm">
                    {derived.mondai.requires_audio
                      ? "Script nghe *"
                      : "Giải thích (tùy chọn)"}
                  </Label>
                  <Textarea
                    rows={2}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={
                      derived.mondai.requires_audio
                        ? "Nhập script nội dung nghe..."
                        : "Giải thích đáp án đúng..."
                    }
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
                  disabled={
                    saving ||
                    !questionText.trim() ||
                    (derived.mondai.requires_audio && !audioMediaId) ||
                    (derived.mondai.requires_audio && !explanation.trim())
                  }
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
                {derived.mondai.requires_audio && !explanation.trim() && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Bắt buộc nhập script nghe trước khi lưu
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
                          section: derived.section.sectionKeys[0] as SectionKey,
                          questionOrder: selectedQuestionNumber,
                          mondaiNumber: derived.mondai.number,
                          mondaiTitle: derived.mondai.title,
                          parentQuestionId: derived.existingParent?.id ?? null,
                        }).unwrap();
                        setShowBankModal(false);
                        handleSelectQuestion(selectedQuestionNumber);
                      } catch (e) {
                        console.error(e);
                        toast.error("Gắn câu hỏi từ ngân hàng thất bại");
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
