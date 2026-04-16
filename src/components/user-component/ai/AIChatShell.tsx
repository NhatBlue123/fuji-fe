"use client";

import { useState } from "react";
import LiquidGlass from "@/components/ui/liquid-glass-safe";
import { Button } from "@/components/ui/button";
import AssistantPanel from "./AssistantPanel";
import SenseiPanel from "./SenseiPanel";
import type { PracticeMode } from "./shared";

type AIChatShellProps = {
  initialConversationId?: number | null;
  forceNewDraft?: boolean;
};

export default function AIChatShell({
  initialConversationId = null,
  forceNewDraft = false,
}: AIChatShellProps) {
  const [mode, setMode] = useState<PracticeMode>("assistant");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-b from-white/35 to-white/10 px-3 py-2 dark:from-slate-900/30 dark:to-slate-900/10">
        <div className="flex gap-2">
          <LiquidGlass
            displacementScale={66}
            blurAmount={0.068}
            saturation={150}
            elasticity={0.13}
            mode="standard"
            cornerRadius={14}
            className="rounded-xl"
          >
            <Button
              variant="ghost"
              onClick={() => setMode("assistant")}
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
                mode === "assistant"
                  ? "border-primary/45 bg-primary/12 text-primary"
                  : "border-white/55 bg-white/68 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:border-white/15 dark:bg-slate-900/55"
              }`}
            >
              <span className="material-symbols-outlined text-lg">smart_toy</span>
              Chatbot AI
            </Button>
          </LiquidGlass>

          <LiquidGlass
            displacementScale={66}
            blurAmount={0.068}
            saturation={150}
            elasticity={0.13}
            mode="standard"
            cornerRadius={14}
            className="rounded-xl"
          >
            <Button
              variant="ghost"
              onClick={() => setMode("sensei")}
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
                mode === "sensei"
                  ? "border-secondary/45 bg-secondary/12 text-secondary"
                  : "border-white/55 bg-white/68 text-muted-foreground hover:border-secondary/30 hover:text-foreground dark:border-white/15 dark:bg-slate-900/55"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                record_voice_over
              </span>
              Giao tiếp với AI Sensei
            </Button>
          </LiquidGlass>
        </div>
      </div>

      {mode === "assistant" ? (
        <AssistantPanel
          initialConversationId={initialConversationId}
          forceNewDraft={forceNewDraft}
        />
      ) : (
        <SenseiPanel />
      )}
    </div>
  );
}
