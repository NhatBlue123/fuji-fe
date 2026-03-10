"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export interface AntiCheatWarning {
  type: "tab_switch" | "devtools" | "copy_attempt";
  message: string;
  count?: number;
}

interface UseAntiCheatOptions {
  /** Số lần rời tab tối đa trước khi hiện cảnh báo nghiêm trọng */
  maxTabSwitches?: number;
  /** Có bật phát hiện DevTools không */
  detectDevTools?: boolean;
  /** Callback khi có sự kiện gian lận */
  onViolation?: (warning: AntiCheatWarning) => void;
}

interface AntiCheatState {
  /** Số lần rời tab */
  tabSwitchCount: number;
  /** DevTools đang mở */
  devToolsOpen: boolean;
  /** Cảnh báo hiện tại cần hiển thị overlay */
  activeWarning: AntiCheatWarning | null;
  /** Xóa cảnh báo hiện tại */
  dismissWarning: () => void;
}

const DEVTOOLS_THRESHOLD = 160; // px difference to detect devtools

export function useAntiCheat({
  maxTabSwitches = 3,
  detectDevTools = true,
  onViolation,
}: UseAntiCheatOptions = {}): AntiCheatState {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [activeWarning, setActiveWarning] = useState<AntiCheatWarning | null>(null);
  const tabSwitchCountRef = useRef(0);
  const devToolsRef = useRef(false);

  const trigger = useCallback(
    (warning: AntiCheatWarning) => {
      setActiveWarning(warning);
      onViolation?.(warning);
    },
    [onViolation]
  );

  const dismissWarning = useCallback(() => setActiveWarning(null), []);

  // ─── Feature 1: Tab Switching Detection ─────────────────────────────────────
  useEffect(() => {
    let lastPenaltyTime = 0;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const now = Date.now();
        if (now - lastPenaltyTime < 1000) return;
        lastPenaltyTime = now;

        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);

        const count = tabSwitchCountRef.current;
        const isSerious = count >= maxTabSwitches;

        trigger({
          type: "tab_switch",
          count,
          message: isSerious
            ? `⚠️ Cảnh báo nghiêm trọng! Bạn đã rời khỏi trang thi ${count} lần. Hành vi này đã được ghi nhận.`
            : `Bạn vừa rời khỏi trang thi (lần ${count}/${maxTabSwitches}). Vui lòng không chuyển tab trong khi thi.`,
        });
      }
    };

    const handleBlur = () => {
      // window blur = switched to another app/window
      if (document.visibilityState === "visible") {
        // Visible but blurred = another OS window (not tab switch, handled above)
        const now = Date.now();
        if (now - lastPenaltyTime < 1000) return;
        lastPenaltyTime = now;

        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        const count = tabSwitchCountRef.current;
        trigger({
          type: "tab_switch",
          count,
          message:
            count >= maxTabSwitches
              ? `⚠️ Cảnh báo nghiêm trọng! Bạn đã rời khỏi trang thi ${count} lần.`
              : `Bạn vừa chuyển sang cửa sổ khác (lần ${count}/${maxTabSwitches}).`,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [maxTabSwitches, trigger]);

  // ─── Feature 2: Copy / Paste / Right-click Block ─────────────────────────────
  useEffect(() => {
    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      // Block Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A
      if (ctrl && ["c", "x", "v", "a"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        trigger({
          type: "copy_attempt",
          message: "Chức năng sao chép/dán bị vô hiệu hóa trong khi thi.",
        });
      }
      // Block F12
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("paste", blockEvent);
    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("paste", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [trigger]);

  // ─── Feature 3: DevTools Detection ───────────────────────────────────────────
  useEffect(() => {
    if (!detectDevTools) return;

    const check = () => {
      // Method 1: window size difference
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen = widthDiff > DEVTOOLS_THRESHOLD || heightDiff > DEVTOOLS_THRESHOLD;

      if (isOpen !== devToolsRef.current) {
        devToolsRef.current = isOpen;
        setDevToolsOpen(isOpen);
        if (isOpen) {
          trigger({
            type: "devtools",
            message:
              "🔍 Công cụ Developer Tools đã được phát hiện. Đóng DevTools để tiếp tục làm bài. Timer đã bị tạm dừng.",
          });
        }
      }
    };

    const interval = setInterval(check, 1000);
    window.addEventListener("resize", check);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", check);
    };
  }, [detectDevTools, trigger]);

  return { tabSwitchCount, devToolsOpen, activeWarning, dismissWarning };
}
