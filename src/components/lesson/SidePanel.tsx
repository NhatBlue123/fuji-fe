"use client";

import { useState, useCallback } from "react";
import { MessageSquare, PenTool, FileText, HelpCircle, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./ChatPanel";
import { NotesPanel } from "./NotesPanel";
import { WhiteboardPanel } from "./WhiteboardPanel";
import { MaterialsPanel } from "./MaterialsPanel";
import { QuizPanel } from "./QuizPanel";
import type { ChatMessage, TypingStatus } from "@/hooks/useStompChat";

type TabId = "chat" | "whiteboard" | "materials" | "quiz" | "notes";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

const TABS: Tab[] = [
  { id: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" />, available: true },
  { id: "whiteboard", label: "Whiteboard", icon: <PenTool className="h-3.5 w-3.5" />, available: true },
  { id: "materials", label: "Materials", icon: <FileText className="h-3.5 w-3.5" />, available: true },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-3.5 w-3.5" />, available: true },
  { id: "notes", label: "Notes", icon: <StickyNote className="h-3.5 w-3.5" />, available: true },
];

interface SidePanelProps {
  lessonId: number;
  currentUserId: number;
  token: string | null;
  isTeacher: boolean;
  messages: ChatMessage[];
  typingUsers: TypingStatus[];
  onSendMessage: (content: string, type?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onReaction: (messageId: number, emoji: string) => void;
  onMarkSeen: () => void;
  unreadCount?: number;
}

export function SidePanel({
  lessonId,
  currentUserId,
  token,
  isTeacher,
  messages,
  typingUsers,
  onSendMessage,
  onSendTyping,
  onReaction,
  onMarkSeen,
  unreadCount = 0,
}: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  const handleTabChange = useCallback((tabId: TabId) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (tab?.available) {
      setActiveTab(tabId);
    }
  }, []);

  return (
    <div className="w-full h-full rounded-[24px] overflow-hidden border border-white/[0.08] bg-[#1e2130] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-3 py-2.5 border-b border-white/[0.08] shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={!tab.available}
            className={cn(
              "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-[#6C63FF]/20 text-[#6C63FF]"
                : tab.available
                  ? "text-[#8B8FA8] hover:text-[#F0F0F0] hover:bg-white/[0.04]"
                  : "text-[#8B8FA8]/30 cursor-not-allowed"
            )}
          >
            {tab.icon}
            <span className="hidden xl:inline">{tab.label}</span>

            {/* Unread badge for chat */}
            {tab.id === "chat" && activeTab !== "chat" && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF6B6B] text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "chat" && (
          <ChatPanel
            messages={messages}
            typingUsers={typingUsers}
            currentUserId={currentUserId}
            onSendMessage={onSendMessage}
            onSendTyping={onSendTyping}
            onReaction={onReaction}
            onMarkSeen={onMarkSeen}
          />
        )}

        {activeTab === "notes" && (
          <NotesPanel lessonId={lessonId} />
        )}

        {activeTab === "whiteboard" && (
          <WhiteboardPanel
            lessonId={lessonId}
            token={token}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === "materials" && (
          <MaterialsPanel
            lessonId={lessonId}
            token={token}
            isTeacher={isTeacher}
          />
        )}

        {activeTab === "quiz" && (
          <QuizPanel
            lessonId={lessonId}
            token={token}
            isTeacher={isTeacher}
          />
        )}
      </div>
    </div>
  );
}
