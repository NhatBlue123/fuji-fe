"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LiquidGlass from "@/components/ui/liquid-glass-safe";
import { Button } from "@/components/ui/button";
import { ThinkBlock, type AssistantMessage } from "../shared";
import {
  ActionLinksCard,
  CourseCompareTable,
  CoursePreviewList,
  NextStepsCard,
  PaymentActionCard,
  PurchaseSummaryCard,
  QuickFactsCard,
  StructuredLoadingCard,
} from "./StructuredCards";
import type { AssistantQueuedInfo, ParseAssistantContentFn } from "./types";
import AiAvatar from "@/components/chatdock/AiAvatar";

type AiMessageBubbleProps = {
  msg: AssistantMessage;
  parseAssistantContent: ParseAssistantContentFn;
  onCopy: (text: string) => void;
};

type UserMessageBubbleProps = {
  msg: AssistantMessage;
};

type AssistantTypingStatusProps = {
  isTyping: boolean;
  queuedInfo: AssistantQueuedInfo;
  elapsedMs: number;
  intentToLabel: (intent?: string) => string;
};

export function AiMessageBubble({
  msg,
  parseAssistantContent,
  onCopy,
}: AiMessageBubbleProps) {
  return (
    <div className="flex items-start gap-4 max-w-3xl">
      <LiquidGlass
        displacementScale={66}
        blurAmount={0.068}
        saturation={150}
        elasticity={0.12}
        mode="standard"
        cornerRadius={999}
        className="size-10 shrink-0 rounded-full"
      >
        <div className="size-10 rounded-full border border-white/65 bg-gradient-to-br from-white/85 to-sky-100/55 p-0.5 shadow-[0_16px_28px_-20px_rgba(37,99,235,0.55)] dark:border-blue-500/30 dark:from-blue-500/20 dark:to-blue-600/15 dark:shadow-[0_16px_28px_-20px_rgba(59,130,246,0.4)]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-card/70 backdrop-blur-sm dark:bg-slate-800/90 p-1.5">
            <AiAvatar className="w-full h-full" />
          </div>
        </div>
      </LiquidGlass>

      <div className="flex flex-col gap-1 min-w-0">
        <div className="ml-1 text-xs font-medium text-muted-foreground dark:text-slate-400">
          Trợ giảng AI
        </div>

        <LiquidGlass
          displacementScale={76}
          blurAmount={0.078}
          saturation={155}
          elasticity={0.15}
          mode="prominent"
          cornerRadius={18}
          className="rounded-2xl"
        >
          <div className="relative overflow-hidden rounded-2xl rounded-tl-none border border-white/60 bg-gradient-to-br from-white/86 via-white/56 to-sky-100/40 p-4 text-foreground shadow-[0_26px_56px_-36px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-700/50 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/90 dark:shadow-[0_26px_56px_-36px_rgba(0,0,0,0.6)]">
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.72),transparent_54%)] dark:bg-[radial-gradient(circle_at_18%_16%,rgba(59,130,246,0.08),transparent_54%)]" />

            <div className="relative z-10">
              {msg.think && (
                <ThinkBlock content={msg.think} isStreaming={msg._streaming} />
              )}

              {msg.textJp && (
                <p className="mb-1 text-lg font-bold text-foreground">
                  {msg.textJp}
                </p>
              )}

              {msg.textVn && (
                <div
                  className="prose prose-sm max-w-none text-sm dark:prose-invert
                  [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-bold dark:[&_h1]:text-slate-100
                  [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-bold dark:[&_h2]:text-slate-200
                  [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold dark:[&_h3]:text-slate-300
                  [&_p]:mb-2 [&_p]:leading-relaxed dark:[&_p]:text-slate-200
                  [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4
                  [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4
                  [&_li]:mb-0.5 dark:[&_li]:text-slate-200
                  [&_strong]:font-semibold [&_strong]:text-foreground dark:[&_strong]:text-slate-100
                  [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs dark:[&_code]:bg-slate-700/50 dark:[&_code]:text-blue-300
                  [&_pre]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 dark:[&_pre]:bg-slate-900/50
                  [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground dark:[&_blockquote]:border-blue-500/40 dark:[&_blockquote]:text-slate-400
                  [&_hr]:my-2 [&_hr]:border-border dark:[&_hr]:border-slate-700
                  [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-border [&_table]:border-collapse dark:[&_table]:border-slate-700
                  [&_thead]:bg-muted/50 [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold dark:[&_thead]:bg-slate-800/50 dark:[&_th]:border-slate-700 dark:[&_th]:text-slate-200
                  [&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top dark:[&_td]:border-slate-700 dark:[&_td]:text-slate-300
                  [&_tr:last-child_td]:border-b-0
                  [&_img]:my-2 [&_img]:rounded-lg [&_img]:border [&_img]:border-border dark:[&_img]:border-slate-700"
                >
                  {parseAssistantContent(msg.textVn, {
                    streaming: Boolean(msg._streaming),
                  }).map((segment, idx) =>
                    segment.kind === "course-preview" ? (
                      <CoursePreviewList
                        key={`preview-${msg.id}-${idx}`}
                        items={segment.items}
                      />
                    ) : segment.kind === "course-compare" ? (
                      <CourseCompareTable
                        key={`compare-${msg.id}-${idx}`}
                        payload={segment.payload}
                      />
                    ) : segment.kind === "payment-action" ? (
                      <PaymentActionCard
                        key={`payment-${msg.id}-${idx}`}
                        payload={segment.payload}
                      />
                    ) : segment.kind === "action-links" ? (
                      <ActionLinksCard
                        key={`links-${msg.id}-${idx}`}
                        links={segment.links}
                      />
                    ) : segment.kind === "quick-facts" ? (
                      <QuickFactsCard
                        key={`facts-${msg.id}-${idx}`}
                        facts={segment.facts}
                      />
                    ) : segment.kind === "purchase-summary" ? (
                      <PurchaseSummaryCard
                        key={`purchase-${msg.id}-${idx}`}
                        payload={segment.payload}
                      />
                    ) : segment.kind === "next-steps" ? (
                      <NextStepsCard
                        key={`steps-${msg.id}-${idx}`}
                        payload={segment.payload}
                      />
                    ) : segment.kind === "structured-loading" ? (
                      <StructuredLoadingCard
                        key={`loading-${msg.id}-${idx}`}
                        blockType={segment.blockType}
                      />
                    ) : (
                      <ReactMarkdown
                        key={`md-${msg.id}-${idx}`}
                        remarkPlugins={[remarkGfm]}
                      >
                        {segment.content}
                      </ReactMarkdown>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </LiquidGlass>

        {!msg._streaming && msg.textVn && (
          <div className="mt-1 flex items-center gap-2">
            {typeof msg.responseTimeMs === "number" &&
              msg.responseTimeMs > 0 && (
                <span className="text-[10px] tabular-nums text-muted-foreground/60 dark:text-slate-500">
                  {(msg.responseTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            <Button
              variant="ghost"
              className="h-7 w-7 rounded-md p-0 text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
              title="Sao chép"
              onClick={() => onCopy(msg.textVn || "")}
            >
              <span className="material-symbols-outlined text-[15px]">
                content_copy
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserMessageBubble({ msg }: UserMessageBubbleProps) {
  return (
    <div className="ml-auto flex max-w-3xl flex-row-reverse items-start gap-4">
      <LiquidGlass
        displacementScale={62}
        blurAmount={0.06}
        saturation={140}
        elasticity={0.11}
        mode="standard"
        cornerRadius={999}
        className="size-10 shrink-0 rounded-full"
      >
        <div className="flex size-10 items-center justify-center rounded-full border border-white/60 bg-white/75 dark:border-slate-600/50 dark:bg-slate-700/80">
          <span className="material-symbols-outlined text-muted-foreground dark:text-slate-300">
            person
          </span>
        </div>
      </LiquidGlass>

      <LiquidGlass
        displacementScale={70}
        blurAmount={0.062}
        saturation={150}
        elasticity={0.12}
        mode="polar"
        cornerRadius={18}
        className="rounded-2xl"
      >
        <div className="rounded-2xl rounded-tr-none border border-white/55 bg-gradient-to-br from-primary/88 via-primary to-blue-600 p-4 text-primary-foreground shadow-[0_22px_38px_-26px_rgba(37,99,235,0.65)] dark:border-blue-500/30 dark:from-blue-600 dark:via-blue-600 dark:to-blue-700 dark:shadow-[0_22px_38px_-26px_rgba(59,130,246,0.5)]">
          <p className="text-base dark:text-white">{msg.textJp}</p>
        </div>
      </LiquidGlass>
    </div>
  );
}

export function AssistantTypingStatus({
  isTyping,
  queuedInfo,
  elapsedMs,
  intentToLabel,
}: AssistantTypingStatusProps) {
  if (!isTyping) {
    return null;
  }

  return (
    <>
      <div className="ml-14 flex items-center gap-2 opacity-70">
        <span className="text-xs text-muted-foreground dark:text-slate-400">
          Trợ giảng đang soạn
        </span>
        {queuedInfo && (
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground/80 dark:bg-slate-700/50 dark:text-slate-400">
            {intentToLabel(queuedInfo.intent)} · {queuedInfo.jobId || "..."}
          </span>
        )}
        <span className="text-[10px] tabular-nums text-muted-foreground/60 dark:text-slate-500">
          {(elapsedMs / 1000).toFixed(1)}s
        </span>
      </div>
    </>
  );
}
