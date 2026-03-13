"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  FileText,
  Video,
  Upload,
  Plus,
  X,
  Sparkles,
  ListChecks,
  PenLine,
  Volume2,
  Shuffle,
  Mic,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import {
  useCreateLessonMutation,
  useUpdateLessonMutation,
} from "@/store/services/courseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LessonResponseDTO } from "@/types/course";
import type {
  LessonType,
  TaskType,
  MultipleChoiceQuestion,
  FillBlankItem,
  MatchingItem,
  ListeningQuestion,
} from "./types";
import {
  parseMultipleChoice,
  parseFillBlank,
  parseMatching,
  parseListening,
  getMultiAddFormat,
} from "./parsers";

// ─── Task type icon ────────────────────────────────────

function TaskTypeIcon({
  type,
  className,
}: {
  type: TaskType;
  className?: string;
}) {
  const props = { className: className || "size-5" };
  switch (type) {
    case "multiple_choice":
      return <ListChecks {...props} />;
    case "fill_blank":
      return <PenLine {...props} />;
    case "listening":
      return <Volume2 {...props} />;
    case "matching":
      return <Shuffle {...props} />;
    case "speaking":
      return <Mic {...props} />;
    case "reading":
      return <BookOpen {...props} />;
  }
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "multiple_choice", label: "Trắc nghiệm" },
  { value: "fill_blank", label: "Điền từ" },
  { value: "listening", label: "Nghe hiểu" },
  { value: "matching", label: "Ghép cặp" },
  { value: "speaking", label: "Phát âm" },
  { value: "reading", label: "Đọc hiểu" },
];

// ─── Props ─────────────────────────────────────────────

interface LessonFormProps {
  courseId: number;
  lesson?: LessonResponseDTO | null; // null or undefined = create mode
}

export function LessonForm({ courseId, lesson }: LessonFormProps) {
  const isEditing = !!lesson;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createLesson, { isLoading: isCreating }] = useCreateLessonMutation();
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();
  const isSubmitting = isCreating || isUpdating;

  // ─── Form state ────────────────────────────────────

  const [lessonType, setLessonType] = useState<LessonType>("video");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Video fields
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoType, setVideoType] = useState<"youtube" | "upload">("upload");

  // Task fields
  const [taskType, setTaskType] = useState<TaskType>("multiple_choice");
  const [taskInstructions, setTaskInstructions] = useState("");

  // Multiple choice
  const [mcQuestions, setMcQuestions] = useState<MultipleChoiceQuestion[]>([]);

  // Fill blank
  const [fbItems, setFbItems] = useState<FillBlankItem[]>([]);

  // Matching
  const [matchingItems, setMatchingItems] = useState<MatchingItem[]>([]);

  // Listening
  const [audioUrl, setAudioUrl] = useState("");
  const [listeningQuestions, setListeningQuestions] = useState<
    ListeningQuestion[]
  >([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Multi-add
  const [isMultiAddMode, setIsMultiAddMode] = useState(false);
  const [multiAddText, setMultiAddText] = useState("");

  // ─── Populate form when editing ────────────────────

  const populateFromLesson = useCallback(() => {
    if (!lesson) return;
    setTitle(lesson.title || "");
    setContent(lesson.content || "");
    setLessonType(lesson.lessonType || "video");

    if (lesson.lessonType === "video") {
      setVideoUrl(lesson.videoUrl || "");
      setVideoType(lesson.videoType || "youtube");
    } else if (lesson.lessonType === "task") {
      setTaskType(lesson.taskType || "multiple_choice");
      // Parse taskData JSON
      if (lesson.taskData) {
        try {
          const parsed = JSON.parse(lesson.taskData);
          setTaskInstructions(parsed.instructions || "");
          if (lesson.taskType === "multiple_choice" && parsed.items) {
            setMcQuestions(parsed.items);
          } else if (lesson.taskType === "fill_blank" && parsed.items) {
            setFbItems(parsed.items);
          } else if (lesson.taskType === "matching" && parsed.items) {
            setMatchingItems(parsed.items);
          } else if (lesson.taskType === "listening") {
            setAudioUrl(parsed.audioUrl || "");
            if (parsed.items) setListeningQuestions(parsed.items);
          }
        } catch {
          // taskData is not valid JSON, ignore
        }
      }
    }
  }, [lesson]);

  useEffect(() => {
    populateFromLesson();
  }, [populateFromLesson]);

  // ─── Multiple Choice Handlers ──────────────────────

  const addMcQuestion = () => {
    setMcQuestions((prev) => [
      ...prev,
      {
        id: `q${prev.length + 1}`,
        question: "",
        options: [
          { key: "A", text: "" },
          { key: "B", text: "" },
        ],
        answer: "",
        explanation: "",
      },
    ]);
  };

  const removeMcQuestion = (index: number) => {
    setMcQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMcQuestion = (index: number, field: string, value: string) => {
    setMcQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMcOption = (qIndex: number) => {
    setMcQuestions((prev) => {
      const updated = [...prev];
      const nextKey = String.fromCharCode(65 + updated[qIndex].options.length);
      updated[qIndex] = {
        ...updated[qIndex],
        options: [...updated[qIndex].options, { key: nextKey, text: "" }],
      };
      return updated;
    });
  };

  const removeMcOption = (qIndex: number, optIndex: number) => {
    setMcQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: updated[qIndex].options.filter((_, i) => i !== optIndex),
      };
      return updated;
    });
  };

  const updateMcOption = (qIndex: number, optIndex: number, text: string) => {
    setMcQuestions((prev) => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      options[optIndex] = { ...options[optIndex], text };
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  // ─── Fill Blank Handlers ───────────────────────────

  const addFbItem = () => {
    setFbItems((prev) => [
      ...prev,
      { id: `q${prev.length + 1}`, sentence: "", answer: "", hints: [] },
    ]);
  };

  const removeFbItem = (index: number) => {
    setFbItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFbItem = (index: number, field: string, value: string) => {
    setFbItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addFbHint = (index: number) => {
    setFbItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        hints: [...updated[index].hints, ""],
      };
      return updated;
    });
  };

  const removeFbHint = (itemIndex: number, hintIndex: number) => {
    setFbItems((prev) => {
      const updated = [...prev];
      updated[itemIndex] = {
        ...updated[itemIndex],
        hints: updated[itemIndex].hints.filter((_, i) => i !== hintIndex),
      };
      return updated;
    });
  };

  const updateFbHint = (
    itemIndex: number,
    hintIndex: number,
    value: string,
  ) => {
    setFbItems((prev) => {
      const updated = [...prev];
      const hints = [...updated[itemIndex].hints];
      hints[hintIndex] = value;
      updated[itemIndex] = { ...updated[itemIndex], hints };
      return updated;
    });
  };

  // ─── Matching Handlers ────────────────────────────

  const addMatchingItem = () => {
    setMatchingItems((prev) => [...prev, { left: "", right: "" }]);
  };

  const removeMatchingItem = (index: number) => {
    setMatchingItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMatchingItem = (
    index: number,
    field: "left" | "right",
    value: string,
  ) => {
    setMatchingItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ─── Listening Handlers ───────────────────────────

  const addListeningQuestion = () => {
    setListeningQuestions((prev) => [
      ...prev,
      {
        id: `q${prev.length + 1}`,
        question: "",
        options: [
          { key: "A", text: "" },
          { key: "B", text: "" },
        ],
        answer: "",
      },
    ]);
  };

  const removeListeningQuestion = (index: number) => {
    setListeningQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateListeningQuestion = (
    index: number,
    field: string,
    value: string,
  ) => {
    setListeningQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addListeningOption = (qIndex: number) => {
    setListeningQuestions((prev) => {
      const updated = [...prev];
      const nextKey = String.fromCharCode(65 + updated[qIndex].options.length);
      updated[qIndex] = {
        ...updated[qIndex],
        options: [...updated[qIndex].options, { key: nextKey, text: "" }],
      };
      return updated;
    });
  };

  const removeListeningOption = (qIndex: number, optIndex: number) => {
    setListeningQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: updated[qIndex].options.filter((_, i) => i !== optIndex),
      };
      return updated;
    });
  };

  const updateListeningOption = (
    qIndex: number,
    optIndex: number,
    text: string,
  ) => {
    setListeningQuestions((prev) => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      options[optIndex] = { ...options[optIndex], text };
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  // ─── Multi-add Handler ────────────────────────────

  const handleMultiAdd = () => {
    if (!multiAddText.trim()) {
      setErrors({ multiAdd: "Vui lòng nhập nội dung" });
      return;
    }

    try {
      let success = false;
      if (taskType === "multiple_choice") {
        const parsed = parseMultipleChoice(multiAddText, mcQuestions.length);
        if (parsed.length > 0) {
          setMcQuestions((prev) => [...prev, ...parsed]);
          success = true;
        }
      } else if (taskType === "fill_blank") {
        const parsed = parseFillBlank(multiAddText, fbItems.length);
        if (parsed.length > 0) {
          setFbItems((prev) => [...prev, ...parsed]);
          success = true;
        }
      } else if (taskType === "matching") {
        const parsed = parseMatching(multiAddText);
        if (parsed.length > 0) {
          setMatchingItems((prev) => [...prev, ...parsed]);
          success = true;
        }
      } else if (taskType === "listening") {
        const parsed = parseListening(multiAddText, listeningQuestions.length);
        if (parsed.length > 0) {
          setListeningQuestions((prev) => [...prev, ...parsed]);
          success = true;
        }
      }

      if (success) {
        setMultiAddText("");
        setIsMultiAddMode(false);
        setErrors((prev) => ({ ...prev, multiAdd: "" }));
      } else {
        setErrors({
          multiAdd: "Không thể parse. Vui lòng kiểm tra định dạng",
        });
      }
    } catch {
      setErrors({ multiAdd: "Lỗi khi parse dữ liệu" });
    }
  };

  // ─── Video file handler ───────────────────────────

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setVideoType("upload");
      setErrors((prev) => ({ ...prev, video: "" }));
    } else {
      setErrors((prev) => ({ ...prev, video: "File không hợp lệ" }));
    }
  };

  // ─── Validation ───────────────────────────────────

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "Tên bài học không được để trống";
    if (!content.trim()) newErrors.content = "Nội dung không được để trống";

    if (lessonType === "video") {
      if (videoType === "youtube" && !videoUrl.trim()) {
        newErrors.video = "Vui lòng nhập URL YouTube hoặc upload video";
      }
      if (videoType === "upload" && !videoFile && !isEditing) {
        newErrors.video = "Vui lòng chọn file video";
      }
    }

    if (lessonType === "task") {
      if (!taskInstructions.trim()) {
        newErrors.taskInstructions = "Hướng dẫn không được để trống";
      }
      if (taskType === "multiple_choice" && mcQuestions.length === 0)
        newErrors.task = "Vui lòng thêm ít nhất 1 câu hỏi";
      if (taskType === "fill_blank" && fbItems.length === 0)
        newErrors.task = "Vui lòng thêm ít nhất 1 câu";
      if (taskType === "matching" && matchingItems.length === 0)
        newErrors.task = "Vui lòng thêm ít nhất 1 cặp";
      if (taskType === "listening") {
        if (!audioUrl.trim()) newErrors.audio = "Vui lòng nhập URL audio";
        if (listeningQuestions.length === 0)
          newErrors.task = "Vui lòng thêm ít nhất 1 câu hỏi";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ───────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Build lesson JSON
      const lessonData: Record<string, unknown> = {
        courseId,
        title: title.trim(),
        lessonType,
        content: content.trim(),
      };

      if (lessonType === "video") {
        if (videoType === "youtube") {
          lessonData.videoUrl = videoUrl.trim();
          lessonData.videoType = "youtube";
        } else {
          lessonData.videoType = "upload";
        }
      } else if (lessonType === "task") {
        lessonData.taskType = taskType;

        // Build structured taskData JSON
        const jsonTask: Record<string, unknown> = {
          type: taskType,
          title: title.trim(),
          instructions: taskInstructions.trim(),
        };

        if (taskType === "multiple_choice") jsonTask.items = mcQuestions;
        else if (taskType === "fill_blank") jsonTask.items = fbItems;
        else if (taskType === "matching") jsonTask.items = matchingItems;
        else if (taskType === "listening") {
          jsonTask.audioUrl = audioUrl.trim();
          jsonTask.items = listeningQuestions;
        } else {
          jsonTask.items = [];
        }

        lessonData.taskData = JSON.stringify(jsonTask);
      }

      const formData = new FormData();
      formData.append(
        "lesson",
        new Blob([JSON.stringify(lessonData)], {
          type: "application/json",
        }),
      );

      // Attach video file if uploading
      if (lessonType === "video" && videoType === "upload" && videoFile) {
        formData.append("video", videoFile);
      }

      if (isEditing && lesson) {
        // For update, remove courseId from JSON
        delete lessonData.courseId;
        const updateFormData = new FormData();
        updateFormData.append(
          "lesson",
          new Blob([JSON.stringify(lessonData)], {
            type: "application/json",
          }),
        );
        if (lessonType === "video" && videoType === "upload" && videoFile) {
          updateFormData.append("video", videoFile);
        }
        await updateLesson({
          id: lesson.id,
          formData: updateFormData,
        }).unwrap();
        toast.success("Cập nhật bài học thành công!");
      } else {
        await createLesson(formData).unwrap();
        toast.success("Tạo bài học thành công!");
      }

      router.push(`/admin/courses/${courseId}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      const msg =
        error?.data?.message ||
        (isEditing
          ? "Đã có lỗi xảy ra khi cập nhật bài học"
          : "Đã có lỗi xảy ra khi tạo bài học");
      toast.error(msg);
      setErrors({ submit: msg });
    }
  };

  const goBack = () => router.push(`/admin/courses/${courseId}`);

  // ─── Render ───────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isEditing ? "Chỉnh sửa bài học" : "Tạo Bài Học Mới"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Cập nhật thông tin bài học"
              : "Thiết lập nội dung bài học cho khóa học"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Lesson Type Switcher ─────────────── */}
        <div className="flex gap-3">
          <Button
            type="button"
            size="lg"
            variant={lessonType === "video" ? "default" : "outline"}
            className="flex-1 gap-2 h-14 text-base"
            onClick={() => setLessonType("video")}
            disabled={isSubmitting}
          >
            <Video className="size-5" />
            Bài Học Video
          </Button>
          <Button
            type="button"
            size="lg"
            variant={lessonType === "task" ? "default" : "outline"}
            className="flex-1 gap-2 h-14 text-base"
            onClick={() => setLessonType("task")}
            disabled={isSubmitting}
          >
            <ListChecks className="size-5" />
            Bài Tập
          </Button>
        </div>

        {/* ─── Basic Info ───────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5" />
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Tên bài học <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên bài học..."
                disabled={isSubmitting}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">
                Nội dung mô tả <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả chi tiết nội dung bài học..."
                rows={5}
                disabled={isSubmitting}
                className={
                  errors.content
                    ? "border-destructive resize-none"
                    : "resize-none"
                }
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── VIDEO SECTION ────────────────────── */}
        {lessonType === "video" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="size-5" />
                Cấu hình Video
              </CardTitle>
              <CardDescription>Upload file video cho bài học</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 w-full h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="size-5" />
                  {videoFile ? videoFile.name : "Chọn file video"}
                </Button>
                {errors.video && (
                  <p className="text-sm text-destructive">{errors.video}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── TASK SECTION ─────────────────────── */}
        {lessonType === "task" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="size-5" />
                  Cấu hình Bài Tập
                </CardTitle>
                <CardDescription>
                  Chọn loại bài tập và thiết lập nội dung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Task Type Grid */}
                <div className="space-y-2">
                  <Label>
                    Loại bài tập <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TASK_TYPES.map((t) => (
                      <Button
                        key={t.value}
                        type="button"
                        variant={taskType === t.value ? "default" : "outline"}
                        className="gap-2 h-12 justify-start"
                        onClick={() => setTaskType(t.value)}
                        disabled={isSubmitting}
                      >
                        <TaskTypeIcon type={t.value} className="size-4" />
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Task Instructions */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    Hướng dẫn làm bài{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={taskInstructions}
                    onChange={(e) => setTaskInstructions(e.target.value)}
                    placeholder="Hướng dẫn chi tiết cho học viên..."
                    rows={3}
                    disabled={isSubmitting}
                    className={
                      errors.taskInstructions
                        ? "border-destructive resize-none"
                        : "resize-none"
                    }
                  />
                  {errors.taskInstructions && (
                    <p className="text-sm text-destructive">
                      {errors.taskInstructions}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ─── MULTIPLE CHOICE ─────────────── */}
            {taskType === "multiple_choice" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Danh sách câu hỏi</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={!isMultiAddMode ? "default" : "ghost"}
                        onClick={() => setIsMultiAddMode(false)}
                        disabled={isSubmitting}
                      >
                        Thêm từng câu
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isMultiAddMode ? "default" : "ghost"}
                        onClick={() => setIsMultiAddMode(true)}
                        disabled={isSubmitting}
                      >
                        Thêm nhiều câu
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isMultiAddMode ? (
                    <MultiAddSection
                      format={getMultiAddFormat("multiple_choice")}
                      multiAddText={multiAddText}
                      setMultiAddText={setMultiAddText}
                      onImport={handleMultiAdd}
                      onCancel={() => {
                        setIsMultiAddMode(false);
                        setMultiAddText("");
                        setErrors((prev) => ({
                          ...prev,
                          multiAdd: "",
                        }));
                      }}
                      error={errors.multiAdd}
                      isSubmitting={isSubmitting}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full border-dashed"
                      onClick={addMcQuestion}
                      disabled={isSubmitting}
                    >
                      <Plus className="size-4" /> Thêm câu hỏi
                    </Button>
                  )}

                  {mcQuestions.map((q, qIdx) => (
                    <Card key={q.id} className="border-muted">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Câu {qIdx + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => removeMcQuestion(qIdx)}
                            disabled={isSubmitting}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        <Input
                          value={q.question}
                          onChange={(e) =>
                            updateMcQuestion(qIdx, "question", e.target.value)
                          }
                          placeholder="Nhập câu hỏi..."
                          disabled={isSubmitting}
                        />
                        <div className="space-y-2 pl-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={opt.key}
                              className="flex items-center gap-2"
                            >
                              <Badge
                                variant="outline"
                                className="shrink-0 size-7 justify-center"
                              >
                                {opt.key}
                              </Badge>
                              <Input
                                value={opt.text}
                                onChange={(e) =>
                                  updateMcOption(qIdx, optIdx, e.target.value)
                                }
                                placeholder="Nhập đáp án..."
                                disabled={isSubmitting}
                              />
                              {q.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 shrink-0"
                                  onClick={() => removeMcOption(qIdx, optIdx)}
                                  disabled={isSubmitting}
                                >
                                  <X className="size-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground"
                            onClick={() => addMcOption(qIdx)}
                            disabled={isSubmitting}
                          >
                            <Plus className="size-3" /> Thêm đáp án
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <Label className="shrink-0">Đáp án đúng:</Label>
                          <Select
                            value={q.answer}
                            onValueChange={(v) =>
                              updateMcQuestion(qIdx, "answer", v)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                              {q.options.map((opt) => (
                                <SelectItem key={opt.key} value={opt.key}>
                                  {opt.key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          value={q.explanation}
                          onChange={(e) =>
                            updateMcQuestion(
                              qIdx,
                              "explanation",
                              e.target.value,
                            )
                          }
                          placeholder="Giải thích (tùy chọn)"
                          disabled={isSubmitting}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  {errors.task && (
                    <p className="text-sm text-destructive">{errors.task}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── FILL BLANK ─────────────────── */}
            {taskType === "fill_blank" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Danh sách câu điền từ
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={!isMultiAddMode ? "default" : "ghost"}
                        onClick={() => setIsMultiAddMode(false)}
                        disabled={isSubmitting}
                      >
                        Thêm từng câu
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isMultiAddMode ? "default" : "ghost"}
                        onClick={() => setIsMultiAddMode(true)}
                        disabled={isSubmitting}
                      >
                        Thêm nhiều câu
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isMultiAddMode ? (
                    <MultiAddSection
                      format={getMultiAddFormat("fill_blank")}
                      multiAddText={multiAddText}
                      setMultiAddText={setMultiAddText}
                      onImport={handleMultiAdd}
                      onCancel={() => {
                        setIsMultiAddMode(false);
                        setMultiAddText("");
                        setErrors((prev) => ({
                          ...prev,
                          multiAdd: "",
                        }));
                      }}
                      error={errors.multiAdd}
                      isSubmitting={isSubmitting}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full border-dashed"
                      onClick={addFbItem}
                      disabled={isSubmitting}
                    >
                      <Plus className="size-4" /> Thêm câu
                    </Button>
                  )}

                  {fbItems.map((item, idx) => (
                    <Card key={item.id} className="border-muted">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Câu {idx + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => removeFbItem(idx)}
                            disabled={isSubmitting}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        <Input
                          value={item.sentence}
                          onChange={(e) =>
                            updateFbItem(idx, "sentence", e.target.value)
                          }
                          placeholder="Câu với chỗ trống (VD: まどを（　）ください。)"
                          disabled={isSubmitting}
                        />
                        <Input
                          value={item.answer}
                          onChange={(e) =>
                            updateFbItem(idx, "answer", e.target.value)
                          }
                          placeholder="Đáp án"
                          disabled={isSubmitting}
                        />

                        <div className="space-y-2 pl-2">
                          <Label className="text-sm text-muted-foreground">
                            Gợi ý:
                          </Label>
                          {item.hints.map((hint, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-2">
                              <Input
                                value={hint}
                                onChange={(e) =>
                                  updateFbHint(idx, hIdx, e.target.value)
                                }
                                placeholder="Gợi ý..."
                                disabled={isSubmitting}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => removeFbHint(idx, hIdx)}
                                disabled={isSubmitting}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground"
                            onClick={() => addFbHint(idx)}
                            disabled={isSubmitting}
                          >
                            <Plus className="size-3" /> Thêm gợi ý
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {errors.task && (
                    <p className="text-sm text-destructive">{errors.task}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── MATCHING ───────────────────── */}
            {taskType === "matching" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Danh sách cặp ghép
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={!isMultiAddMode ? "default" : "ghost"}
                        onClick={() => setIsMultiAddMode(false)}
                        disabled={isSubmitting}
                      >
                        Thêm từng cặp
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isMultiAddMode ? "default" : "ghost"}
                        onClick={() => setIsMultiAddMode(true)}
                        disabled={isSubmitting}
                      >
                        Thêm nhiều cặp
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isMultiAddMode ? (
                    <MultiAddSection
                      format={getMultiAddFormat("matching")}
                      multiAddText={multiAddText}
                      setMultiAddText={setMultiAddText}
                      onImport={handleMultiAdd}
                      onCancel={() => {
                        setIsMultiAddMode(false);
                        setMultiAddText("");
                        setErrors((prev) => ({
                          ...prev,
                          multiAdd: "",
                        }));
                      }}
                      error={errors.multiAdd}
                      isSubmitting={isSubmitting}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full border-dashed"
                      onClick={addMatchingItem}
                      disabled={isSubmitting}
                    >
                      <Plus className="size-4" /> Thêm cặp
                    </Button>
                  )}

                  {matchingItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="shrink-0 size-7 justify-center"
                      >
                        {idx + 1}
                      </Badge>
                      <Input
                        value={item.left}
                        onChange={(e) =>
                          updateMatchingItem(idx, "left", e.target.value)
                        }
                        placeholder="Từ/Cụm từ"
                        disabled={isSubmitting}
                      />
                      <span className="text-muted-foreground shrink-0 text-lg">
                        →
                      </span>
                      <Input
                        value={item.right}
                        onChange={(e) =>
                          updateMatchingItem(idx, "right", e.target.value)
                        }
                        placeholder="Nghĩa/Giải thích"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeMatchingItem(idx)}
                        disabled={isSubmitting}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}

                  {errors.task && (
                    <p className="text-sm text-destructive">{errors.task}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── LISTENING ──────────────────── */}
            {taskType === "listening" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="size-5" />
                      Audio
                    </CardTitle>
                    <CardDescription>
                      Nhập URL file audio cho bài nghe
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={audioUrl}
                      onChange={(e) => {
                        setAudioUrl(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          audio: "",
                        }));
                      }}
                      placeholder="https://cdn.example.com/audio/lesson.mp3"
                      disabled={isSubmitting}
                      className={errors.audio ? "border-destructive" : ""}
                    />
                    {errors.audio && (
                      <p className="text-sm text-destructive">{errors.audio}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Câu hỏi nghe hiểu
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={!isMultiAddMode ? "default" : "ghost"}
                          onClick={() => setIsMultiAddMode(false)}
                          disabled={isSubmitting}
                        >
                          Thêm từng câu
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={isMultiAddMode ? "default" : "ghost"}
                          onClick={() => setIsMultiAddMode(true)}
                          disabled={isSubmitting}
                        >
                          Thêm nhiều câu
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isMultiAddMode ? (
                      <MultiAddSection
                        format={getMultiAddFormat("listening")}
                        multiAddText={multiAddText}
                        setMultiAddText={setMultiAddText}
                        onImport={handleMultiAdd}
                        onCancel={() => {
                          setIsMultiAddMode(false);
                          setMultiAddText("");
                          setErrors((prev) => ({
                            ...prev,
                            multiAdd: "",
                          }));
                        }}
                        error={errors.multiAdd}
                        isSubmitting={isSubmitting}
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 w-full border-dashed"
                        onClick={addListeningQuestion}
                        disabled={isSubmitting}
                      >
                        <Plus className="size-4" /> Thêm câu hỏi
                      </Button>
                    )}

                    {listeningQuestions.map((q, qIdx) => (
                      <Card key={q.id} className="border-muted">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Câu {qIdx + 1}</Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => removeListeningQuestion(qIdx)}
                              disabled={isSubmitting}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                          <Input
                            value={q.question}
                            onChange={(e) =>
                              updateListeningQuestion(
                                qIdx,
                                "question",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập câu hỏi..."
                            disabled={isSubmitting}
                          />
                          <div className="space-y-2 pl-2">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={opt.key}
                                className="flex items-center gap-2"
                              >
                                <Badge
                                  variant="outline"
                                  className="shrink-0 size-7 justify-center"
                                >
                                  {opt.key}
                                </Badge>
                                <Input
                                  value={opt.text}
                                  onChange={(e) =>
                                    updateListeningOption(
                                      qIdx,
                                      optIdx,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Nhập đáp án..."
                                  disabled={isSubmitting}
                                />
                                {q.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0"
                                    onClick={() =>
                                      removeListeningOption(qIdx, optIdx)
                                    }
                                    disabled={isSubmitting}
                                  >
                                    <X className="size-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-muted-foreground"
                              onClick={() => addListeningOption(qIdx)}
                              disabled={isSubmitting}
                            >
                              <Plus className="size-3" /> Thêm đáp án
                            </Button>
                          </div>
                          <Separator />
                          <div className="flex items-center gap-3">
                            <Label className="shrink-0">Đáp án đúng:</Label>
                            <Select
                              value={q.answer}
                              onValueChange={(v) =>
                                updateListeningQuestion(qIdx, "answer", v)
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Chọn" />
                              </SelectTrigger>
                              <SelectContent>
                                {q.options.map((opt) => (
                                  <SelectItem key={opt.key} value={opt.key}>
                                    {opt.key}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {errors.task && (
                      <p className="text-sm text-destructive">{errors.task}</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* ─── SPEAKING & READING placeholder ─ */}
            {(taskType === "speaking" || taskType === "reading") && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="size-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Tính năng đang phát triển
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Loại bài tập này sẽ sớm được hỗ trợ
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ─── Submit Error ─────────────────────── */}
        {errors.submit && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        {/* ─── Actions ─────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isEditing ? "Đang cập nhật..." : "Đang tạo..."}
              </>
            ) : (
              <>
                <Save className="size-4" />
                {isEditing ? "Cập nhật" : "Tạo bài học"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── MultiAddSection sub-component ─────────────────────

function MultiAddSection({
  format,
  multiAddText,
  setMultiAddText,
  onImport,
  onCancel,
  error,
  isSubmitting,
}: {
  format: string;
  multiAddText: string;
  setMultiAddText: (t: string) => void;
  onImport: () => void;
  onCancel: () => void;
  error?: string;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <p className="text-sm font-medium">📋 Định dạng:</p>
        <pre className="text-xs bg-background rounded p-3 overflow-x-auto whitespace-pre-wrap border">
          {format}
        </pre>
        <p className="text-xs text-muted-foreground">
          💡 <strong>Mẹo:</strong> Paste bài tập của bạn vào ChatGPT với prompt:{" "}
          <em>
            &quot;Hãy chuyển đổi các câu hỏi sau sang định dạng trên&quot;
          </em>{" "}
          để tự động format!
        </p>
      </div>
      <Textarea
        value={multiAddText}
        onChange={(e) => setMultiAddText(e.target.value)}
        placeholder="Paste nội dung theo định dạng trên..."
        rows={12}
        disabled={isSubmitting}
        className="resize-none font-mono text-sm"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1"
          onClick={onImport}
          disabled={isSubmitting}
        >
          <Plus className="size-4" /> Import
        </Button>
      </div>
    </div>
  );
}
