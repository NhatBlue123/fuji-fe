"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { useGetMyNoteQuery, useSaveMyNoteMutation } from "@/store/services/lessonApi";
import { Save, CheckCircle, Loader2 } from "lucide-react";

interface NotesPanelProps {
  lessonId: number;
}

export function NotesPanel({ lessonId }: NotesPanelProps) {
  const { t } = useTranslation();
  const { data: noteData, isLoading: isLoadingNote } = useGetMyNoteQuery(
    { lessonId },
    { skip: !lessonId }
  );
  const [saveNote] = useSaveMyNoteMutation();

  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents concurrent saves — only one PUT at a time
  const saveLockRef = useRef(false);
  // If a save completes while another was queued, flush the latest content
  const pendingTextRef = useRef<string | null>(null);
  // Track initial data load per lessonId
  const initialLoadedRef = useRef<number | null>(null);
  // Stable refs so async callbacks always use latest values
  const lessonIdRef = useRef(lessonId);
  const saveNoteRef = useRef(saveNote);

  useEffect(() => { lessonIdRef.current = lessonId; }, [lessonId]);
  useEffect(() => { saveNoteRef.current = saveNote; }, [saveNote]);

  // Load note from server when data arrives (only once per lessonId)
  useEffect(() => {
    if (noteData && initialLoadedRef.current !== lessonId) {
      initialLoadedRef.current = lessonId;
      setContent(noteData.content || "");
      setIsDirty(false);
      if (noteData.updatedAt) {
        setLastSaved(new Date(noteData.updatedAt));
      }
    }
  }, [noteData, lessonId]);

  // Reset when lessonId changes
  useEffect(() => {
    initialLoadedRef.current = null;
    saveLockRef.current = false;
    pendingTextRef.current = null;
    setContent("");
    setLastSaved(null);
    setIsDirty(false);
    setIsSaving(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [lessonId]);

  // Core save — serialized via saveLockRef
  const executeSave = useCallback(async (text: string): Promise<void> => {
    const lid = lessonIdRef.current;
    if (!lid) return;

    setIsSaving(true);
    saveLockRef.current = true;

    try {
      await saveNoteRef.current({ lessonId: lid, content: text }).unwrap();
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err: any) {
      if (err?.status === 409) {
        // 409 = race condition on first insert — the note was created by a
        // concurrent request. Our content is the latest, retry once.
        console.warn("[Notes] 409 on first save, retrying...");
        try {
          await saveNoteRef.current({ lessonId: lid, content: text }).unwrap();
          setLastSaved(new Date());
          setIsDirty(false);
        } catch (retryErr: any) {
          console.error("[Notes] Retry also failed:", retryErr?.status, retryErr?.data);
        }
      } else if (err?.status) {
        console.error(`[Notes] Save failed HTTP ${err.status}:`, err?.data);
      } else {
        console.error("[Notes] Save failed (network):", err?.error ?? err);
      }
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);

      // Flush any content that arrived while we were saving
      const pending = pendingTextRef.current;
      if (pending !== null) {
        pendingTextRef.current = null;
        executeSave(pending);
      }
    }
  }, []); // no deps — always uses stable refs

  const doSave = useCallback((text: string) => {
    if (saveLockRef.current) {
      // A save is already in-flight — queue the latest content
      pendingTextRef.current = text;
      return;
    }
    executeSave(text);
  }, [executeSave]);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      setIsDirty(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSave(value);
      }, 1500);
    },
    [doSave]
  );

  // Clear debounce on unmount
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
          placeholder={t('auto.lesson_notes_1')}
          className="w-full h-full resize-none bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#8B8FA8]/40 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2 border-t border-white/[0.08]">
        <p className="text-[10px] text-[#8B8FA8]/50">
          Tự động lưu sau 1.5 giây • Chỉ bạn mới xem được
        </p>
      </div>
    </div>
  );
}
