"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetAdminVoiceTopicQuery,
  useGetScenariosQuery,
  useCreateScenarioMutation,
  useUpdateScenarioMutation,
  useDeleteScenarioMutation,
  useGenerateScenarioAIMutation,
  type VoiceScenario,
  type VoiceScenarioRequest,
} from "@/store/services/admin/voiceTopicApi";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { VocabularyEditor } from "@/components/admin/VocabularyEditor";
import { GrammarEditor } from "@/components/admin/GrammarEditor";

const LEVEL_COLORS: Record<string, string> = {
  N1: "bg-red-500",
  N2: "bg-orange-500",
  N3: "bg-yellow-500",
  N4: "bg-blue-500",
  N5: "bg-green-500",
};

const EMPTY_FORM: VoiceScenarioRequest = {
  title: "",
  level: "N4",
  situation: "",
  aiRole: "",
  aiPersonality: "Thân thiện, kiên nhẫn",
  openingLine: "",
  sampleConversation: "",
  keyVocabulary: "[]",
  keyGrammar: "[]",
  expectedTurns: 6,
  difficultyNotes: "",
};

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = Number(params.id);

  const { data: topic, isLoading: topicLoading } =
    useGetAdminVoiceTopicQuery(topicId);
  const { data: scenarios = [], isLoading: scenariosLoading } =
    useGetScenariosQuery(topicId);
  const [createScenario, { isLoading: isCreating }] =
    useCreateScenarioMutation();
  const [updateScenario, { isLoading: isUpdating }] =
    useUpdateScenarioMutation();
  const [deleteScenario] = useDeleteScenarioMutation();
  const [generateAI, { isLoading: isGenerating }] =
    useGenerateScenarioAIMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VoiceScenarioRequest>(EMPTY_FORM);

  // AI Generate form
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiSituation, setAiSituation] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [aiPersonality, setAiPersonality] = useState("Thân thiện, kiên nhẫn");
  const [aiLevel, setAiLevel] = useState("N4");
  const [aiTurns, setAiTurns] = useState(6);
  const [aiResult, setAiResult] = useState<VoiceScenarioRequest | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };
  const openEdit = (s: VoiceScenario) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      level: s.level,
      situation: s.situation,
      aiRole: s.aiRole || "",
      aiPersonality: s.aiPersonality || "",
      openingLine: s.openingLine || "",
      sampleConversation: s.sampleConversation || "",
      keyVocabulary: s.keyVocabulary || "[]",
      keyGrammar: s.keyGrammar || "[]",
      expectedTurns: s.expectedTurns,
      difficultyNotes: s.difficultyNotes || "",
    });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setAiResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateScenario({
          topicId,
          scenarioId: editingId,
          data: form,
        }).unwrap();
      } else {
        await createScenario({ topicId, data: form }).unwrap();
      }
      closeForm();
    } catch {
      alert("Thất bại!");
    }
  };

  const handleAIGenerate = async () => {
    if (!aiTitle.trim() || !aiSituation.trim())
      return alert("Nhập tiêu đề và tình huống kịch bản");
    try {
      const result = await generateAI({
        topicTitle: topic?.title || "",
        title: aiTitle,
        situation: aiSituation,
        aiRole: aiRole,
        aiPersonality: aiPersonality,
        level: aiLevel,
        expectedTurns: aiTurns,
      }).unwrap();
      setAiResult(result);
      // Pre-fill form with AI result (and manual inputs)
      setForm({
        title: aiTitle,
        level: aiLevel,
        situation: aiSituation,
        aiRole: aiRole,
        aiPersonality: aiPersonality,
        openingLine: result.openingLine || "",
        sampleConversation: result.sampleConversation || "",
        keyVocabulary:
          typeof result.keyVocabulary === "string"
            ? result.keyVocabulary
            : JSON.stringify(result.keyVocabulary || [], null, 2),
        keyGrammar:
          typeof result.keyGrammar === "string"
            ? result.keyGrammar
            : JSON.stringify(result.keyGrammar || [], null, 2),
        expectedTurns: aiTurns,
        difficultyNotes: result.difficultyNotes || "",
      });
      setShowAIForm(false);
      setEditingId(null);
      setShowForm(true); // Show filled form for review
    } catch (err: any) {
      alert(
        "AI generate thất bại: " + (err?.data || err?.message || "Unknown"),
      );
    }
  };

  if (topicLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Topic không tồn tại
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/voice-topics")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{topic.title}</h1>
          {topic.titleJp && (
            <p className="text-muted-foreground">{topic.titleJp}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowAIForm(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Tạo bằng AI
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo thủ công
        </Button>
      </div>

      {/* Scenarios table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Kịch bản hội thoại ({scenarios.length})
          </CardTitle>
          <CardDescription>
            Mỗi kịch bản là một tình huống cụ thể với level riêng
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Kịch bản</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Vai trò AI</TableHead>
                <TableHead>Lượt nói</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenariosLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : scenarios.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có kịch bản — bấm &quot;Tạo bằng AI&quot; hoặc
                    &quot;Tạo thủ công&quot;
                  </TableCell>
                </TableRow>
              ) : (
                scenarios.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {s.situation}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${LEVEL_COLORS[s.level] || "bg-gray-500"} text-white`}
                      >
                        {s.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{s.aiRole || "—"}</TableCell>
                    <TableCell className="text-sm">{s.expectedTurns}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "default" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(s)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Xóa "${s.title}"?`))
                                deleteScenario({ topicId, scenarioId: s.id });
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══ AI Generate Form ═══ */}
      {showAIForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowAIForm(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="flex min-h-full items-start justify-center px-4 py-10">
              <div
                className="w-full max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="shadow-2xl">
                  <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Tạo kịch bản bằng AI
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Mô tả ngắn → AI tạo kịch bản → bạn review & lưu
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAIForm(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tiêu đề kịch bản *</Label>
                      <Input
                        placeholder="VD: Mua táo ở siêu thị"
                        value={aiTitle}
                        onChange={(e) => setAiTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tình huống *</Label>
                      <Textarea
                        placeholder="VD: Hỏi giá trái cây ở siêu thị, trả tiền mặt"
                        rows={2}
                        value={aiSituation}
                        onChange={(e) => setAiSituation(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vai trò AI</Label>
                        <Input
                          placeholder="Nhân viên"
                          value={aiRole}
                          onChange={(e) => setAiRole(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tính cách AI</Label>
                        <Input
                          placeholder="Thân thiện"
                          value={aiPersonality}
                          onChange={(e) => setAiPersonality(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Select value={aiLevel} onValueChange={setAiLevel}>
                          <SelectTrigger>
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
                        <Label>Số lượt nói</Label>
                        <Input
                          type="number"
                          min={3}
                          max={20}
                          value={aiTurns}
                          onChange={(e) =>
                            setAiTurns(parseInt(e.target.value) || 6)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAIGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate kịch bản
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ Create/Edit Scenario Form ═══ */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={closeForm}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="flex min-h-full items-start justify-center px-4 py-6">
              <div
                className="w-full max-w-2xl pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleSubmit}>
                  <Card className="shadow-2xl">
                    <CardHeader className="flex flex-row items-start justify-between pb-3">
                      <div>
                        <CardTitle>
                          {aiResult
                            ? "Review kịch bản AI"
                            : editingId
                              ? "Sửa kịch bản"
                              : "Tạo kịch bản mới"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {aiResult
                            ? "AI đã tạo — kiểm tra và chỉnh sửa nếu cần"
                            : "Điền thông tin kịch bản"}
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={closeForm}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                      {/* Title + Level */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Tiêu đề *</Label>
                          <Input
                            value={form.title}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, title: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Level *</Label>
                          <Select
                            value={form.level}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, level: v }))
                            }
                          >
                            <SelectTrigger>
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
                      </div>

                      {/* Situation */}
                      <div className="space-y-2">
                        <Label>Tình huống *</Label>
                        <Textarea
                          rows={2}
                          value={form.situation}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              situation: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      {/* AI Role + Personality */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Vai trò AI</Label>
                          <Input
                            placeholder="VD: Nhân viên siêu thị"
                            value={form.aiRole || ""}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, aiRole: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Số lượt nói</Label>
                          <Input
                            type="number"
                            min={3}
                            max={20}
                            value={form.expectedTurns}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                expectedTurns: parseInt(e.target.value) || 6,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tính cách AI</Label>
                        <Input
                          value={form.aiPersonality || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              aiPersonality: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Opening line */}
                      <div className="space-y-2">
                        <Label>Câu mở đầu (tiếng Nhật)</Label>
                        <Input
                          placeholder="いらっしゃいませ！"
                          value={form.openingLine || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              openingLine: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Sample conversation */}
                      <div className="space-y-2">
                        <Label>Hội thoại mẫu</Label>
                        <Textarea
                          className="font-mono text-xs"
                          rows={5}
                          placeholder={
                            "User: すみません、このりんごはいくらですか？\nAI: 1個200円です。\nUser: 3個ください。"
                          }
                          value={form.sampleConversation || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              sampleConversation: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Key vocabulary & grammar */}
                      <div className="grid grid-cols-2 gap-4">
                        <VocabularyEditor
                          value={form.keyVocabulary || "[]"}
                          onChange={(json) =>
                            setForm((f) => ({ ...f, keyVocabulary: json }))
                          }
                        />
                        <GrammarEditor
                          value={form.keyGrammar || "[]"}
                          onChange={(json) =>
                            setForm((f) => ({ ...f, keyGrammar: json }))
                          }
                        />
                      </div>

                      {/* Difficulty notes */}
                      <div className="space-y-2">
                        <Label>Ghi chú độ khó</Label>
                        <Textarea
                          rows={2}
                          value={form.difficultyNotes || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              difficultyNotes: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeForm}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreating || isUpdating}
                        >
                          {(isCreating || isUpdating) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {aiResult
                            ? "Lưu kịch bản AI"
                            : editingId
                              ? "Cập nhật"
                              : "Tạo kịch bản"}
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
