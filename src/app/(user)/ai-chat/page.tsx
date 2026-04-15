"use client";

import { useState, memo, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import AssistantPanel from "../../../components/user-component/ai/AssistantPanel";
import SenseiPanel from "../../../components/user-component/ai/SenseiPanel";
import type { PracticeMode } from "../../../components/user-component/ai/shared";

/* ------------------------------------------------------------------ */
/* Page shell — mode tabs + panel components                            */
/* ------------------------------------------------------------------ */

export default function AIChatPage() {
  const [mode, setMode] = useState<PracticeMode>("assistant");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Mode tabs — Chatbot first, Sensei second */}
      <div className="flex border-b border-border bg-muted/30 shrink-0">
        <Button
          variant="ghost"
          onClick={() => setMode("assistant")}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all ${mode === "assistant"
            ? "border-primary text-primary bg-primary/5"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
        >
          <span className="material-symbols-outlined text-lg">smart_toy</span>
          Chatbot AI
        </Button>
        <Button
          variant="ghost"
          onClick={() => setMode("sensei")}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all ${mode === "sensei"
            ? "border-secondary text-secondary bg-secondary/5"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
        >
          <span className="material-symbols-outlined text-lg">
            record_voice_over
          </span>
          Giao tiếp với AI Sensei
        </Button>
      </div>

      {/* Render explicit variant — no conditional inside one component */}
      {mode === "assistant" ? <AssistantPanel /> : <SenseiPanel />}
    </div>
  );
}
