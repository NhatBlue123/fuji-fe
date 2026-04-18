"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Upload, BookOpen, Headphones, FileText, Loader2, CheckCircle, X } from "lucide-react";
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
        className="rounded-lg border border-white/[0.08] bg-[#1a1d27]/50 p-3 space-y-3"
      >
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#8B8FA8]">Câu {index + 1}</span>
          <button
            onClick={() => removeQuestion(index)}
            className="text-[#8B8FA8] hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Question Type */}
        <div>
          <label className="text-xs text-[#8B8FA8] mb-1 block">Loại câu hỏi</label>
          <select
            value={question.type}
            onChange={(e) =>
              updateQuestion(index, { type: e.target.value as QuestionType })
            }
            className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-xs text-[#F0F0F0]"
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
          <label className="text-xs text-[#8B8FA8] mb-1 block">Nội dung câu hỏi</label>
          <textarea
            value={question.questionText}
            onChange={(e) =>
              updateQuestion(index, { questionText: e.target.value })
            }
            placeholder="Nhập câu hỏi..."
            className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-xs text-[#F0F0F0] min-h-[52px] resize-none"
          />
        </div>

        {/* Options for Multiple Choice */}
        {question.type === "MULTIPLE_CHOICE" && (
          <div>
            <label className="text-xs text-[#8B8FA8] mb-1 block">Các lựa chọn</label>
            <div className="space-y-1.5">
              {parseOptions().map((opt, optIdx) => {
                const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
                return (
                  <div key={optIdx} className="flex items-center gap-2">
                    <span className="text-xs text-[#8B8FA8] font-medium w-5">{labels[optIdx]}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...parseOptions()];
                        newOpts[optIdx] = e.target.value;
                        updateOptions(newOpts);
                      }}
                      className="flex-1 rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1 text-xs text-[#F0F0F0]"
                    />
                    {question.correctAnswer === opt && (
                      <span className="text-[10px] text-emerald-400">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <label className="text-xs text-[#8B8FA8] mb-1 block">Đáp án đúng</label>
          <select
            value={question.correctAnswer}
            onChange={(e) =>
              updateQuestion(index, { correctAnswer: e.target.value })
            }
            className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-xs text-[#F0F0F0]"
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
          <label className="text-xs text-[#8B8FA8] mb-1 block">Giải thích (tùy chọn)</label>
          <textarea
            value={question.explanation || ""}
            onChange={(e) =>
              updateQuestion(index, { explanation: e.target.value })
            }
            placeholder="Giải thích đáp án..."
            className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-xs text-[#F0F0F0] min-h-[40px] resize-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Quiz Title */}
      <div>
        <label className="text-xs text-[#8B8FA8] mb-1 block">Tiêu đề quiz</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài quiz..."
          className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-xs text-[#F0F0F0]"
        />
      </div>

      {/* Quiz Type Tabs */}
      <div>
        <label className="text-xs text-[#8B8FA8] mb-2 block">Loại quiz</label>
        <div className="grid grid-cols-3 gap-2">
          {QUIZ_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setQuizType(tab.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                quizType === tab.value
                  ? "border-[#6C63FF]/50 bg-[#6C63FF]/10 text-[#F0F0F0]"
                  : "border-white/[0.08] bg-[#1a1d27]/50 text-[#8B8FA8] hover:border-white/[0.12]"
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
          <label className="text-xs text-[#8B8FA8] mb-1 block">File Audio (Cloudinary)</label>
          
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
                  : "border-white/[0.12] hover:border-white/[0.2] bg-[#1a1d27]/30"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isDragging ? "bg-[#6C63FF]/20" : "bg-[#252838]"
                )}>
                  <Headphones className={cn("h-5 w-5", isDragging ? "text-[#6C63FF]" : "text-[#8B8FA8]")} />
                </div>
                <div>
                  <p className="text-xs text-[#F0F0F0]">
                    Kéo thả file audio hoặc <span className="text-[#6C63FF]">bấm để chọn</span>
                  </p>
                  <p className="text-[10px] text-[#8B8FA8] mt-1">
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
                  <p className="text-xs text-[#F0F0F0]">Đang tải lên Cloudinary...</p>
                  <p className="text-[10px] text-[#8B8FA8]">Vui lòng đợi</p>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded audio preview */}
          {mediaContent && !isUploading && (
            <div className="border border-emerald-500/30 rounded-lg p-3 bg-emerald-500/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-emerald-400 font-medium truncate">
                      Audio đã tải lên
                    </p>
                    <p className="text-[10px] text-[#8B8FA8] truncate">
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
                    className="p-1.5 rounded-md bg-white/5 hover:bg-red-500/20 text-[#8B8FA8] hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-[10px] text-[#8B8FA8] mt-2">
            Audio sẽ được lưu trên Cloudinary. Học viên có thể nghe trong khi làm bài.
          </p>
        </div>
      )}

      {/* READING: Passage Text */}
      {quizType === "READING" && (
        <div>
          <label className="text-xs text-[#8B8FA8] mb-1 block">Đoạn văn đọc hiểu</label>
          <textarea
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Nhập đoạn văn dài..."
            className="w-full rounded-lg bg-[#1a1d27] border border-white/10 px-2 py-1.5 text-xs text-[#F0F0F0] min-h-[120px] resize-y"
          />
          <p className="text-[10px] text-[#8B8FA8] mt-1">
            Các câu hỏi bên dưới sẽ chia sẻ đoạn văn này
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-[#8B8FA8]">Câu hỏi</label>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1 text-xs text-[#6C63FF] hover:text-[#8B83FF]"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm câu hỏi
          </button>
        </div>
        {questions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/[0.08] rounded-lg">
            <p className="text-xs text-[#8B8FA8]">Chưa có câu hỏi nào</p>
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
