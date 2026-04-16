"use client";

import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Send, Paperclip, Image as ImageIcon, FileText, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, TypingStatus } from "@/hooks/useStompChat";
import api from "@/lib/api";
import { toast } from "sonner";

interface ChatPanelProps {
  messages: ChatMessage[];
  typingUsers: TypingStatus[];
  currentUserId: number;
  onSendMessage: (content: string, type?: string, fileUrl?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onReaction: (messageId: number, emoji: string) => void;
  onMarkSeen: () => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👏", "🤔"];

// Image Modal for viewing images fullscreen
function ImageModal({
  src,
  alt,
  onClose
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((s) => Math.min(4, s + 0.5));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm truncate max-w-[300px]">{alt}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image container */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-4 bg-black/50">
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title={t('auto.lesson_chat_3')}
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-white text-sm font-mono min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title={t('auto.lesson_chat_4')}
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleReset(); }}
          className="px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function ChatPanel({
  messages,
  typingUsers,
  currentUserId,
  onSendMessage,
  onSendTyping,
  onReaction,
  onMarkSeen,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; alt: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);
  const stickAfterSendRef = useRef(false);

  const updateNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = dist < 72;
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateNearBottom, { passive: true });
    return () => el.removeEventListener("scroll", updateNearBottom);
  }, [updateNearBottom]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!nearBottomRef.current && !stickAfterSendRef.current) return;
    stickAfterSendRef.current = false;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    onMarkSeen();
  }, [messages.length, onMarkSeen]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);

      if (value.trim() && !wasTypingRef.current) {
        wasTypingRef.current = true;
        onSendTyping(true);
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        wasTypingRef.current = false;
        onSendTyping(false);
      }, 2000);
    },
    [onSendTyping]
  );

  // Xử lý chọn file
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (giới hạn 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
      return;
    }

    setSelectedFile(file);

    // Tạo preview cho ảnh
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  // Xóa file đã chọn
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Upload file và lấy URL
  const handleUploadFile = useCallback(async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", selectedFile);

      const response = await api.post<{ data: string[] }>("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const fileUrl = response.data.data?.[0];
      if (!fileUrl) {
        throw new Error("Không nhận được URL file");
      }

      return fileUrl;
    } catch (error: any) {
      console.error("Upload file error:", error);
      toast.error(error?.response?.data?.message || "Tải file thất bại");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  // Gửi tin nhắn có file
  const handleSendWithFile = useCallback(async () => {
    if (isUploading || !selectedFile) return;

    const fileUrl = await handleUploadFile();
    if (!fileUrl) return;

    const content = selectedFile.name;
    nearBottomRef.current = true;
    stickAfterSendRef.current = true;
    onSendMessage(content, "FILE", fileUrl);

    handleRemoveFile();
    setInput("");
  }, [selectedFile, isUploading, handleUploadFile, handleRemoveFile, onSendMessage]);

  // Gửi tin nhắn text
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content) return;
    nearBottomRef.current = true;
    stickAfterSendRef.current = true;
    onSendMessage(content, "TEXT");
    setInput("");
    wasTypingRef.current = false;
    onSendTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [input, onSendMessage, onSendTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Render file message - hiển thị ảnh trực tiếp trong chat
  const renderFileMessage = (msg: ChatMessage) => {
    const isImage = msg.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const fileName = msg.content || "File";

    if (isImage) {
      return (
        <div className="flex flex-col gap-1">
          <img
            src={msg.fileUrl!}
            alt={fileName}
            className="max-w-[300px] max-h-[300px] rounded-lg cursor-pointer hover:opacity-95 transition-opacity object-contain bg-black/20"
            onClick={() => setViewingImage({ url: msg.fileUrl!, alt: fileName })}
          />
          <span className="text-[10px] text-[#8B8FA8] truncate">{fileName}</span>
        </div>
      );
    }

    // File khác (PDF, doc, etc)
    const getFileIcon = () => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return '📄';
      if (ext === 'doc' || ext === 'docx') return '📝';
      if (ext === 'xls' || ext === 'xlsx') return '📊';
      if (ext === 'ppt' || ext === 'pptx') return '📽️';
      return '📎';
    };

    return (
      <a
        href={msg.fileUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-[#1a1d27] hover:bg-[#252838] rounded-xl transition-colors border border-white/5"
      >
        <span className="text-lg">{getFileIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{fileName}</div>
          <div className="text-[10px] text-[#8B8FA8]">{t('auto.lesson_chat_1')}</div>
        </div>
      </a>
    );
  };

  const parseReactions = (json: string): Record<string, number[]> => {
    try {
      return JSON.parse(json || "{}");
    } catch {
      return {};
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#8B8FA8] text-xs text-center leading-relaxed">
              Gửi tin nhắn để bắt đầu
              <br />
              trò chuyện trong buổi học.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const reactions = parseReactions(msg.reactions);
          const hasReactions = Object.keys(reactions).length > 0;

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-0.5 group", isMine ? "items-end" : "items-start")}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              {/* Sender name */}
              <span className="text-[#8B8FA8] text-[10px] px-1">
                {msg.senderName}
                <span className="ml-1 text-[#8B8FA8]/50">
                  {msg.senderRole === "TEACHER" ? "GV" : "HV"}
                </span>
              </span>

              {/* Message bubble */}
              <div className="relative max-w-[85%]">
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm shadow-sm",
                    isMine
                      ? "bg-[#6C63FF] text-white rounded-br-sm"
                      : "bg-[#252838] text-[#F0F0F0] rounded-bl-sm",
                    msg.type === "VOCABULARY" && "border border-[#4ECDC4]/30 bg-[#4ECDC4]/10",
                    msg.type === "FILE" && "p-2"
                  )}
                >
                  {msg.type === "VOCABULARY" ? (
                    <VocabularyCard content={msg.content} />
                  ) : msg.type === "FILE" ? (
                    renderFileMessage(msg)
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}

                  {msg.type !== "FILE" && (
                    <div
                      className={cn(
                        "mt-1 text-[10px] text-right",
                        isMine ? "text-white/50" : "text-[#8B8FA8]/60"
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  )}
                </div>

                {/* Quick reaction picker */}
                {hoveredMsgId === msg.id && (
                  <div
                    className={cn(
                      "absolute -top-8 z-10 flex items-center gap-0.5 bg-[#1a1d27] border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg",
                      isMine ? "right-0" : "left-0"
                    )}
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReaction(msg.id, emoji)}
                        className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-xs transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reaction badges */}
              {hasReactions && (
                <div className="flex flex-wrap gap-1 px-1">
                  {Object.entries(reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(msg.id, emoji)}
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-colors",
                        (users as number[]).includes(currentUserId)
                          ? "bg-[#6C63FF]/20 border-[#6C63FF]/40 text-[#6C63FF]"
                          : "bg-white/5 border-white/10 text-[#8B8FA8] hover:bg-white/10"
                      )}
                    >
                      <span>{emoji}</span>
                      <span>{(users as number[]).length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 px-1 py-1">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FA8] animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FA8] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FA8] animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-[#8B8FA8]">
              {typingUsers.map((t) => t.userName).join(", ")} đang nhập...
            </span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 p-3 border-t border-white/[0.08] bg-[#0f1117]/60">
        <div className="flex gap-2 items-end">
          {/* File attachment button */}
          <div className="relative shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="shrink-0 w-10 h-10 rounded-xl bg-[#252838] hover:bg-[#2d3142] text-[#8B8FA8] hover:text-[#F0F0F0] disabled:opacity-50 flex items-center justify-center transition-colors border border-white/5"
              title={t('auto.lesson_chat_5')}
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </div>

          {/* Main text input */}
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('auto.lesson_chat_2')}
            rows={1}
            className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-[#252838] border border-white/10 text-sm text-[#F0F0F0] placeholder:text-[#8B8FA8]/60 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors"
          />

          {/* Send button */}
          <button
            onClick={selectedFile ? handleSendWithFile : handleSend}
            disabled={isUploading || (!input.trim() && !selectedFile)}
            className="shrink-0 w-10 h-10 rounded-xl bg-[#6C63FF] hover:bg-[#5a52e0] disabled:opacity-30 disabled:hover:bg-[#6C63FF] text-white flex items-center justify-center transition-colors"
          >
            {isUploading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* File preview */}
        {selectedFile && (
          <div className="mt-2 flex items-center gap-2 p-2 bg-[#1a1d27] rounded-lg border border-white/5">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="h-12 w-12 object-cover rounded"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-[#252838] flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#8B8FA8]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{selectedFile.name}</div>
              <div className="text-[10px] text-[#8B8FA8]">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VocabularyCard({ content }: { content: string }) {
  const lines = content.split("\n");
  const word = lines[0] || "";
  const reading = lines[1] || "";
  const meaning = lines[2] || "";
  const example = lines[3] || "";

  return (
    <div className="space-y-1">
      <div className="text-base font-bold text-[#4ECDC4]">{word}</div>
      {reading && <div className="text-xs text-[#FF6B6B]">{reading}</div>}
      {meaning && <div className="text-xs text-[#F0F0F0]">{meaning}</div>}
      {example && (
        <div className="text-[11px] text-[#8B8FA8] italic border-l-2 border-[#4ECDC4]/30 pl-2 mt-1">
          {example}
        </div>
      )}
    </div>
  );
}
