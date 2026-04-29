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
  getMondaiInstruction,
  type JLPTLevel,
  type SectionConfig,
  type MondaiConfig,
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
  childMode?: boolean;
}

const JLPT_MONDAI_DEFAULTS: Record<string, Record<number, { count: number; instruction: string }>> = {
  N5: {
    1:  { count: 9,  instruction: "＿＿の　ことばは　ひらがなで　どう　かきますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    2:  { count: 6,  instruction: "もんだい＿＿＿のことばは　どう　かきますか。１・２・３・４から　いちばん　いいものを　ひとつ　えらんで　ください。" },
    3:  { count: 10, instruction: "もんだい（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    4:  { count: 5,  instruction: "もんだい　＿＿＿の　ぶんと　だいたい　おなじ　いみの　ぶんが　あります。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    5:  { count: 5,  instruction: "もんだい　つぎの　ことばの　つかいかたで　いちばん　いい　ものを　１・２・３・４　から　ひとつ　えらんで　ください。" },
    6:  { count: 5,  instruction: "もんだい　（　　　）に　何を　入れますか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    7:  { count: 6,  instruction: "もんだい　（　　　）に　入る　ものは　どれですか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    8:  { count: 1,  instruction: "問題　次の文章を読んで、文章全体の内容を考えて、（１）から（４）の中に入る最もよいものを、１・２・３・４から一つ選びなさい。" },
    9:  { count: 1,  instruction: "もんだい　つぎの（１）から（４）の文章を読んで、質問に答えてください。こたえは、１・２・３・４からいちばんいいものを一つえらんでください。" },
    10: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いちばんいいものを一つえらんでください。" },
    11: { count: 7,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    12: { count: 7,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    13: { count: 6,  instruction: "もんだい　では、はじめに　しつもんを　きいて　ください。　それから、はなしを　きいて、もんだいようしの　1から　４の　ながから、いい　ものを　ひとつ　えらんで　ください。" },
    14: { count: 16, instruction: "１から３の　ながから、いい　ものを　ひとつ　えらんでください。" },
  },
  N4: {
    1:  { count: 7,  instruction: "＿＿の　ことばは　ひらがなで　どう　かきますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    2:  { count: 6,  instruction: "もんだい＿＿＿のことばは　どう　かきますか。１・２・３・４から　いちばん　いいものを　ひとつ　えらんで　ください。" },
    3:  { count: 10, instruction: "もんだい（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    4:  { count: 5,  instruction: "もんだい　＿＿＿の　ぶんと　だいたい　おなじ　いみの　ぶんが　あります。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    5:  { count: 5,  instruction: "もんだい　つぎの　ことばの　つかいかたで　いちばん　いい　ものを　１・２・３・４　から　ひとつ　えらんで　ください。" },
    6:  { count: 5,  instruction: "もんだい　（　　　）に　入る　ものは　どれですか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    7:  { count: 4,  instruction: "もんだい　（　　　）に　何を　入れますか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    8:  { count: 1,  instruction: "問題　次の文章を読んで、文章全体の内容を考えて、（１）から（４）の中に入る最もよいものを、１・２・３・４から一つ選びなさい。" },
    9:  { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いちばんいいものを一つえらんでください。" },
    10: { count: 1,  instruction: "つぎのを見て、質問に答えてください。答えは、１．２．３．４から、いいものを一つ選んでください。" },
    11: { count: 7,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    12: { count: 7,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    13: { count: 6,  instruction: "もんだい　では、はじめに　しつもんを　きいて　ください。　それから、はなしを　きいて、もんだいようしの　1から　４の　なかから、いい　ものを　ひとつ　えらんで　ください。" },
    14: { count: 16, instruction: "１から３の　ながから、いい　ものを　ひとつ　えらんでください。" },
  },
  N3: {
    1:  { count: 8,  instruction: "＿＿の　ことばは　ひらがなで　どう　かきますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    2:  { count: 6,  instruction: "もんだい＿＿＿のことばは　どう　かきますか。１・２・３・４から　いちばん　いいものを　ひとつ　えらんで　ください。" },
    3:  { count: 11, instruction: "もんだい（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    4:  { count: 5,  instruction: "もんだい　＿＿＿の　ぶんと　だいたい　おなじ　いみの　ぶんが　あります。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    5:  { count: 5,  instruction: "もんだい　つぎの　ことばの　つかいかたで　いちばん　いい　ものを　１・２・３・４　から　ひとつ　えらんで　ください。" },
    6:  { count: 13, instruction: "もんだい　（　　　）に　何を　入れますか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    7:  { count: 5,  instruction: "もんだい　（　　　）に　入る　ものは　どれですか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    8:  { count: 1,  instruction: "問題　次の文章を読んで、文章全体の内容を考えて、（１）から（４）の中に入る最もよいものを、１・２・３・４から一つ選びなさい。" },
    9:  { count: 1,  instruction: "もんだい　つぎの（１）から（４）の文章を読んで、質問に答えてください。こたえは、１・２・３・４からいちばんいいものを一つえらんでください。" },
    10: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いちばんいいものを一つえらんでください。" },
    11: { count: 1,  instruction: "つぎのを見て、質問に答えてください。答えは、１．２．３．４から、いいものを一つ選んでください。" },
    12: { count: 7,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    13: { count: 7,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    14: { count: 6,  instruction: "もんだい　では、はじめに　しつもんを　きいて　ください。　それから、はなしを　きいて、もんだいようしの　1から　４の　なかから、いい　ものを　ひとつ　えらんで　ください。" },
    15: { count: 11, instruction: "１から３の　ながから、いい　ものを　ひとつ　えらんでください。" },
  },
  N2: {
    1:  { count: 5,  instruction: "＿＿の　ことばは　ひらがなで　どう　かきますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    2:  { count: 5,  instruction: "もんだい＿＿＿のことばは　どう　かきますか。１・２・３・４から　いちばん　いいものを　ひとつ　えらんで　ください。" },
    3:  { count: 5,  instruction: "もんだい　つぎの　ぶん中の　＿＿＿の　ぶんと　だいたい　同じ　いみの　ぶぶんが　あります。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    4:  { count: 7,  instruction: "もんだい（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    5:  { count: 5,  instruction: "もんだい　つぎの　ことばの　つかいかたで　いちばん　いい　ものを　１・２・３・４　から　ひとつ　えらんで　ください。" },
    6:  { count: 5,  instruction: "もんだい　つぎの　文中の　＿＿＿の　部分に　入れるのに　最も　いいものを、１・２・３・４から　一つ　選んで　ください。" },
    7:  { count: 10, instruction: "もんだい　（　　　）に　入る　ものは　どれですか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    8:  { count: 6,  instruction: "もんだい　（　　　）に　何を　入れますか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    9:  { count: 1,  instruction: "問題　次の文章を読んで、文章全体の内容を考えて、（１）から（４）の中に入る最もよいものを、１・２・３・４から一つ選びなさい。" },
    10: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いいものを一つ選んでください。" },
    11: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いいものを一つ選んでください。" },
    12: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いいものを一つ選んでください。" },
    13: { count: 1,  instruction: "つぎのを見て、質問に答えてください。答えは、１．２．３．４から、いいものを一つ選んでください。" },
    14: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いいものを一つ選んでください。" },
    15: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・４から、いいものを一つ選んでください。" },
    16: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・٤から、いいものを一つ選んでください。" },
    17: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・٣・٤から、いいものを一つ選んでください。" },
    18: { count: 6,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    19: { count: 6,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    20: { count: 6,  instruction: "もんだい　では、はじめに　しつもんを　きいて　ください。　それから、はなしを　きいて、もんだいようしの　1から　４の　なかから、いい　ものを　ひとつ　えらんで　ください。" },
    21: { count: 18, instruction: "１から３の　ながから、いい　ものを　ひとつ　えらんでください。" },
  },
  N1: {
    1:  { count: 6,  instruction: "＿＿の　ことばは　ひらがなで　どう　かきますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    2:  { count: 7,  instruction: "もんだい（　　　）に　なにを　いれますか。１・２・３・４から　いちばん　いい　ものを　ひとつ　えらんで　ください。" },
    3:  { count: 5,  instruction: "もんだい　つぎの　ことばの　つかいかたで　いちばん　いい　ものを　１・２・３・４　から　ひとつ　えらんで　ください。" },
    4:  { count: 5,  instruction: "もんだい　つぎの　文中の　＿＿＿の　部分に　入れるのに　最も　いいものを、１・２・３・４から　一つ　選んで　ください。" },
    5:  { count: 10, instruction: "もんだい　（　　　）に　入る　ものは　どれですか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    6:  { count: 5,  instruction: "もんだい　（　　　）に　何を　入れますか。１・２・３・４から　いちばん　いい　ものを　一つ　えらんで　ください。" },
    7:  { count: 1,  instruction: "問題　次の文章を読んで、文章全体の内容を考えて、（１）から（４）の中に入る最もよいものを、１・２・３・４から一つ選びなさい。" },
    8:  { count: 1,  instruction: "もんだい　つぎの（１）から（４）の文章を読んで、質問に答えてください。こたえは、１・２・٣・٤からいちばんいいものを一つえらんでください。" },
    9:  { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・３・٤から、いいものを一つ選んでください。" },
    10: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・٣・٤から、いいものを一つ選んでください。" },
    11: { count: 1,  instruction: "つぎのを見て、質問に答えてください。答えは、１．２．٣．٤から、いいものを一つ選んでください。" },
    12: { count: 1,  instruction: "もんだい　つぎの文章を読んで、質問に答えてください。答えは、１・２・٣・٤から、いいものを一つ選んでください。" },
    13: { count: 6,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    14: { count: 6,  instruction: "もんだい　では、まず　しつもんを　聞いて　ください。それから　話を　聞いて、もんだいようしの　1から4の中から、いい　ものを　一つ　えらんで　ください。" },
    15: { count: 6,  instruction: "もんだい　では、はじめに　しつもんを　きいて　ください。　それから、はなしを　きいて、もんだいようしの　1から　４の　なかから、いい　ものを　ひとつ　えらんで　ください。" },
    16: { count: 18, instruction: "１から３の　ながから、いい　ものを　ひとつ　えらんでください。" },
  },
};

interface MondaiNode {
  parent: JlptQuestionAdmin | null;
  children: Record<number, JlptQuestionAdmin>;
}

type QuestionsMap = Record<number, MondaiNode>;

function buildQuestionsMap(questions: JlptQuestionAdmin[]): QuestionsMap {
  const map: QuestionsMap = {};

  // Backend trả về TREE: mỗi item là parent với nested children[]
  questions.forEach((parent) => {
    if (!map[parent.mondaiNumber]) {
      map[parent.mondaiNumber] = { parent: null, children: {} };
    }

    // Nếu parent có nested children
    if (parent.children && parent.children.length > 0) {
      map[parent.mondaiNumber].parent = parent;
      parent.children.forEach((child: JlptQuestionAdmin) => {
        map[parent.mondaiNumber].children[child.questionOrder] = child;
      });
    }
    // Không có children - kiểm tra có phải là standalone question không
    // Listening audio-only questions: có audioMedia nhưng không có options → vẫn là standalone question
    else if (parent.options != null || parent.correctOption != null || parent.audioMedia != null) {
      // Standalone question không có parent (mondai không require_passage)
      map[parent.mondaiNumber].children[parent.questionOrder] = parent;
    } else {
      // Parent không có children và không có options/audio = passage-only
      map[parent.mondaiNumber].parent = parent;
    }
  });

  return map;
}

function isReadingMondaiFn(mondai: { title?: string }) {
  return /読解|情報検索|統合/.test(mondai.title || "");
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionSidebar({
  sections,
  mondaiLeaves,
  mondaiActualStarts,
  selectedQ,
  onSelect,
}: {
  sections: SectionConfig[];
  mondaiLeaves: Map<number, JlptQuestionAdmin[]>;
  mondaiActualStarts: Record<number, number>;
  selectedQ: number | null;
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
            const actualStart = mondaiActualStarts[mondai.number] ?? mondai.start;
            const displayStart = mondai._displayStart ?? actualStart;
            // Đối với passage mondai: count = số câu con (_totalCount)
            // Đối với standalone: count = end - start + 1
            const count = mondai.requires_passage 
              ? (mondai._totalCount ?? 1) 
              : (mondai.end - mondai.start + 1);
            const nums = Array.from({ length: count }, (_, i) => actualStart + i);
            const actualQuestions = mondaiLeaves.get(mondai.number) || [];
            const isPassage = mondai.requires_passage;
            const isReading = isReadingMondaiFn(mondai);

            return (
              <div key={mondai.number} className="px-4 py-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    問題{mondai.number}
                  </span>
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                    {actualQuestions.length}/{count}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 mb-2">{mondai.title}</p>

                <div className="flex gap-1 mb-2">
                  {mondai.requires_audio && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5 border-violet-400 text-violet-600">
                      <Volume2 className="h-2.5 w-2.5" />Audio
                    </Badge>
                  )}
                  {(isPassage || isReading) && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5 border-blue-400 text-blue-600">
                      <FileText className="h-2.5 w-2.5" />Passage
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {nums.map((questionOrder, idx) => {
                    const slotIndex = idx + 1;
                    const isCurrent = selectedQ === questionOrder;
                    const isSaved = actualQuestions.some(q => q.questionOrder === questionOrder && q.mondaiNumber === mondai.number);

                    const displayLabel = isPassage
                      ? `${displayStart}.${slotIndex}`
                      : String(displayStart + idx);

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
  initialOpen = false,
}: {
  mondaiNumber: number;
  passageText: string;
  setPassageText: (v: string) => void;
  requires_audio: boolean;
  audioPreviewUrl: string | null;
  handleAudioUpload: (file: File) => void;
  uploadingAudio: boolean;
  initialOpen?: boolean;
}) {
  // Reading mondai (standalone) always start open; passage mondai only if has existing text
  const hasExistingText = passageText.trim().length > 0;
  const [open, setOpen] = useState(() => initialOpen || hasExistingText);

  const handleToggle = () => {
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

  const { data: test, isLoading, refetch } = useGetTestByIdQuery(testId);
  const [addQuestion] = useAddQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [uploadAudio] = useUploadAudioMutation();
  const [uploadImage] = useUploadImageMutation();
  const [attachFromBank] = useAttachQuestionBankItemToTestMutation();
  const [bulkCreateBank] = useBulkCreateQuestionBankItemsMutation();
  const [updateMondaiCounts] = useUpdateMondaiCountsMutation();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<number | null>(null);
  // (kept for future extensibility, but highlight now uses selectedQuestionNumber directly)
  const [selectedSlotPerMondai, setSelectedSlotPerMondai] = useState<Record<number, number>>({});
  const [showSetup, setShowSetup] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Ref để luôn đọc được audioMediaId mới nhất (không bị stale closure khi save ngay sau upload)
  const audioMediaIdRef = useRef<number | null>(null);

  // ── Mondai config ─────────────────────────────────────────────────────────
  const STORAGE_KEY = `jlpt_mondai_config_${testId}`;
  const [mondaiOverrides, setMondaiOverrides] = useState<Record<number, MondaiOverride>>({});

  useEffect(() => {
    if (!test?.level) return;
    const merged: Record<number, MondaiOverride> = {};

    // Build counts from JLPT_STRUCTURE for this level
    const levelStructure = JLPT_STRUCTURE[test.level as JLPTLevel] || [];
    const levelCounts: Record<number, number> = {};
    levelStructure.forEach((section) => {
      section.mondai.forEach((m) => {
        levelCounts[m.number] = m.end - m.start + 1;
      });
    });

    if (test.mondaiCounts && Object.keys(test.mondaiCounts).length > 0) {
      Object.entries(test.mondaiCounts).forEach(([k, v]) => {
        merged[Number(k)] = {
          count: v,
          instruction: getMondaiInstruction(Number(k)),
          childMode: test.mondaiChildModes?.[Number(k)] ?? false,
        };
      });
    } else {
      Object.entries(levelCounts).forEach(([k, v]) => {
        merged[Number(k)] = {
          count: v,
          instruction: getMondaiInstruction(Number(k)),
          childMode: test.mondaiChildModes?.[Number(k)] ?? false,
        };
      });
    }

    if (test.mondaiChildModes && Object.keys(test.mondaiChildModes).length > 0) {
      Object.entries(test.mondaiChildModes).forEach(([k, v]) => {
        const key = Number(k);
        if (!merged[key]) merged[key] = { count: levelCounts[key] ?? 1, instruction: getMondaiInstruction(key) };
        merged[key].childMode = Boolean(v);
      });
    }

    test.questions?.forEach((q) => {
      if (q.section === "READING" && q.children && q.children.length > 0) {
        const key = q.mondaiNumber;
        if (!merged[key]) merged[key] = { count: levelCounts[key] ?? q.children.length, instruction: getMondaiInstruction(key) };
        merged[key].childMode = true;
        merged[key].count = Math.max(merged[key].count || 0, q.children.length);
      }
    });

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<number, MondaiOverride>;
        Object.entries(stored).forEach(([k, v]) => {
          if (!merged[Number(k)]) merged[Number(k)] = { count: 0, instruction: "" };
          merged[Number(k)].instruction = v.instruction ?? "";
          merged[Number(k)].childMode = v.childMode ?? merged[Number(k)].childMode ?? false;
          if (v.count > 0) merged[Number(k)].count = v.count;
        });
      }
    } catch { /* ignore */ }

    setMondaiOverrides(merged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?.level, test?.mondaiCounts, test?.mondaiChildModes, test?.questions]);

  const updateOverride = useCallback((mondaiNum: number, field: keyof MondaiOverride, value: string | number | boolean) => {
    setMondaiOverrides((prev) => {
      const next = { ...prev, [mondaiNum]: { ...(prev[mondaiNum] ?? { count: 0, instruction: "" }), [field]: value } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if ((field === "count" || field === "childMode") && testId) {
        const counts: Record<number, number> = {};
        const childModes: Record<number, boolean> = {};
        Object.entries(next).forEach(([k, v]) => {
          if (v.count > 0) counts[Number(k)] = v.count;
          childModes[Number(k)] = Boolean(v.childMode);
        });
        updateMondaiCounts({
          testId,
          mondaiCounts: counts,
          mondaiChildModes: childModes,
        }).catch(console.error);
      }
      return next;
    });
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

  // Keep audioMediaIdRef in sync with audioMediaId state
  useEffect(() => { audioMediaIdRef.current = audioMediaId; }, [audioMediaId]);

  // ── Reload form after API refetch ─────────────────────────────────────────
  // Track when questions data was last updated; trigger form reload from fresh data
  const [lastRefetchKey, setLastRefetchKey] = useState(0);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    if (!test?.questions || !selectedQuestionNumber || !derived) return;
    const question = test.questions.find(
      (q) =>
        q.mondaiNumber === derived.mondai.number &&
        q.questionOrder === selectedQuestionNumber
    );
    if (!question) return;

    const isReading = isReadingMondaiFn(derived.mondai);

    // Parse content: for reading standalone → split 【読解】\n<passage>\n\n<question>
    if (isReading && question.contentText?.includes("【読解】")) {
      const parts = question.contentText.split("【読解】\n");
      if (parts.length >= 2) {
        const [passagePart, questionPart] = parts[1].split("\n\n");
        setPassageText(passagePart ?? "");
        setQuestionText(questionPart ?? parts[1]);
      } else {
        setPassageText("");
        setQuestionText(question.contentText ?? "");
      }
    } else {
      setPassageText("");
      setQuestionText(question.contentText ?? "");
    }

    let parsedOptions: string[] = ["", "", "", ""];
    if (question.options) {
      if (Array.isArray(question.options)) {
        parsedOptions = question.options.length === 4 ? question.options : ["", "", "", ""];
      } else if (typeof question.options === "string") {
        try {
          const arr = JSON.parse(question.options as string);
          parsedOptions = Array.isArray(arr) && arr.length === 4 ? arr : ["", "", "", ""];
        } catch { /* leave empty */ }
      }
    }
    setOptions(parsedOptions);
    setCorrectOption(question.correctOption ?? 1);
    setExplanation(question.explanation ?? "");
    setPoints(question.points ?? 1.0);
    setAudioMediaId(question.audioMedia?.id ?? null);
    setAudioPreviewUrl(question.audioMedia?.url ?? null);
    setImageMediaId(question.imageMedia?.id ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadCounter, test?.questions, selectedQuestionNumber]);

  // Increment reload counter after refetch completes
  const handleAfterRefetch = useCallback(() => {
    setReloadCounter((c) => c + 1);
  }, []);

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

  // mondaiCounts từ overrides (từ setup panel/database)
  const mondaiCounts = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    Object.entries(mondaiOverrides).forEach(([k, v]) => { map[Number(k)] = v.count || 0; });
    return map;
  }, [mondaiOverrides]);

  const mondaiChildModes = useMemo<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    Object.entries(mondaiOverrides).forEach(([k, v]) => { map[Number(k)] = Boolean(v.childMode); });
    return map;
  }, [mondaiOverrides]);

  const structure = useMemo<SectionConfig[]>(() => {
    if (!test?.level) return [];

    // Filter sections by testType (e.g. "vocabulary" → only VOCABULARY section)
    const filtered = getStructureForTestType(test.level as JLPTLevel, test.testType ?? "full_test");

    // Always rebuild so slot positions are consistent between admin and exam.
    // rebuildStructureWithCounts handles the zero-count case correctly (uses hardcoded defaults).
    return rebuildStructureWithCounts(test.level as JLPTLevel, mondaiCounts, filtered, mondaiChildModes);
  }, [test?.level, test?.testType, mondaiCounts, mondaiChildModes]);

  const questionsMap = useMemo<QuestionsMap>(() => {
    if (!test?.questions) return {};
    return buildQuestionsMap(test.questions);
  }, [test?.questions]);

  // ── Reverse index: questionOrder → mondaiNumber (for all questions, including AI-created) ──
  const questionOrderToMondaiNumber = useMemo<Map<number, number>>(() => {
    const map = new Map<number, number>();
    if (!test?.questions) return map;
    test.questions.forEach((q) => {
      map.set(q.questionOrder, q.mondaiNumber);
      q.children?.forEach((child) => {
        map.set(child.questionOrder, child.mondaiNumber);
      });
    });
    return map;
  }, [test?.questions]);

  // ── Map from slotIndex → questionOrder for passage mondai children ───────────
  // Built from test.questions by iterating children, sorting by questionOrder within parent, mapping position
  const slotIndexToQuestionOrder = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    if (!test?.questions) return map;

    test.questions.forEach((parent) => {
      const siblings = [...(parent.children ?? [])]
        .sort((a, b) => a.questionOrder - b.questionOrder);
      siblings.forEach((child, idx) => {
        map.set(`${parent.mondaiNumber}:${idx + 1}`, child.questionOrder);
      });
    });
    return map;
  }, [test?.questions]);

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

    // First try findMondaiInStructure (works for questions within structure range)
    let found = findMondaiInStructure(selectedQuestionNumber);
    let mondaiNum = found?.mondai.number;

    // If not found, try reverse index from questionsMap (works for AI-created questions)
    if (!found || mondaiNum == null) {
      mondaiNum = questionOrderToMondaiNumber.get(selectedQuestionNumber);
      if (mondaiNum != null) {
        // Find mondai from structure by mondaiNumber
        for (const section of structure) {
          const m = section.mondai.find(m => m.number === mondaiNum);
          if (m) { found = { section, mondai: m, passageSlotIndex: null }; break; }
        }
      }
    }

    if (!found || mondaiNum == null) return null;
    const node = questionsMap[mondaiNum];
    const slotIdx = selectedSlotPerMondai[mondaiNum] ?? found.passageSlotIndex;

    let existingChild: JlptQuestionAdmin | null = null;
    if (found.mondai.requires_passage && slotIdx != null) {
      const qOrder = slotIndexToQuestionOrder.get(`${found.mondai.number}:${slotIdx}`);
      if (qOrder != null) {
        existingChild = node?.children[qOrder] ?? null;
      }
    } else {
      existingChild = node?.children[selectedQuestionNumber] ?? null;
    }

    const existingParent = node?.parent ?? null;
    return { ...found, node, existingChild, existingParent, slotIdx };
  }, [selectedQuestionNumber, findMondaiInStructure, questionsMap, slotIndexToQuestionOrder, selectedSlotPerMondai, questionOrderToMondaiNumber, structure]);

  // ── Question bank query ───────────────────────────────────────────────────
  // ── mondaiNumber → ACTUAL starting questionOrder from the rebuilt structure ─
  // Must use the rebuilt structure's m.start (which reflects correct slot positions)
  // NOT the hardcoded static JLPT_STRUCTURE values (which differ for N3 passage mondai)
  const mondaiActualStarts = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    structure.forEach(s => s.mondai.forEach(m => {
      map[m.number] = m.start;
    }));
    return map;
  }, [structure]);

  const mondaiLeaves = useMemo<Map<number, JlptQuestionAdmin[]>>(() => {
    const leavesMap = new Map<number, JlptQuestionAdmin[]>();
    if (!test?.questions) return leavesMap;

    // Backend trả về TREE: parent có nested children[]
    // mondaiLeaves chứa children (sub-questions), KHÔNG count parent
    // Áp dụng cho TẤT CẢ mondai (bao gồm cả Listening) để sidebar highlight đúng
    test.questions.forEach((parent) => {
      const mondaiNum = parent.mondaiNumber;
      
      // Có children → extract children
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach((child: JlptQuestionAdmin) => {
          if (!leavesMap.has(mondaiNum)) leavesMap.set(mondaiNum, []);
          leavesMap.get(mondaiNum)!.push(child);
        });
      }
      
      // Không có children nhưng có options → standalone question
      if ((!parent.children || parent.children.length === 0) && 
          (parent.options != null || parent.correctOption != null)) {
        if (!leavesMap.has(mondaiNum)) leavesMap.set(mondaiNum, []);
        leavesMap.get(mondaiNum)!.push(parent);
      }
    });
    
    return leavesMap;
  }, [test?.questions]);
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
      const parent: JlptQuestionAdmin | null = node?.parent ?? null;
      if (isPassage && effectiveSlot != null) {
        const qOrder = slotIndexToQuestionOrder.get(`${found.mondai.number}:${effectiveSlot}`);
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
    // Find mondai config from structure by mondaiNumber
    let mondaiConfig: MondaiConfig | null = null;
    for (const section of structure) {
      const m = section.mondai.find(m => m.number === mondaiNum);
      if (m) { mondaiConfig = m; break; }
    }
    const isPassage = mondaiConfig?.requires_passage ?? false;

    let child: JlptQuestionAdmin | null = null;
    const parent: JlptQuestionAdmin | null = node?.parent ?? null;

    if (isPassage && effectiveSlotIdx != null) {
      const qOrder = slotIndexToQuestionOrder.get(`${mondaiNum}:${effectiveSlotIdx}`);
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
  }, [findMondaiInStructure, questionsMap, slotIndexToQuestionOrder, selectedSlotPerMondai, structure]);

  // ── Populate form from derived (question data) whenever reloadCounter changes ──
  // This ensures form always reads fresh data after refetch, even when handleSelectQuestion
  // is called via setTimeout before refetch completes
  useEffect(() => {
    if (!derived || !selectedQuestionNumber) return;
    const { node, existingChild, existingParent } = derived;
    const isPassage = derived.mondai.requires_passage;
    const parent = existingParent ?? node?.parent ?? null;

    // For passage: read from parent; for standalone: child IS the question
    if (isPassage) {
      setPassageText(parent?.contentText ?? "");
      setQuestionText(existingChild?.contentText ?? "");
      let parsedOptions: string[] = ["", "", "", ""];
      if (existingChild?.options) {
        if (Array.isArray(existingChild.options)) {
          parsedOptions = existingChild.options.length === 4 ? existingChild.options : ["", "", "", ""];
        } else if (typeof existingChild.options === "string") {
          try {
            const arr = JSON.parse(existingChild.options as string);
            parsedOptions = Array.isArray(arr) && arr.length === 4 ? arr : ["", "", "", ""];
          } catch {}
        }
      }
      setOptions(parsedOptions);
      setCorrectOption(existingChild?.correctOption ?? 1);
      setExplanation(existingChild?.explanation ?? "");
      setPoints(existingChild?.points ?? 1.0);
      setAudioMediaId(existingChild?.audioMedia?.id ?? parent?.audioMedia?.id ?? null);
      setAudioPreviewUrl(existingChild?.audioMedia?.url ?? parent?.audioMedia?.url ?? null);
      setImageMediaId(existingChild?.imageMedia?.id ?? null);
    } else {
      // Standalone question: child IS the question record
      // For READING standalone (読解/情報検索/統合): extract passage from 【読解】\n...\n\n... format
      const isReadingStandalone = isReadingMondaiFn(derived.mondai);
      const rawContent = existingChild?.contentText ?? "";
      let extractedPassage = "";
      let extractedQuestion = rawContent;
      if (isReadingStandalone) {
        const match = rawContent.match(/^【読解】\s*\n([\s\S]+?)\n\n([\s\S]+)$/);
        if (match) {
          extractedPassage = match[1];
          extractedQuestion = match[2];
        }
      }

      setPassageText(extractedPassage);
      setQuestionText(extractedQuestion);
      let parsedOptions: string[] = ["", "", "", ""];
      if (existingChild?.options) {
        if (Array.isArray(existingChild.options)) {
          parsedOptions = existingChild.options.length === 4 ? existingChild.options : ["", "", "", ""];
        } else if (typeof existingChild.options === "string") {
          try {
            const arr = JSON.parse(existingChild.options as string);
            parsedOptions = Array.isArray(arr) && arr.length === 4 ? arr : ["", "", "", ""];
          } catch {}
        }
      }
      setOptions(parsedOptions);
      setCorrectOption(existingChild?.correctOption ?? 1);
      setExplanation(existingChild?.explanation ?? "");
      setPoints(existingChild?.points ?? 1.0);
      setAudioMediaId(existingChild?.audioMedia?.id ?? null);
      setAudioPreviewUrl(existingChild?.audioMedia?.url ?? null);
      setImageMediaId(existingChild?.imageMedia?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadCounter, derived]);

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
    // Is this a standalone READING mondai (読解/情報検索/統合 in title)?
    const isReadingStandalone = isReadingMondaiFn(mondai) && !isPassage;
    // Always use mondai.start as the authoritative start position for passage mondai
    // This ensures children are correctly numbered: mondai.start (passage), mondai.start+1, mondai.start+2...
    const mondaiStart = mondai.start;
    const questionOrder = isPassage && passageSlotIndex != null
      ? mondaiStart + passageSlotIndex - 1
      : selectedQuestionNumber;

    const resolveSectionKey = (): SectionKey => {
      const keys = section.sectionKeys;
      if (keys.length === 1) return keys[0] as SectionKey;
      if (mondai.requires_audio && keys.includes("LISTENING")) return "LISTENING";
      const title = mondai.title || "";
      if (keys.includes("GRAMMAR") && keys.includes("READING")) {
        if (isReadingMondaiFn(mondai) || mondai.requires_passage) return "READING";
        return "GRAMMAR";
      }
      if (keys.includes("VOCABULARY") && keys.includes("GRAMMAR") && keys.includes("READING")) {
        if (isReadingMondaiFn(mondai) || mondai.requires_passage) return "READING";
        if (/文法/.test(title)) return "GRAMMAR";
        return "VOCABULARY";
      }
      return keys[0] as SectionKey;
    };

    const sectionKey = resolveSectionKey();

    setSaving(true);
    try {
      let parentId: number | null = existingParent?.id ?? null;

      const overrideInstruction = mondaiOverrides[mondai.number]?.instruction?.trim();
      const effectiveMondaiTitle = overrideInstruction || mondai.title;

      // PASSAGE mondai (requires_passage=true): save passage separately + question as child
      if (isPassage && passageText.trim()) {
        const passagePayload: CreateQuestionDTO = {
          mondaiNumber: mondai.number,
          mondaiTitle: effectiveMondaiTitle,
          parentId: null,
          questionOrder: mondaiStart,
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

      // Build content: for standalone READING → merge passageText + questionText into one
      const combinedContent = isReadingStandalone && passageText.trim()
        ? `【読解】\n${passageText.trim()}\n\n${questionText}`
        : questionText;

      const childPayload: CreateQuestionDTO = {
        mondaiNumber: mondai.number,
        mondaiTitle: effectiveMondaiTitle,
        parentId: isReadingStandalone ? null : parentId,
        questionOrder,
        section: sectionKey,
        contentText: combinedContent,
        options: JSON.stringify(options) as unknown as string,
        correctOption,
        explanation: explanation || undefined,
        points,
        audioMediaId: mondai.requires_audio && !isPassage ? (audioMediaIdRef.current ?? undefined) : undefined,
        imageMediaId: imageMediaId ?? undefined,
      };

      let savedQuestion: JlptQuestionAdmin;
      if (existingChild) {
        savedQuestion = await updateQuestion({ id: existingChild.id, data: childPayload }).unwrap();
      } else {
        savedQuestion = await addQuestion({ testId, data: childPayload }).unwrap();
      }

      // Update local media state from saved response so AudioUploader shows the correct
      // audio immediately — before refetch completes and before handleSelectQuestion
      // re-reads from the stale questionsMap cache.
      if (savedQuestion.audioMedia) {
        setAudioMediaId(savedQuestion.audioMedia.id);
        setAudioPreviewUrl(savedQuestion.audioMedia.url);
      }
      if (savedQuestion.imageMedia) {
        setImageMediaId(savedQuestion.imageMedia.id);
      }

      // Reload data after save
      await refetch();
      handleAfterRefetch();

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
      toast.error(`Lưu câu hỏi thất bại: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Human-readable label for selected question ─────────────────────────────
  const selectedSubLabel = useMemo(() => {
    if (!selectedQuestionNumber) return "";
    if (!derived) return String(selectedQuestionNumber);
    const displayStart = derived.mondai._displayStart ?? derived.mondai.start;
    if (derived.mondai.requires_passage && derived.slotIdx != null) {
      return `${displayStart}.${derived.slotIdx}`;
    }
    return String(displayStart + Math.max(0, selectedQuestionNumber - derived.mondai.start));
  }, [derived, selectedQuestionNumber]);

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
          {!derived || !derived.section.sectionKeys.includes("LISTENING") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPanel((s) => !s)}
            className={showAIPanel ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20" : ""}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            AI Tạo câu hỏi
          </Button>
          )}
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
                  const canCreateChildren = isReadingMondaiFn(mondai);
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

                      <div className="grid grid-cols-[180px_1fr] gap-4 items-start">
                        <div className="space-y-1">
                          <Label className="text-xs">{ov?.childMode ? "Số câu con" : "Số câu hỏi"}</Label>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            placeholder={String(defaultCount ? defaultCount.end - defaultCount.start + 1 : "")}
                            value={ov?.count || ""}
                            onChange={(e) => updateOverride(mondai.number, "count", Number(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                          {canCreateChildren && (
                            <label className="flex items-center gap-2 pt-2 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(ov?.childMode)}
                                onChange={(e) => updateOverride(mondai.number, "childMode", e.target.checked)}
                                className="h-4 w-4 rounded border-border"
                              />
                              Tạo câu con
                            </label>
                          )}
                          {canCreateChildren && ov?.childMode && (
                            <p className="text-[10px] text-muted-foreground">
                              VD: {mondai._displayStart ?? mondai.start}.1, {mondai._displayStart ?? mondai.start}.2...
                            </p>
                          )}
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
          mondaiActualStarts={mondaiActualStarts}
          selectedQ={selectedQuestionNumber}
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
              {showAIPanel && derived ? (() => {
                const actualStart = mondaiActualStarts[derived.mondai.number] ?? derived.mondai.start;
                const count = derived.mondai._totalCount ?? (derived.mondai.end - derived.mondai.start + 1);
                const actualEnd = actualStart + count - 1;
                
                // Xác định section đúng: nếu mondai requires_passage hoặc có từ khóa đọc thì là READING
                const resolveAIGeneratorSection = (): "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING" => {
                  if (derived.mondai.requires_passage || isReadingMondaiFn(derived.mondai)) return "READING";
                  if (derived.section.sectionKeys.includes("LISTENING")) return "LISTENING";
                  if (derived.section.sectionKeys.includes("VOCABULARY")) return "VOCABULARY";
                  if (derived.section.sectionKeys.includes("GRAMMAR")) return "GRAMMAR";
                  return derived.section.sectionKeys[0] as "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";
                };
                const aiSection = resolveAIGeneratorSection();
                // requiresPassage = true for passage mondai (keep AI in passage mode)
                // For standalone reading, AI should NOT use passage mode (it'll be handled by isStandaloneReading in component)
                const isReadingStandalone = !derived.mondai.requires_passage && isReadingMondaiFn(derived.mondai);
                
                return (
                <AIQuestionGenerator
                  level={test.level}
                  mondaiNumber={derived.mondai.number}
                  mondaiTitle={mondaiOverrides[derived.mondai.number]?.instruction || derived.mondai.title}
                  mondaiStart={derived.mondai.start}
                  mondaiEnd={derived.mondai.start + count - 1}
                  initialStart={selectedQuestionNumber}
                  section={aiSection}
                  subLabels={{}}
                  requiresPassage={isReadingStandalone ? false : derived.mondai.requires_passage}
                  onConfirm={async (questions: AIGeneratedQuestion[], startFrom: number, saveToBank: boolean) => {
                    if (!derived) return;

                    setSaving(true);
                    setShowAIPanel(false);

                    try {
                      const { section, mondai } = derived;
                      const mondaiStart = mondai.start;
                      const isPassage = mondai.requires_passage;
                      const isReadingStandaloneAI = !isPassage && isReadingMondaiFn(mondai);

                      // For standalone READING: sync passageText state from AI data before processing
                      // This ensures the AI-generated passage is available when building combinedContent
                      if (isReadingStandaloneAI && questions[0]?.passageText) {
                        setPassageText(questions[0].passageText);
                      }

                      const sectionKey: SectionKey = (() => {
                        if (section.sectionKeys.includes("LISTENING")) return "LISTENING";
                        if (section.sectionKeys.includes("VOCABULARY")) return "VOCABULARY";
                        if (section.sectionKeys.includes("GRAMMAR") && section.sectionKeys.includes("READING")) {
                          return (isReadingStandaloneAI || isPassage) ? "READING" : "GRAMMAR";
                        }
                        if (section.sectionKeys.includes("GRAMMAR")) return "GRAMMAR";
                        return section.sectionKeys[0] as SectionKey;
                      })();

                      const effectiveMondaiTitle = mondaiOverrides[mondai.number]?.instruction?.trim() || mondai.title;

                      // For standalone READING: enforce exactly 1 question per mondai (defensive — in case AI ignores count=1)
                      const questionsToSave = isReadingStandaloneAI ? questions.slice(0, 1) : questions;
                      let savedCount = 0;
                      let failedCount = 0;

                      // ========== PARENT-CHILD STRUCTURE ==========
                      if (isPassage) {
                        // 1. Lưu passage vào parent
                        const firstQ = questions[0];
                        let parentId: number | null = derived.existingParent?.id ?? null;
                        
                        if (firstQ?.passageText) {
                          try {
                            setPassageText(firstQ.passageText);
                            const passagePayload: CreateQuestionDTO = {
                              mondaiNumber: mondai.number,
                              mondaiTitle: effectiveMondaiTitle,
                              parentId: null,
                              questionOrder: mondaiStart,
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
                              // CRITICAL: use the NEWLY CREATED passage's ID for children
                              // Previously this used the old parentId (= null) which orphaned all children
                              parentId = created.id;
                            }
                          } catch (passageErr) {
                            toast.error(`Lưu passage thất bại: ${(passageErr as Error).message}`);
                            setSaving(false);
                            return;
                          }
                        }

                        // 2. Lưu children bắt đầu từ mondaiStart + 1
                        // CRITICAL: skip questions[0] only when passage was actually saved above.
                        // If firstQ has NO passageText (passage not saved), questions[0] IS the first child.
                        const hasSavedPassage = firstQ?.passageText;
                        const childStart = hasSavedPassage ? 1 : 0;
                        let currentQNum = mondaiStart;

                        for (let i = childStart; i < questions.length; i++) {
                          const q = questions[i];
                          const targetNode = questionsMap[mondai.number];
                          const existingChild = targetNode?.children[currentQNum] ?? null;

                          const parsedOptions = q.options.length === 4 ? q.options : ["", "", "", ""];

                          const childPayload: CreateQuestionDTO = {
                            mondaiNumber: mondai.number,
                            mondaiTitle: effectiveMondaiTitle,
                            parentId,
                            questionOrder: currentQNum,
                            section: sectionKey,
                            contentText: q.contentText,
                            options: JSON.stringify(parsedOptions) as unknown as string,
                            correctOption: (q.correctOption != null && q.correctOption >= 1 && q.correctOption <= 4) ? q.correctOption : 1,
                            explanation: q.explanation || undefined,
                            points: 1.0,
                            audioMediaId: mondai.requires_audio ? (audioMediaId ?? undefined) : undefined,
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
                            toast.error(`Lưu câu ${currentQNum} thất bại: ${(qErr as Error).message}`);
                          }

                          currentQNum++;
                        }

                      } else {
                        // ========== STANDALONE (no passage / non-passage mondai) ==========
                        // For standalone READING mondai: passage + question → 1 combined question at mondai.start
                        // For other standalone: each AI question → 1 record
                        const isStandaloneReading = isReadingStandaloneAI;

                        for (let i = 0; i < questionsToSave.length; i++) {
                          const q = questionsToSave[i];
                          const targetNode = questionsMap[mondai.number];
                          const existingChild = targetNode?.children[startFrom] ?? null;

                          const parsedOptions = q.options.length === 4 ? q.options : ["", "", "", ""];

                          if (isStandaloneReading) {
                            // READING standalone: merge passage+question into 1 question at mondai.start
                            // Discard extra questions beyond the first one (mondai has only 1 slot)
                            const combinedContent = q.passageText
                              ? `【読解】\n${q.passageText}\n\n${q.contentText}`
                              : q.contentText;

                            const childPayload: CreateQuestionDTO = {
                              mondaiNumber: mondai.number,
                              mondaiTitle: effectiveMondaiTitle,
                              parentId: null,
                              questionOrder: startFrom,
                              section: sectionKey,
                              contentText: combinedContent,
                              options: JSON.stringify(parsedOptions) as unknown as string,
                              correctOption: (q.correctOption != null && q.correctOption >= 1 && q.correctOption <= 4) ? q.correctOption : 1,
                              explanation: q.explanation || undefined,
                              points: 1.0,
                              audioMediaId: mondai.requires_audio ? (audioMediaId ?? undefined) : undefined,
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
                              toast.error(`Lưu câu ${startFrom} thất bại: ${(qErr as Error).message}`);
                            }
                            // Only save the first question for standalone reading (mondai has 1 slot)
                            break;
                          } else {
                            // Other standalone sections: save each question sequentially
                            const childPayload: CreateQuestionDTO = {
                              mondaiNumber: mondai.number,
                              mondaiTitle: effectiveMondaiTitle,
                              parentId: null,
                              questionOrder: startFrom + i,
                              section: sectionKey,
                              contentText: q.contentText,
                              options: JSON.stringify(parsedOptions) as unknown as string,
                              correctOption: (q.correctOption != null && q.correctOption >= 1 && q.correctOption <= 4) ? q.correctOption : 1,
                              explanation: q.explanation || undefined,
                              points: 1.0,
                              audioMediaId: mondai.requires_audio ? (audioMediaId ?? undefined) : undefined,
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
                              toast.error(`Lưu câu ${startFrom + i} thất bại: ${(qErr as Error).message}`);
                            }
                          }
                        }
                      }

                      // Lưu vào ngân hàng
                      if (saveToBank && savedCount > 0) {
                        try {
                          const payloads = questions.slice(0, savedCount).map((q) => ({
                            level: test.level as JLPTLevel,
                            section: sectionKey,
                            difficulty: "MEDIUM" as const,
                            mondaiNumber: mondai.number,
                            mondaiTitle: effectiveMondaiTitle,
                            passageText: isPassage ? (q.passageText || undefined) : undefined,
                            contentText: q.contentText,
                            options: JSON.stringify(q.options),
                            correctOption: (q.correctOption != null && q.correctOption >= 1 && q.correctOption <= 4) ? q.correctOption : 1,
                            explanation: q.explanation || undefined,
                            points: 1.0,
                            tags: [test.level, sectionKey, "ai"].join(","),
                          }));
                          await bulkCreateBank(payloads).unwrap();
                          toast.success(`Đã lưu ${savedCount} câu vào ngân hàng.`);
                        } catch (bankErr) {
                          toast.error(`Lưu ngân hàng thất bại: ${(bankErr as Error).message}`);
                        }
                      }

                      const finalQNum = isPassage ? mondaiStart : (savedCount > 0 ? startFrom + savedCount - 1 : startFrom);
                      const savedFinalQNum = finalQNum;

                      if (failedCount === 0) {
                        toast.success(`Đã lưu ${savedCount} câu hỏi!`);
                      } else {
                        toast(`Đã lưu ${savedCount}/${savedCount + failedCount} câu.`);
                      }

                      await refetch();
                      handleAfterRefetch();

                      // Select question AFTER reloadCounter updates so the form reads fresh data
                      setTimeout(() => handleSelectQuestion(savedFinalQNum), 0);

                    } catch (error) {
                      toast.error(`Có lỗi xảy ra khi lưu: ${(error as Error).message}`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
                );
              })() : null}

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

              {/* Passage Editor — hiện cho cả passage mondai VÀ standalone reading mondai */}
              {(derived.mondai.requires_passage || isReadingMondaiFn(derived.mondai)) && (
                <PassagePanel
                  mondaiNumber={derived.mondai.number}
                  passageText={passageText}
                  setPassageText={setPassageText}
                  requires_audio={derived.mondai.requires_audio}
                  audioPreviewUrl={audioPreviewUrl}
                  handleAudioUpload={handleAudioUpload}
                  uploadingAudio={uploadingAudio}
                  initialOpen={isReadingMondaiFn(derived.mondai)}
                />
              )}

              {/* Audio (non-passage listening) */}
              {derived.mondai.requires_audio && !derived.mondai.requires_passage && !isReadingMondaiFn(derived.mondai) && (
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
                  disabled={
                    saving ||
                    uploadingAudio ||
                    !questionText.trim()
                  }
                  className="min-w-32"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Lưu câu {selectedSubLabel}</>
                  )}
                </Button>
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
                        toast.error(`Gắn câu hỏi thất bại: ${(e as Error).message}`);
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
