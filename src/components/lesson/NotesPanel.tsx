"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useGetMyNoteQuery, useSaveMyNoteMutation } from "@/store/services/lessonApi";
import { Save, CheckCircle, Loader2 } from "lucide-react";

interface NotesPanelProps {
  lessonId: number;
}

export function NotesPanel({ lessonId }: NotesPanelProps) {
  const { data: noteData, isLoading: isLoadingNote } = useGetMyNoteQuery({ lessonId });
  const [saveNote, { isLoading: isSaving }] = useSaveMyNoteMutation();

  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (noteData && !initialLoadRef.current) {
      setContent(noteData.content || "");
      initialLoadRef.current = true;
      if (noteData.updatedAt) {
        setLastSaved(new Date(noteData.updatedAt));
      }
    }
  }, [noteData]);

  const doSave = useCallback(
    async (text: string) => {
      try {
        await saveNote({ lessonId, content: text }).unwrap();
        setLastSaved(new Date());
        setIsDirty(false);
      } catch {
        // Silent fail - will retry on next debounce
      }
    },
    [lessonId, saveNote]
  );

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      setIsDirty(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSave(value);
      }, 3000);
    },
    [doSave]
  );

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleManualSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSave(content);
  }, [content, doSave]);

  const formatLastSaved = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  if (isLoadingNote) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 text-[#8B8FA8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8B8FA8]">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang lưu...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-[#4ECDC4]" />
                Đã lưu lúc {formatLastSaved(lastSaved)}
              </span>
            ) : (
              "Ghi chú riêng tư"
            )}
          </span>
        </div>

        <button
          onClick={handleManualSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-1 text-[10px] font-medium text-[#6C63FF] hover:text-[#5a52e0] disabled:text-[#8B8FA8]/40 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
        >
          <Save className="h-3 w-3" />
          Lưu
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-3 min-h-0">
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ghi chú cá nhân trong buổi học...&#10;&#10;• Từ vựng mới&#10;• Ngữ pháp cần ôn&#10;• Câu hỏi cho giáo viên"
          className="w-full h-full resize-none bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#8B8FA8]/40 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2 border-t border-white/[0.08]">
        <p className="text-[10px] text-[#8B8FA8]/50">
          Tự động lưu sau 3 giây • Chỉ bạn mới xem được
        </p>
      </div>
    </div>
  );
}
