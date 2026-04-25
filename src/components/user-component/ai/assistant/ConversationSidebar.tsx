"use client";

import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import LiquidGlass from "@/components/ui/liquid-glass-safe";
import { Button } from "@/components/ui/button";
import type { AiConversation } from "@/store/services/aiChatHistoryApi";

type ConversationSidebarProps = {
  conversations: AiConversation[];
  isLoadingConversations: boolean;
  activeConversationId: number | null;
  onStartNewConversation: () => void;
  onSelectConversation: (conversationId: number) => void;
  onDeleteConversation: (conversationId: number) => void;
  getConversationTitle: (conversation: AiConversation) => string;
  formatConversationTime: (dateLike?: string | null) => string;
};

export default function ConversationSidebar({
  conversations,
  isLoadingConversations,
  activeConversationId,
  onStartNewConversation,
  onSelectConversation,
  onDeleteConversation,
  getConversationTitle,
  formatConversationTime,
}: ConversationSidebarProps) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border/60 bg-gradient-to-b from-white/35 to-transparent backdrop-blur-md lg:flex dark:from-slate-900/25">
      <LiquidGlass
        displacementScale={64}
        blurAmount={0.065}
        saturation={146}
        elasticity={0.12}
        mode="standard"
        cornerRadius={0}
        className="rounded-none border-b border-white/35 dark:border-white/10"
      >
        <div className="space-y-3 bg-white/58 p-4 backdrop-blur-xl dark:bg-slate-900/52">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-foreground">
            <MessageSquare className="size-4" /> Lịch sử hội thoại
          </h3>
          <Button
            type="button"
            className="w-full border-white/55 bg-white/72 text-foreground shadow-sm hover:bg-white/85 dark:border-white/15 dark:bg-slate-900/58 dark:text-foreground"
            variant="outline"
            onClick={onStartNewConversation}
          >
            <Plus className="mr-2 size-4" />
            Cuộc trò chuyện mới
          </Button>
        </div>
      </LiquidGlass>

      <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
        {isLoadingConversations && (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Dang tai danh sach hoi thoai...
          </div>
        )}

        {!isLoadingConversations && conversations.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Chưa có cuộc trò chuyện nào.
          </p>
        )}

        {conversations.map((conversation) => {
          const active = conversation.id === activeConversationId;
          return (
            <LiquidGlass
              key={conversation.id}
              displacementScale={68}
              blurAmount={0.07}
              saturation={150}
              elasticity={0.14}
              mode={active ? "prominent" : "standard"}
              cornerRadius={14}
              className="rounded-xl"
            >
              <div
                className={`group relative rounded-xl border px-3 py-2.5 transition-all ${
                  active
                    ? "border-primary/50 bg-gradient-to-br from-primary/15 to-white/75 shadow-[0_18px_32px_-24px_rgba(37,99,235,0.65)] dark:to-slate-900/58"
                    : "border-white/55 bg-white/70 hover:border-primary/35 hover:bg-white/80 dark:border-white/12 dark:bg-slate-900/55 dark:hover:bg-slate-900/65"
                }`}
              >
                <button
                  type="button"
                  className="w-full pr-8 text-left"
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <p className="line-clamp-1 text-sm font-semibold leading-5 text-foreground">
                    {getConversationTitle(conversation)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    {formatConversationTime(
                      conversation.lastMessageAt || conversation.updatedAt,
                    )}
                  </p>
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-2 h-6 w-6 p-0 text-muted-foreground transition-opacity hover:text-destructive ${
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </LiquidGlass>
          );
        })}
      </div>
    </aside>
  );
}
