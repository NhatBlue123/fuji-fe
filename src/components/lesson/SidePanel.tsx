"use client";

import { useState, useCallback } from "react";
import { FileText, HelpCircle, MessageSquare, PenTool, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./ChatPanel";
import { NotesPanel } from "./NotesPanel";
import { WhiteboardPanel } from "./WhiteboardPanel";
import { QuizPanel } from "./QuizPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import type { ChatMessage, TypingStatus } from "@/hooks/useStompChat";
import type { LessonTranscriptItem } from "@/hooks/useLessonTranscript";
import type { VoiceTranscriptLanguage, VoiceTranscriptStatus } from "@/hooks/useVoiceTranscript";


type TabId = "chat" | "whiteboard" | "quiz" | "transcript" | "notes";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

const TABS: Tab[] = [
  { id: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" />, available: true },
  { id: "whiteboard", label: "Whiteboard", icon: <PenTool className="h-3.5 w-3.5" />, available: true },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-3.5 w-3.5" />, available: true },
  { id: "transcript", label: "Transcript", icon: <FileText className="h-3.5 w-3.5" />, available: true },
  { id: "notes", label: "Notes", icon: <StickyNote className="h-3.5 w-3.5" />, available: true },
];

interface SidePanelProps {
  lessonId: number;
  currentUserId: number;
  token: string | null;
  isTeacher: boolean;
  currentUserName: string;
  currentUserRole: "TEACHER" | "STUDENT";
  messages: ChatMessage[];
  typingUsers: TypingStatus[];
  transcripts: LessonTranscriptItem[];
  transcriptsLoading?: boolean;
  transcriptsError?: string | null;
  voiceTranscriptStatus?: VoiceTranscriptStatus;
  voiceTranscriptError?: string | null;
  voiceTranscriptPartialText?: string;
  voiceTranscriptLanguage: VoiceTranscriptLanguage;
  onVoiceTranscriptLanguageChange: (language: VoiceTranscriptLanguage) => void;
  transcriptEnabled: boolean;
  onSendMessage: (content: string, type?: string, fileUrl?: string) => void;
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
  currentUserName,
  currentUserRole,
  messages,
  typingUsers,
  transcripts,
  transcriptsLoading,
  transcriptsError,
  voiceTranscriptStatus,
  voiceTranscriptError,
  voiceTranscriptPartialText,
  voiceTranscriptLanguage,
  onVoiceTranscriptLanguageChange,
  transcriptEnabled,
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
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-xl dark:border-white/[0.08] dark:bg-[#1e2130]">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-3 py-2.5 dark:border-white/[0.08]">
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
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-[#8B8FA8] dark:hover:bg-white/[0.04] dark:hover:text-[#F0F0F0]"
                  : "cursor-not-allowed text-muted-foreground/40 dark:text-[#8B8FA8]/30"
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
        <div style={{ display: activeTab === "chat" ? "flex" : "none" }} className="h-full flex-col">
          <ChatPanel
            messages={messages}
            typingUsers={typingUsers}
            currentUserId={currentUserId}
            onSendMessage={onSendMessage}
            onSendTyping={onSendTyping}
            onReaction={onReaction}
            onMarkSeen={onMarkSeen}
          />
        </div>

        <div style={{ display: activeTab === "notes" ? "flex" : "none" }} className="h-full flex-col">
          <NotesPanel lessonId={lessonId} />
        </div>

        <div style={{ display: activeTab === "whiteboard" ? "flex" : "none" }} className="h-full flex-col">
          <WhiteboardPanel
            lessonId={lessonId}
            token={token}
            currentUserId={currentUserId}
          />
        </div>

        <div style={{ display: activeTab === "quiz" ? "flex" : "none" }} className="h-full flex-col">
          <QuizPanel
            lessonId={lessonId}
            token={token}
            isTeacher={isTeacher}
          />
        </div>

        <div style={{ display: activeTab === "transcript" ? "flex" : "none" }} className="h-full flex-col">
          <TranscriptPanel
            transcripts={transcripts}
            isLoading={transcriptsLoading}
            error={transcriptsError}
            voiceStatus={voiceTranscriptStatus}
            voiceError={voiceTranscriptError}
            partialText={voiceTranscriptPartialText}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            enabled={transcriptEnabled}
            voiceLanguage={voiceTranscriptLanguage}
            onVoiceLanguageChange={onVoiceTranscriptLanguageChange}
          />
        </div>
      </div>
    </div>
  );
}
