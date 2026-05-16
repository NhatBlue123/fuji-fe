"use client";

import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import { useGetWhiteboardSnapshotQuery } from "@/store/services/lessonApi";
import { Trash2, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const TldrawEditor = dynamic(
  () => import("tldraw").then((mod) => {
    const { Tldraw } = mod;
    return function TldrawWrapper({ onMount }: { onMount: (editor: unknown) => void }) {
      return (
        <Tldraw
          onMount={onMount}
          autoFocus
          hideUi={false}
        />
      );
    };
  }),
  { ssr: false, loading: () => <WhiteboardSkeleton /> }
);

interface WhiteboardPanelProps {
  lessonId: number;
  token: string | null;
  currentUserId: number;
}

const WHITEBOARD_FLUSH_INTERVAL_MS = 80;
const WHITEBOARD_MAX_BATCH_SIZE = 24;

type TldrawRecord = Record<string, unknown>;
type TldrawChanges = {
  added?: Record<string, TldrawRecord>;
  updated?: Record<string, [TldrawRecord, TldrawRecord]>;
  removed?: Record<string, TldrawRecord>;
};

function getRecordId(record: unknown, fallback: string): string {
  if (record && typeof record === "object") {
    const id = (record as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id;
  }
  return fallback;
}

function normalizeTldrawChanges(payload: unknown): TldrawChanges | null {
  const changes = ((payload as { changes?: unknown })?.changes ?? payload) as TldrawChanges | null;
  if (!changes || typeof changes !== "object") return null;
  return changes;
}

function compactTldrawChanges(changes: TldrawChanges): TldrawChanges {
  const compact: TldrawChanges = {};
  if (changes.added && Object.keys(changes.added).length > 0) compact.added = changes.added;
  if (changes.updated && Object.keys(changes.updated).length > 0) compact.updated = changes.updated;
  if (changes.removed && Object.keys(changes.removed).length > 0) compact.removed = changes.removed;
  return compact;
}

function hasTldrawChanges(changes: TldrawChanges | null): changes is TldrawChanges {
  if (!changes) return false;
  return Boolean(
    (changes.added && Object.keys(changes.added).length > 0) ||
    (changes.updated && Object.keys(changes.updated).length > 0) ||
    (changes.removed && Object.keys(changes.removed).length > 0)
  );
}

function mergeTldrawChanges(current: TldrawChanges, next: TldrawChanges): TldrawChanges {
  const merged: TldrawChanges = {
    added: { ...(current.added ?? {}) },
    updated: { ...(current.updated ?? {}) },
    removed: { ...(current.removed ?? {}) },
  };

  if (next.added) {
    for (const [fallbackId, record] of Object.entries(next.added)) {
      const id = getRecordId(record, fallbackId);
      delete merged.updated?.[id];
      delete merged.removed?.[id];
      merged.added![id] = record;
    }
  }

  if (next.updated) {
    for (const [fallbackId, pair] of Object.entries(next.updated)) {
      if (!Array.isArray(pair)) continue;
      const [from, to] = pair;
      const id = getRecordId(to, fallbackId);
      if (merged.added?.[id]) {
        merged.added[id] = to;
      } else {
        const existing = merged.updated?.[id];
        merged.updated![id] = [existing?.[0] ?? from, to];
      }
    }
  }

  if (next.removed) {
    for (const [fallbackId, record] of Object.entries(next.removed)) {
      const id = getRecordId(record, fallbackId);
      if (merged.added?.[id]) {
        delete merged.added[id];
      } else {
        delete merged.updated?.[id];
        merged.removed![id] = record;
      }
    }
  }

  return compactTldrawChanges(merged);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTldrawChanges(editor: any, payload: unknown) {
  const changes = normalizeTldrawChanges(payload);
  if (!hasTldrawChanges(changes)) return;

  editor.store.mergeRemoteChanges(() => {
    if (changes.added) {
      for (const record of Object.values(changes.added)) {
        editor.store.put([record]);
      }
    }
    if (changes.updated) {
      for (const [, to] of Object.values(changes.updated)) {
        editor.store.put([to]);
      }
    }
    if (changes.removed) {
      for (const id of Object.keys(changes.removed)) {
        try {
          editor.store.remove([id]);
        } catch {
          /* ignore stale records */
        }
      }
    }
  });
}

export function WhiteboardPanel({ lessonId, token, currentUserId }: WhiteboardPanelProps) {
  const { t } = useTranslation();
  const { sendChanges, clearBoard, onRemoteChange, onRemoteClear } = useWhiteboard(lessonId, token);
  const { data: snapshotChanges = [] } = useGetWhiteboardSnapshotQuery({ lessonId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const snapshotAppliedRef = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasShapes, setHasShapes] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const isRemoteUpdateRef = useRef(false);
  const pendingLocalChangesRef = useRef<TldrawChanges | null>(null);
  const pendingLocalChangeCountRef = useRef(0);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storeUnlistenRef = useRef<(() => void) | null>(null);

  const syncHasShapes = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      setHasShapes(false);
      return;
    }
    const shapeIds = editor.getCurrentPageShapeIds();
    setHasShapes(shapeIds.size > 0);
  }, []);

  const flushLocalChanges = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const changes = pendingLocalChangesRef.current;
    pendingLocalChangesRef.current = null;
    pendingLocalChangeCountRef.current = 0;

    if (hasTldrawChanges(changes)) {
      sendChanges(compactTldrawChanges(changes));
    }
  }, [sendChanges]);

  const queueLocalChanges = useCallback(
    (payload: unknown) => {
      const changes = normalizeTldrawChanges(payload);
      if (!hasTldrawChanges(changes)) return;

      pendingLocalChangesRef.current = pendingLocalChangesRef.current
        ? mergeTldrawChanges(pendingLocalChangesRef.current, changes)
        : compactTldrawChanges(changes);
      pendingLocalChangeCountRef.current += 1;

      if (pendingLocalChangeCountRef.current >= WHITEBOARD_MAX_BATCH_SIZE) {
        flushLocalChanges();
        return;
      }

      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(flushLocalChanges, WHITEBOARD_FLUSH_INTERVAL_MS);
      }
    },
    [flushLocalChanges]
  );

  useEffect(() => {
    return () => {
      storeUnlistenRef.current?.();
      storeUnlistenRef.current = null;
      flushLocalChanges();
    };
  }, [flushLocalChanges]);

  const handleMount = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any) => {
      editorRef.current = editor;
      setEditorReady(true);
      // Bật grid mode để người dùng dễ canh nét vẽ ngay từ đầu.
      try {
        editor.updateInstanceState?.({ isGridMode: true });
      } catch {
        // ignore: fallback nếu version tldraw không hỗ trợ API này
      }
      syncHasShapes();

      const store = editor.store;
      storeUnlistenRef.current?.();
      storeUnlistenRef.current = store.listen(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => {
          if (isRemoteUpdateRef.current) return;
          if (entry.source !== "user") return;

          const changes = entry.changes;
          if (!changes) return;

          queueLocalChanges(changes);
          syncHasShapes();
        },
        { source: "user", scope: "document" }
      );
    },
    [queueLocalChanges, syncHasShapes]
  );

  useEffect(() => {
    snapshotAppliedRef.current = false;
  }, [lessonId]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editorReady || !editor || snapshotAppliedRef.current || snapshotChanges.length === 0) {
      return;
    }

    snapshotAppliedRef.current = true;
    isRemoteUpdateRef.current = true;
    try {
      for (const changes of snapshotChanges) {
        applyTldrawChanges(editor, changes);
      }
    } catch (e) {
      console.warn("[Whiteboard] Failed to apply snapshot:", e);
    } finally {
      isRemoteUpdateRef.current = false;
      syncHasShapes();
    }
  }, [editorReady, snapshotChanges, syncHasShapes]);

  useEffect(() => {
    onRemoteChange((data) => {
      const editor = editorRef.current;
      if (!editor) return;
      if (data.userId === String(currentUserId)) return;

      isRemoteUpdateRef.current = true;
      try {
        applyTldrawChanges(editor, data.changes);
      } catch (e) {
        console.warn("[Whiteboard] Failed to apply remote changes:", e);
      } finally {
        isRemoteUpdateRef.current = false;
        syncHasShapes();
      }
    });

    onRemoteClear(() => {
      const editor = editorRef.current;
      if (!editor) return;
      isRemoteUpdateRef.current = true;
      try {
        const allShapeIds = editor.getCurrentPageShapeIds();
        if (allShapeIds.size > 0) {
          editor.deleteShapes([...allShapeIds]);
        }
      } catch { /* ignore */ }
      finally {
        isRemoteUpdateRef.current = false;
        syncHasShapes();
      }
    });
  }, [onRemoteChange, onRemoteClear, currentUserId, syncHasShapes]);

  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const allShapeIds = editor.getCurrentPageShapeIds();
    if (allShapeIds.size > 0) {
      editor.deleteShapes([...allShapeIds]);
    }
    clearBoard();
    setHasShapes(false);
    setShowClearConfirm(false);
  }, [clearBoard]);

  const handleExport = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const shapeIds = [...editor.getCurrentPageShapeIds()];
      if (shapeIds.length === 0) return;

      const blob = await editor.toImage(shapeIds, { type: "png", background: true });
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whiteboard-${lessonId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("[Whiteboard] Export failed:", e);
    }
  }, [lessonId]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
        <span className="text-[10px] text-[#8B8FA8]">Multiplayer whiteboard</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg text-[#8B8FA8] hover:text-[#F0F0F0] hover:bg-white/[0.06] transition-colors"
            title="Export PNG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
            title="Clear board"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tldraw canvas */}
      <div
        className={cn(
          "flex-1 min-h-0 relative rounded-b-lg overflow-hidden",
          // Grid nền để bảng đỡ "trắng trơn" khi chưa vẽ gì.
          "bg-[linear-gradient(rgba(108,99,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(108,99,255,0.10)_1px,transparent_1px)] bg-[size:24px_24px]"
        )}
      >
        <TldrawEditor onMount={handleMount} />
        {!hasShapes && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-full bg-white/85 px-4 py-1.5 text-xs font-medium text-[#5d5f7a] shadow-sm">
              Bắt đầu vẽ tại đây
            </div>
          </div>
        )}
      </div>

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1e2130] border border-white/10 rounded-2xl p-5 max-w-xs text-center shadow-xl">
            <AlertTriangle className="h-8 w-8 text-[#FF6B6B] mx-auto mb-3" />
            <p className="text-[#F0F0F0] text-sm font-semibold mb-1">{t('auto.lesson_whiteboard_1')}</p>
            <p className="text-[#8B8FA8] text-xs mb-4">{t('auto.lesson_whiteboard_2')}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-[#8B8FA8] text-xs font-medium hover:bg-white/[0.04]"
              >
                Hủy
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-[#FF6B6B] text-white text-xs font-semibold hover:bg-[#ff5252]"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WhiteboardSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#252838]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[#8B8FA8] text-xs">Loading whiteboard...</p>
      </div>
    </div>
  );
}
