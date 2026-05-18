"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, BookOpen, Headphones, FileText, Loader2, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { QuizType, QuestionType, QuizQuestionItem } from "@/store/services/lessonApi";
import { useUploadAudioMutation } from "@/store/services/lessonApi";

interface QuizCreatorProps {
  title: string;
  setTitle: (title: string) => void;
  quizType: QuizType;
  setQuizType: (type: QuizType) => void;
  mediaContent: string;
  setMediaContent: (content: string) => void;
  passageText: string;
  setPassageText: (text: string) => void;
  questions: QuizQuestionItem[];
  setQuestions: (questions: QuizQuestionItem[]) => void;
  onCreate: () => void;
  isCreating: boolean;
}

const QUIZ_TYPE_TABS: { value: QuizType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "VOCAB",
    label: "Ngữ pháp",
    icon: <FileText className="h-4 w-4" />,
    description: "Câu hỏi trắc nghiệm cơ bản (A, B, C, D)",
  },
  {
    value: "LISTENING",
    label: "Nghe",
    icon: <Headphones className="h-4 w-4" />,
    description: "Bài nghe với audio",
  },
  {
    value: "READING",
    label: "Đọc hiểu",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Đoạn văn với câu hỏi con",
  },
];

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (A, B, C, D)" },
  { value: "FILL_BLANK", label: "Điền vào chỗ trống" },
];

const DEFAULT_OPTIONS = ["A", "B", "C", "D"];

const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg", "audio/webm"];
const MAX_AUDIO_SIZE_MB = 50;
const LABEL_CLASS = "mb-1 block text-xs text-muted-foreground dark:text-[#8B8FA8]";
const FORM_CONTROL_CLASS =
  "w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-[#6C63FF]/50 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/15 dark:border-white/10 dark:bg-[#1a1d27] dark:text-[#F0F0F0] dark:placeholder:text-[#8B8FA8]/70";

export function QuizCreator({
  title,
  setTitle,
  quizType,
  setQuizType,
  mediaContent,
  setMediaContent,
  passageText,
  setPassageText,
  questions,
  setQuestions,
  onCreate,
  isCreating,
}: QuizCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentGroupKey] = useState(() => `passage-${Date.now()}`);
  
  // Audio upload state
  const [uploadAudio, { isLoading: isUploading }] = useUploadAudioMutation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const addQuestion = () => {
    const newQuestion: QuizQuestionItem = {
      type: "MULTIPLE_CHOICE",
      questionText: "",
      optionsJson: JSON.stringify(DEFAULT_OPTIONS),
      correctAnswer: "A",
      explanation: "",
      orderIndex: questions.length,
      ...(quizType === "LISTENING" && mediaContent ? { mediaContent } : {}),
      ...(quizType === "READING" && passageText ? { passageText, groupKey: currentGroupKey } : {}),
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestionItem>) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const handleAudioUpload = async (file: File) => {
    // Validate file type
    if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      toast.error("Chỉ chấp nhận file audio: MP3, WAV, M4A, OGG, WebM");
      return;
    }

    // Validate file size (50MB max)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_AUDIO_SIZE_MB) {
      toast.error(`File quá lớn. Tối đa ${MAX_AUDIO_SIZE_MB}MB`);
      return;
    }

    setUploadProgress("Đang tải lên...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAudio(formData).unwrap();
      
      setMediaContent(result.url);
      setUploadProgress(null);
      toast.success("Tải audio thành công!");
    } catch (error) {
      setUploadProgress(null);
      toast.error("Tải audio thất bại. Vui lòng thử lại.");
      console.error("Audio upload error:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAudioUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAudioUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeAudio = () => {
    setMediaContent("");
    setUploadProgress(null);
  };

  const renderQuestionInput = (question: QuizQuestionItem, index: number) => {
    const parseOptions = (): string[] => {
      try {
        return JSON.parse(question.optionsJson || "[]");
      } catch {
        return [];
      }
    };

    const updateOptions = (options: string[]) => {
      updateQuestion(index, { optionsJson: JSON.stringify(options) });
    };

    return (
      <div
        key={index}
        className="space-y-3 rounded-lg border border-border bg-background/80 p-3 shadow-sm dark:border-white/[0.08] dark:bg-[#1a1d27]/50 dark:shadow-none"
      >
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground dark:text-[#8B8FA8]">Câu {index + 1}</span>
          <button
            onClick={() => removeQuestion(index)}
            className="text-muted-foreground transition-colors hover:text-red-500 dark:text-[#8B8FA8] dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Question Type */}
        <div>
          <label className={LABEL_CLASS}>Loại câu hỏi</label>
          <select
            value={question.type}
            onChange={(e) =>
              updateQuestion(index, { type: e.target.value as QuestionType })
            }
            className={FORM_CONTROL_CLASS}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className={LABEL_CLASS}>Nội dung câu hỏi</label>
          <textarea
            value={question.questionText}
            onChange={(e) =>
              updateQuestion(index, { questionText: e.target.value })
            }
            placeholder="Nhập câu hỏi..."
            className={cn(FORM_CONTROL_CLASS, "min-h-[52px] resize-none")}
          />
        </div>

        {/* Options for Multiple Choice */}
        {question.type === "MULTIPLE_CHOICE" && (
          <div>
            <label className={LABEL_CLASS}>Các lựa chọn</label>
            <div className="space-y-1.5">
              {parseOptions().map((opt, optIdx) => {
                const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
                return (
                  <div key={optIdx} className="flex items-center gap-2">
                    <span className="w-5 text-xs font-medium text-muted-foreground dark:text-[#8B8FA8]">{labels[optIdx]}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...parseOptions()];
                        newOpts[optIdx] = e.target.value;
                        updateOptions(newOpts);
                      }}
                      className={cn(FORM_CONTROL_CLASS, "flex-1 py-1")}
                    />
                    {question.correctAnswer === opt && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <label className={LABEL_CLASS}>Đáp án đúng</label>
          <select
            value={question.correctAnswer}
            onChange={(e) =>
              updateQuestion(index, { correctAnswer: e.target.value })
            }
            className={FORM_CONTROL_CLASS}
          >
            <option value="">-- Chọn đáp án --</option>
            {parseOptions().map((opt, optIdx) => {
              const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
              return (
                <option key={optIdx} value={opt}>
                  {labels[optIdx]}. {opt}
                </option>
              );
            })}
          </select>
        </div>

        {/* Explanation */}
        <div>
          <label className={LABEL_CLASS}>Giải thích (tùy chọn)</label>
          <textarea
            value={question.explanation || ""}
            onChange={(e) =>
              updateQuestion(index, { explanation: e.target.value })
            }
            placeholder="Giải thích đáp án..."
            className={cn(FORM_CONTROL_CLASS, "min-h-[40px] resize-none")}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Quiz Title */}
      <div>
        <label className={LABEL_CLASS}>Tiêu đề quiz</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài quiz..."
          className={FORM_CONTROL_CLASS}
        />
      </div>

      {/* Quiz Type Tabs */}
      <div>
        <label className="mb-2 block text-xs text-muted-foreground dark:text-[#8B8FA8]">Loại quiz</label>
        <div className="grid grid-cols-3 gap-2">
          {QUIZ_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setQuizType(tab.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                quizType === tab.value
                  ? "border-[#6C63FF]/50 bg-[#6C63FF]/10 text-[#4F46E5] shadow-sm dark:text-[#F0F0F0] dark:shadow-none"
                  : "border-border bg-background text-muted-foreground hover:border-[#6C63FF]/30 hover:text-foreground dark:border-white/[0.08] dark:bg-[#1a1d27]/50 dark:text-[#8B8FA8] dark:hover:border-white/[0.12] dark:hover:text-[#F0F0F0]"
              )}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LISTENING: Audio Upload */}
      {quizType === "LISTENING" && (
        <div>
          <label className={LABEL_CLASS}>File Audio (Cloudinary)</label>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload zone */}
          {!mediaContent && !uploadProgress && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-[#6C63FF] bg-[#6C63FF]/10"
                  : "border-border bg-background/70 hover:border-[#6C63FF]/30 dark:border-white/[0.12] dark:bg-[#1a1d27]/30 dark:hover:border-white/[0.2]"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isDragging ? "bg-[#6C63FF]/20" : "bg-muted dark:bg-[#252838]"
                )}>
                  <Headphones className={cn("h-5 w-5", isDragging ? "text-[#6C63FF]" : "text-muted-foreground dark:text-[#8B8FA8]")} />
                </div>
                <div>
                  <p className="text-xs text-foreground dark:text-[#F0F0F0]">
                    Kéo thả file audio hoặc <span className="text-[#6C63FF]">bấm để chọn</span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground dark:text-[#8B8FA8]">
                    MP3, WAV, M4A, OGG, WebM • Tối đa {MAX_AUDIO_SIZE_MB}MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Uploading state */}
          {isUploading && (
            <div className="border border-[#6C63FF]/30 rounded-lg p-4 bg-[#6C63FF]/5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-[#6C63FF] animate-spin" />
                <div>
                  <p className="text-xs text-foreground dark:text-[#F0F0F0]">Đang tải lên Cloudinary...</p>
                  <p className="text-[10px] text-muted-foreground dark:text-[#8B8FA8]">Vui lòng đợi</p>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded audio preview */}
          {mediaContent && !isUploading && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                    <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Audio đã tải lên
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground dark:text-[#8B8FA8]">
                      {mediaContent.split("/").pop()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <audio 
                    src={mediaContent} 
                    controls 
                    className="h-8 w-40"
                  />
                  <button
                    onClick={removeAudio}
                    className="rounded-md bg-muted p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:bg-white/5 dark:text-[#8B8FA8] dark:hover:bg-red-500/20 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-2 text-[10px] text-muted-foreground dark:text-[#8B8FA8]">
            Audio sẽ được lưu trên Cloudinary. Học viên có thể nghe trong khi làm bài.
          </p>
        </div>
      )}

      {/* READING: Passage Text */}
      {quizType === "READING" && (
        <div>
          <label className={LABEL_CLASS}>Đoạn văn đọc hiểu</label>
          <textarea
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Nhập đoạn văn dài..."
            className={cn(FORM_CONTROL_CLASS, "min-h-[120px] resize-y")}
          />
          <p className="mt-1 text-[10px] text-muted-foreground dark:text-[#8B8FA8]">
            Các câu hỏi bên dưới sẽ chia sẻ đoạn văn này
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground dark:text-[#8B8FA8]">Câu hỏi</label>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1 text-xs text-[#6C63FF] hover:text-[#8B83FF]"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm câu hỏi
          </button>
        </div>
        {questions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/40 py-6 text-center dark:border-white/[0.08] dark:bg-transparent">
            <p className="text-xs text-muted-foreground dark:text-[#8B8FA8]">Chưa có câu hỏi nào</p>
            <button
              onClick={addQuestion}
              className="mt-2 text-xs text-[#6C63FF] hover:underline"
            >
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => renderQuestionInput(q, i))}
          </div>
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={onCreate}
        disabled={isCreating || !title.trim() || questions.length === 0 || (quizType === "LISTENING" && !mediaContent)}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#6C63FF] px-3 py-2 text-xs font-medium text-white hover:bg-[#5a52e0] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        {isCreating ? "Đang tạo..." : "Tạo Quiz"}
      </button>
    </div>
  );
}
