"use client";
import React from "react";
import type { AntiCheatWarning } from "@/hooks/useAntiCheat";

interface AntiCheatOverlayProps {
  warning: AntiCheatWarning;
  tabSwitchCount: number;
  maxTabSwitches: number;
  onDismiss: () => void;
}

const ICON: Record<AntiCheatWarning["type"], string> = {
  tab_switch: "tab_unselected",
  devtools: "code_blocks",
  copy_attempt: "content_copy",
};

const TITLE: Record<AntiCheatWarning["type"], string> = {
  tab_switch: "Phát hiện rời trang thi",
  devtools: "DevTools được phát hiện",
  copy_attempt: "Chức năng bị vô hiệu hóa",
};

const COLOR: Record<AntiCheatWarning["type"], string> = {
  tab_switch: "#f59e0b",   // amber
  devtools:   "#ef4444",   // red
  copy_attempt: "#3b82f6", // blue
};

export default function AntiCheatOverlay({
  warning,
  tabSwitchCount,
  maxTabSwitches,
  onDismiss,
}: AntiCheatOverlayProps) {
  const color = COLOR[warning.type];
  const isDevTools = warning.type === "devtools";
  const isSerious = warning.type === "tab_switch" && tabSwitchCount >= maxTabSwitches;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div
        className="bg-[#1a2540] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center"
        style={{ border: `2px solid ${color}`, boxShadow: `0 0 40px ${color}33` }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${color}22` }}
        >
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color, fontVariationSettings: "'FILL' 1" }}
          >
            {ICON[warning.type]}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2" style={{ color }}>
          {TITLE[warning.type]}
        </h2>

        {/* Message */}
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          {warning.message}
        </p>

        {/* Tab switch progress bar */}
        {warning.type === "tab_switch" && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Lần rời trang</span>
              <span style={{ color: isSerious ? "#ef4444" : "#f59e0b" }}>
                {tabSwitchCount}/{maxTabSwitches}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((tabSwitchCount / maxTabSwitches) * 100, 100)}%`,
                  backgroundColor: isSerious ? "#ef4444" : "#f59e0b",
                }}
              />
            </div>
            {isSerious && (
              <p className="text-red-400 text-xs mt-2 font-medium">
                ⚠️ Hành vi gian lận đã được ghi nhận vào hệ thống.
              </p>
            )}
          </div>
        )}

        {/* DevTools note */}
        {isDevTools && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-xs">
              Timer đã bị tạm dừng. Đóng DevTools để tiếp tục làm bài.
            </p>
          </div>
        )}

        {/* Dismiss button — not available for devtools (must close devtools) */}
        {!isDevTools && (
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-lg font-bold text-white transition"
            style={{ backgroundColor: color }}
          >
            Tôi hiểu, tiếp tục làm bài
          </button>
        )}

        {isDevTools && (
          <p className="text-slate-500 text-xs mt-2">
            Cảnh báo này sẽ tự đóng khi bạn đóng DevTools.
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
