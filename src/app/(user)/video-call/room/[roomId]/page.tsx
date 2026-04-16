"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSignaling } from "@/hooks/useSignaling";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useReconnect } from "@/hooks/useReconnect";
import { useJapaneseSuggest } from "@/hooks/useJapaneseSuggest";
import { useAuth } from "@/store/hooks";
import { API_CONFIG } from "@/config/api";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  PhoneOff,
  Send,
  SkipForward,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MatchData {
  roomId: string;
  peerId: string;
  peerName: string;
  peerAvatarUrl: string;
  peerLevel: string;
  myLevel?: string; // stored by matching page
  myName?: string; // stored by matching page
  myUserId?: string; // stored by matching page (needed for moderation)
  isInitiator: boolean;
}

interface ChatMsg {
  id: string;
  senderName: string;
  message: string;
  isMine: boolean;
  timestamp: number;
  status?: "SENDING" | "SENT" | "DELIVERED" | "READ";
  isViolation?: boolean;
}

export default function VideoCallRoomPage() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;

  const signaling = useSignaling();
  const webrtc = useWebRTC();
  const reconnect = useReconnect(signaling, webrtc);
  const { user: authUser, accessToken } = useAuth();

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const matchDataRef = useRef<MatchData | null>(null);
  const cameraStartedRef = useRef(false);
  const unreadIncomingIdsRef = useRef<Set<string>>(new Set());
  const suggestDropdownRef = useRef<HTMLDivElement>(null);

  // ── Japanese suggestion hook (romaji → hiragana/kanji, Ctrl+Space, history) ──
  const jpSuggest = useJapaneseSuggest();
  const {
    suggestions,
    isOpen: isSuggestOpen,
    isLoading: isSuggestLoading,
    selectedIndex,
    triggerSuggest,
    closeSuggestions,
    selectSuggestion,
    handleKeyDown: handleSuggestKeyDown,
    convertSentence,
  } = jpSuggest;
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  const [violationBanner, setViolationBanner] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const violationBannerTimerRef = useRef<number | null>(null);

  const shouldSendRead = useCallback(() => {
    if (typeof document === "undefined") return false;
    return (
      document.visibilityState === "visible" &&
      typeof document.hasFocus === "function" &&
      document.hasFocus()
    );
  }, []);

  // Keep this above effects that depend on it.
  const isNearChatBottom = useCallback(() => {
    const el = chatListRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < 80;
  }, []);

  // If user types a romaji phrase (e.g. "nani wo"), offer one-click full conversion.
  const fullSentenceSuggestion = useMemo(() => {
    const trimmed = chatMsg.trim();
    if (!trimmed || !/\s+/.test(trimmed)) return null;
    const converted = convertSentence(trimmed);
    if (!converted || converted === trimmed) return null;
    return converted;
  }, [chatMsg, convertSentence]);

  // ── Effect 1: Load match data ──────────────────────────────────────────────
  useEffect(() => {
    if (matchDataRef.current) return;
    const raw = sessionStorage.getItem("matchData");
    if (!raw) {
      router.push("/video-call");
      return;
    }
    const parsed: MatchData = JSON.parse(raw);
    sessionStorage.removeItem("matchData"); // prevent stale data
    matchDataRef.current = parsed;
    setMatchData(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: Signaling listeners ─────────────────────────────────────────
  useEffect(() => {
    signaling.on<{ sdp: string }>("offer", async (payload) => {
      console.log("[WebRTC] Received offer, creating answer...");
      try {
        const sdp = JSON.parse(payload.sdp);
        const answer = await webrtc.createAnswer(sdp);
        signaling.sendAnswer(roomId, JSON.stringify(answer));
        console.log("[WebRTC] Answer sent.");
      } catch (e) {
        console.error("[WebRTC] createAnswer failed:", e);
      }
    });

    signaling.on<{ sdp: string }>("answer", async (payload) => {
      console.log("[WebRTC] Received answer, setting remote...");
      try {
        await webrtc.setRemoteAnswer(JSON.parse(payload.sdp));
      } catch (e) {
        console.error("[WebRTC] setRemoteAnswer failed:", e);
      }
    });

    signaling.on<{ candidate: string; sdpMid: string; sdpMLineIndex: number }>(
      "ice-candidate",
      async (payload) => {
        await webrtc.addIceCandidate(payload);
      },
    );

    signaling.on<{
      roomId: string;
      senderId: string;
      senderName: string;
      message: string;
      timestamp: number;
      messageId: string;
      isViolation?: boolean;
    }>("receive-message", (payload) => {
      const shouldStickBottom = isNearChatBottom();
      const incomingId = payload.messageId;
      setMessages((prev) => [
        ...prev,
        {
          id: incomingId,
          senderName: payload.senderName,
          message: payload.message,
          isMine: false,
          timestamp: payload.timestamp,
          status: "SENT",
          isViolation: payload.isViolation,
        },
      ]);
      unreadIncomingIdsRef.current.add(incomingId);

      // Inform sender that we have received the message
      signaling.sendMessageDelivered(roomId, [incomingId]);

      // If we are actively viewing the room, mark as read immediately
      if (shouldSendRead()) {
        const ids = Array.from(unreadIncomingIdsRef.current);
        unreadIncomingIdsRef.current.clear();
        if (ids.length > 0) signaling.sendMessageRead(roomId, ids);
      }
      if (shouldStickBottom) {
        setTimeout(
          () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      }
    });

    signaling.on<{
      messageId: string;
      timestamp: number;
      isViolation?: boolean;
    }>("message-sent", (payload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.isMine && m.id === payload.messageId
            ? {
                ...m,
                status:
                  m.status === "DELIVERED" || m.status === "READ"
                    ? m.status
                    : "SENT",
                timestamp: payload.timestamp,
                isViolation: payload.isViolation ?? m.isViolation,
              }
            : m,
        ),
      );
    });

    signaling.on<{ roomId: string; messageIds: string[] }>(
      "message_delivered",
      (payload) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.isMine && payload.messageIds.includes(m.id)
              ? m.status === "READ"
                ? m
                : { ...m, status: "DELIVERED" }
              : m,
          ),
        );
      },
    );

    signaling.on<{ roomId: string; messageIds: string[] }>(
      "message_read",
      (payload) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.isMine && payload.messageIds.includes(m.id)
              ? { ...m, status: "READ" }
              : m,
          ),
        );
      },
    );

    signaling.on("peer-reconnected", async () => {
      console.log("[Signaling] Peer reconnected, re-initiating offer...");
      const offer = await webrtc.createOffer();
      signaling.sendOffer(roomId, JSON.stringify(offer));
    });

    signaling.on("peer-left", () => handleLeave());
    signaling.on("room-expired", () => handleLeave());

    return () => {
      [
        "offer",
        "answer",
        "ice-candidate",
        "receive-message",
        "peer-reconnected",
        "peer-left",
        "room-expired",
        "message-sent",
        "message_delivered",
        "message_read",
      ].forEach(signaling.off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isNearChatBottom]);

  // ── Effect: when page regains focus/visibility, mark incoming messages as read ──
  useEffect(() => {
    if (!signaling.socket) return;
    const tryFlushRead = () => {
      if (!shouldSendRead()) return;
      const ids = Array.from(unreadIncomingIdsRef.current);
      if (ids.length === 0) return;
      unreadIncomingIdsRef.current.clear();
      signaling.sendMessageRead(roomId, ids);
    };

    window.addEventListener("focus", tryFlushRead);
    document.addEventListener("visibilitychange", tryFlushRead);
    return () => {
      window.removeEventListener("focus", tryFlushRead);
      document.removeEventListener("visibilitychange", tryFlushRead);
    };
  }, [roomId, shouldSendRead, signaling]);

  // ── Effect 3: Start camera + send offer ───────────────────────────────────
  useEffect(() => {
    if (cameraStartedRef.current) return;
    cameraStartedRef.current = true;

    (async () => {
      try {
        await webrtc.startLocalStream();
        console.log("[WebRTC] Local stream started.");

        webrtc.onConnectionStateChange((state) => {
          console.log("[WebRTC] Connection state:", state);
          setIsConnected(state === "connected");
          reconnect.handleConnectionStateChange(
            state,
            roomId,
            matchDataRef.current?.myName ?? "user",
          );
        });

        webrtc.onIceCandidate((candidate) => {
          signaling.sendIceCandidate(roomId, candidate);
        });

        const data = matchDataRef.current;
        console.log(
          "[WebRTC] isInitiator =",
          data?.isInitiator,
          "| socket connected =",
          signaling.socket?.connected,
        );

        if (data?.isInitiator) {
          console.log("[WebRTC] I am initiator — creating offer...");
          const offer = await webrtc.createOffer();
          signaling.sendOffer(roomId, JSON.stringify(offer));
          console.log("[WebRTC] Offer sent ✓");
        } else {
          console.log("[WebRTC] I am receiver — waiting for offer...");
        }
      } catch (err) {
        console.error("[WebRTC] Fatal error in room setup:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stream attachment ──────────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && webrtc.localStream)
      localVideoRef.current.srcObject = webrtc.localStream;
  }, [webrtc.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && webrtc.remoteStream)
      remoteVideoRef.current.srcObject = webrtc.remoteStream;
  }, [webrtc.remoteStream]);

  // ── Actions ───────────────────────────────────────────────────────────────
  /** End call: clean up and go back to matching page */
  const handleLeave = useCallback(() => {
    signaling.leaveRoom(roomId);
    webrtc.cleanup();
    reconnect.reset();
    router.push("/video-call");
  }, [signaling, webrtc, reconnect, roomId, router]);

  /** Next: clean up current call, then auto-search at same level */
  const handleNext = useCallback(() => {
    signaling.leaveRoom(roomId);
    webrtc.cleanup();
    reconnect.reset();
    // Pass level via sessionStorage so matching page auto-searches
    const level =
      matchDataRef.current?.myLevel ?? matchDataRef.current?.peerLevel ?? "N3";
    sessionStorage.setItem("autoSearch", level);
    router.push("/video-call");
  }, [signaling, webrtc, reconnect, roomId, router]);

  const myName = matchData?.myName ?? t("common.me");
  const myUserId = String(
    authUser?.id ?? authUser?._id ?? matchData?.myUserId ?? "guest",
  );

  const detectViolationType = useCallback((content: string) => {
    const msg = content.trim();
    if (!msg) return null;

    // If message contains any Japanese script, allow it.
    // Example: "Quang Nam です" should be accepted.
    const hasJapanese = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(msg);
    if (hasJapanese) return null;

    // Vietnamese: detect diacritics + common Vietnamese words
    const vietDiacritics =
      /[àáảãạăắằẳẵặâầấậẩãđèéẻẽẹêềếểễệìíỉĩịòóỏõọơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
    const vietCommonWords =
      /\b(và|nhưng|là|không|tôi|bạn|các|một|những|sao|như|bởi)\b/i;

    if (vietDiacritics.test(msg) || vietCommonWords.test(msg)) {
      return "VIETNAMESE" as const;
    }

    // English: a word of Latin letters without accents length > 3
    const englishPlainWord = /\b[a-zA-Z]{4,}\b/;
    if (englishPlainWord.test(msg)) {
      return "ENGLISH" as const;
    }

    return null;
  }, []);

  const fetchBanStatus = useCallback(
    async (userId: string) => {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/chat/ban-status/${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
          credentials: "include",
        },
      );
      const json = await res.json().catch(() => ({}));
      // Backend wraps in ApiResponse: { success, message, data }
      return {
        success: Boolean(json?.success),
        banned: Boolean(json?.data?.banned),
        type: json?.data?.type ?? null,
        until: json?.data?.until ?? null,
        violationCount: json?.data?.violationCount ?? 0,
        code: json?.code,
        message: json?.message,
      };
    },
    [accessToken],
  );

  const postViolation = useCallback(
    async (payload: {
      userId: string;
      sessionId: string;
      violationType: "VIETNAMESE" | "ENGLISH" | "OTHER";
      messageContent: string;
    }) => {
      const res = await fetch(`${API_CONFIG.BASE_URL}/chat/violation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      return {
        success: Boolean(json?.success),
        code: json?.code ?? null,
        message: json?.message ?? null,
        data: json?.data ?? null,
      };
    },
    [accessToken],
  );

  const handleSubmitReport = useCallback(async () => {
    const trimmed = reportContent.trim();
    if (!trimmed) {
      toast.error(t("videoCall.room.toast.reportInputRequired"));
      return;
    }
    if (!matchData) return;

    setIsSubmittingReport(true);
    try {
      const reporterIdRaw =
        authUser?.id ?? authUser?._id ?? matchData?.myUserId;
      const reporterId =
        typeof reporterIdRaw === "number"
          ? reporterIdRaw
          : Number.parseInt(String(reporterIdRaw ?? ""), 10);

      const description = [
        `Nội dung báo cáo: ${trimmed}`,
        "",
        "Thong tin nguoi bi bao cao:",
        `- Ten: ${matchData.peerName}`,
        `- User ID: ${matchData.peerId}`,
        `- Trinh do: ${matchData.peerLevel}`,
      ].join("\n");

      const payload = {
        category: "OTHER",
        title: `Bao cao user video call: ${matchData.peerName}`,
        description,
        priority: "MEDIUM",
        subjectType: "VIDEO_CALL_USER",
        subjectId: String(matchData.peerId),
        createdByUserId: Number.isFinite(reporterId) ? reporterId : undefined,
      };

      const res = await fetch(`${API_CONFIG.BASE_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(
          json?.message || t("videoCall.room.toast.reportFailed"),
        );
      }

      toast.success(t("videoCall.room.toast.reportSuccess"));
      setIsReportModalOpen(false);
      setReportContent("");
    } catch (error) {
      console.error(error);
      toast.error(t("videoCall.room.toast.reportError"));
    } finally {
      setIsSubmittingReport(false);
    }
  }, [reportContent, matchData, authUser?.id, authUser?._id, accessToken]);

  const formatChatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const pad = (n: number) => String(n).padStart(2, "0");
    const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (isToday) return hhmm;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hhmm}`;
  };

  const replaceLastTokenWithSuggestion = useCallback(
    (input: string, selected: string) => {
      const trimmedRight = input.replace(/\s+$/g, "");
      if (!trimmedRight) return `${selected} `;
      const parts = trimmedRight.split(/\s+/);
      parts[parts.length - 1] = selected;
      return `${parts.join(" ")} `;
    },
    [],
  );

  // ── Trigger suggestions on input change ────────────────────────────────
  useEffect(() => {
    if (!isChatInputFocused || !chatMsg.trim()) {
      closeSuggestions();
      return;
    }
    const token = chatMsg.trim().split(/\s+/).pop() ?? "";
    triggerSuggest(token);
  }, [chatMsg, isChatInputFocused, triggerSuggest, closeSuggestions]);

  // ── Handle click outside to close suggestions ─────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestDropdownRef.current &&
        !suggestDropdownRef.current.contains(e.target as Node)
      ) {
        closeSuggestions();
      }
    };
    if (isSuggestOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSuggestOpen, closeSuggestions]);

  const handleSendMsg = useCallback(async () => {
    const content = chatMsg.trim();
    if (!content) return;

    const messageId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now();

    const sessionId = signaling.socket?.id ?? "";

    // 1) Ban check first
    const ban = await fetchBanStatus(myUserId);
    if (ban?.banned) {
      const untilText = ban.until
        ? t("videoCall.room.ban.until", {
            date: new Date(ban.until).toLocaleString(
              i18n.language === "vi" ? "vi-VN" : i18n.language,
            ),
          })
        : "";
      toast.error(`${t("videoCall.room.ban.active")}${untilText}`, {
        duration: 4000,
      });
      return;
    }

    // 2) Auto-detect violation (VN/EN) and report
    const violationType = detectViolationType(content);
    const isViolation = Boolean(violationType);

    if (violationType) {
      toast.warning(t("videoCall.room.violation.japaneseOnly"), {
        duration: 4000,
      });
      setViolationBanner(t("videoCall.room.violation.japaneseOnly"));
      if (violationBannerTimerRef.current) {
        window.clearTimeout(violationBannerTimerRef.current);
      }
      violationBannerTimerRef.current = window.setTimeout(() => {
        setViolationBanner(null);
      }, 4000);

      const report = await postViolation({
        userId: myUserId,
        sessionId,
        violationType: violationType,
        messageContent: content,
      });

      if (!report?.success && report?.code === "BAN_ACTIVE") {
        // Backend may ban immediately when threshold is reached
        const untilText = report?.data?.until
          ? t("videoCall.room.ban.until", {
              date: new Date(report?.data?.until).toLocaleString(
                i18n.language === "vi" ? "vi-VN" : i18n.language,
              ),
            })
          : "";
        toast.error(`${t("videoCall.room.ban.active")}${untilText}`, {
          duration: 4000,
        });
        return;
      }
      // For VIOLATION_WARNING (1-3 times), still allow sending to keep chat flow.
    }

    // 3) Send message via socket
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        senderName: myName,
        message: content,
        isMine: true,
        timestamp: Date.now(),
        status: "SENDING",
        isViolation,
      },
    ]);
    signaling.sendChatMessage(
      roomId,
      myUserId,
      myName,
      content,
      messageId,
      isViolation,
    );
    setChatMsg("");
    // Do not force auto-scroll when sending own message.
    // Keep user's current reading position stable.
  }, [
    chatMsg,
    signaling,
    roomId,
    myUserId,
    myName,
    detectViolationType,
    fetchBanStatus,
    postViolation,
  ]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    if (!isConnected) return;
    const t = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isConnected]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (!matchData) return null;

  return (
    <div
      className="flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Main content: Video focus + side chat ── */}
      <div className="flex flex-1 gap-4 px-6 py-5 min-h-0 overflow-hidden">
        {/* ── Left: Remote focus with soft frame & PiP ── */}
        <div className="relative flex-[7] rounded-[28px] overflow-hidden bg-slate-900/80 border border-white/10 shadow-[0_24px_60px_rgba(15,23,42,0.9)]">
          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Waiting / Reconnecting overlay */}
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
              {reconnect.reconnectState === "reconnecting" ? (
                <>
                  <WifiOff className="h-10 w-10 text-amber-300 mb-3" />
                  <p className="text-slate-50 font-semibold tracking-wide">
                    {t("videoCall.room.reconnecting")}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {t("videoCall.room.secondsLeft", {
                      val: reconnect.countdown,
                    })}
                  </p>
                </>
              ) : (
                <>
                  <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mb-3" />
                  <p className="text-slate-300 text-sm">
                    {t("videoCall.room.waitingP2P")}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Peer name + level (top-left) */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge className="bg-white/10 text-slate-50 font-semibold border border-white/20 text-[11px] px-2.5 py-1 rounded-full tracking-wide">
              {matchData.peerLevel}
            </Badge>
            <span className="text-slate-50 text-sm font-medium drop-shadow bg-slate-900/60 px-3 py-1 rounded-full">
              {matchData.peerName}
            </span>
          </div>

          {/* Mic / Camera quick-toggle (top-right) */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={webrtc.toggleMic}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/15",
                webrtc.isMicOn
                  ? "bg-slate-900/40 hover:bg-slate-900/70 text-slate-50"
                  : "bg-secondary hover:bg-secondary/90 text-white",
              )}
            >
              {webrtc.isMicOn ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={webrtc.toggleCamera}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/15",
                webrtc.isCameraOn
                  ? "bg-slate-900/40 hover:bg-slate-900/70 text-slate-50"
                  : "bg-secondary hover:bg-secondary/90 text-white",
              )}
            >
              {webrtc.isCameraOn ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Local PiP + my name (bottom-left) */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 items-start">
            <div className="relative w-36 aspect-video rounded-2xl overflow-hidden border border-white/35 shadow-[0_14px_40px_rgba(15,23,42,0.9)] bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!webrtc.isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-2xl">
                  <VideoOff className="h-5 w-5 text-slate-500" />
                </div>
              )}
            </div>
            <span className="text-slate-50 text-xs font-medium bg-slate-900/75 px-2.5 py-0.5 rounded-full">
              {myName}
            </span>
          </div>
        </div>

        {/* ── Right: Chat Panel ── */}
        <div className="flex-[4] flex flex-col rounded-[24px] overflow-hidden bg-slate-900/80 border border-white/10 shadow-[0_18px_50px_rgba(15,23,42,0.9)] min-h-0">
          {/* Chat header */}
          <div className="px-5 py-3 bg-slate-900/80 border-b border-white/10 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-slate-50 font-semibold text-sm tracking-[0.12em] uppercase">
                {t("videoCall.room.chatTitle")}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {matchData.peerName} • JLPT {matchData.peerLevel}
              </p>
            </div>
            {isConnected && (
              <span className="text-[10px] bg-emerald-400/90 text-emerald-950 font-semibold px-2 py-0.5 rounded-full tracking-wide">
                {t("videoCall.room.connected")}
              </span>
            )}
          </div>

          {/* Messages */}
          <div
            ref={chatListRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-gradient-to-b from-slate-950/40 to-slate-900/40"
          >
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-xs text-center leading-relaxed">
                  {t("videoCall.room.emptyChat1")}
                  <br />
                  {t("videoCall.room.emptyChat2")}
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-0.5",
                  msg.isMine ? "items-end" : "items-start",
                )}
              >
                <span className="text-slate-500 text-[10px] px-1">
                  {msg.senderName}
                </span>
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm",
                    msg.isMine
                      ? "bg-sky-500/90 text-slate-950 rounded-br-sm"
                      : "bg-slate-800/90 text-slate-50 rounded-bl-sm",
                  )}
                >
                  {msg.message}
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-2 justify-end text-[10px]",
                      msg.isMine ? "text-slate-600" : "text-slate-400",
                    )}
                  >
                    <span>{formatChatTime(msg.timestamp)}</span>
                    {msg.isMine && msg.status ? (
                      <>
                        {msg.status === "SENDING" && <span>⏳</span>}
                        {msg.status === "SENT" && <span>✓</span>}
                        {msg.status === "DELIVERED" && <span>✓✓</span>}
                        {msg.status === "READ" && (
                          <span className="text-emerald-300">✓✓</span>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-white/10 bg-slate-950/80">
            <div className="flex gap-2 items-end">
              <div className="relative flex-1">
                {violationBanner && (
                  <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200 text-xs font-medium">
                    {violationBanner}
                  </div>
                )}

                {isSuggestOpen && suggestions.length > 0 && (
                  <div
                    ref={suggestDropdownRef}
                    className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden"
                  >
                    <div className="px-3 py-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>
                        {t("videoCall.room.suggestVocab")}
                        {isSuggestLoading ? t("videoCall.room.loading") : ""}
                      </span>
                      <span className="text-[9px] flex items-center gap-1 text-slate-500">
                        <Keyboard className="w-3 h-3" /> Ctrl+Space
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {fullSentenceSuggestion && (
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 border-b border-white/10 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setChatMsg(`${fullSentenceSuggestion} `);
                            closeSuggestions();
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-sky-200">
                              {fullSentenceSuggestion}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-100">
                              {t("videoCall.room.parseSentence")}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            {t("videoCall.room.convertAllRomaji")}
                          </div>
                        </button>
                      )}
                      {suggestions.map((s, idx) => (
                        <button
                          key={`${s.word}-${s.reading ?? idx}`}
                          type="button"
                          className={cn(
                            "w-full text-left px-3 py-2 hover:bg-white/5 active:bg-white/10 transition-colors",
                            selectedIndex === idx && "bg-sky-500/20",
                          )}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const result = selectSuggestion(s);
                            setChatMsg((prev) =>
                              replaceLastTokenWithSuggestion(prev, result),
                            );
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-50">
                              {s.word}
                            </span>
                            <span className="flex items-center gap-1">
                              {s.scriptType === "HIRAGANA" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                                  Hiragana
                                </span>
                              )}
                              {s.scriptType === "KANJI" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300">
                                  Kanji
                                </span>
                              )}
                              {s.fromHistory && (
                                <span className="text-[9px] text-amber-400/70">
                                  {t("videoCall.room.fromHistory")}
                                </span>
                              )}
                            </span>
                          </div>
                          {s.reading && s.reading !== s.word && (
                            <div className="text-[11px] text-rose-300 mt-0.5">
                              {s.reading}
                            </div>
                          )}
                          {s.meaning && (
                            <div className="text-[12px] text-slate-300 mt-1 line-clamp-1">
                              {s.meaning}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  placeholder={t("videoCall.room.placeholder.message")}
                  className="min-h-[44px] max-h-[120px] resize-none bg-slate-900/70 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:ring-sky-500"
                  onFocus={() => setIsChatInputFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setIsChatInputFocused(false);
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    handleSuggestKeyDown(
                      e,
                      chatMsg.trim().split(/\s+/).pop() ?? "",
                      (text) =>
                        setChatMsg((prev) =>
                          replaceLastTokenWithSuggestion(prev, text),
                        ),
                      handleSendMsg,
                    );
                  }}
                />
              </div>
              <Button
                onClick={() => handleSendMsg()}
                size="icon"
                className="shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Control Bar ── */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-4 px-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent">
        {/* Timer */}
        <div className="h-11 px-6 bg-slate-900/90 border border-white/10 text-slate-50 font-mono text-sm rounded-full flex items-center shadow-[0_10px_30px_rgba(15,23,42,0.9)] min-w-[88px] justify-center">
          {formatTimer(sessionSeconds)}
        </div>

        {/* End Call — center, accent */}
        <Button
          onClick={handleLeave}
          className="h-12 px-8 rounded-full bg-secondary hover:bg-secondary/90 text-slate-50 font-semibold tracking-wide gap-2 shadow-[0_18px_40px_rgba(217,70,239,0.45)]"
        >
          <PhoneOff className="h-4 w-4" />
          {t("videoCall.room.endCall")}
        </Button>

        {/* Next — subtle outline */}
        <Button
          onClick={handleNext}
          variant="outline"
          className="h-11 px-6 rounded-full border-slate-600 text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 font-medium gap-2 shadow-md"
        >
          <SkipForward className="h-4 w-4" />
          {t("videoCall.room.nextPeer")}
        </Button>

        {/* Report */}
        <Button
          variant="outline"
          className="h-11 px-4 rounded-full border-amber-500/60 text-amber-300 bg-slate-900/60 hover:bg-slate-800/80 font-medium gap-2 shadow-md"
          onClick={() => setIsReportModalOpen(true)}
        >
          <AlertTriangle className="h-4 w-4" />
          {t("videoCall.room.report")}
        </Button>
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-50 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                {t("videoCall.room.reportUser")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-slate-100"
                onClick={() => setIsReportModalOpen(false)}
                disabled={isSubmittingReport}
              >
                {t("common.close")}
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-800/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {t("videoCall.room.reportedInfo")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-700">
                  {matchData.peerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={matchData.peerAvatarUrl}
                      alt={matchData.peerName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {matchData.peerName}
                  </p>
                  <p className="text-xs text-slate-400">
                    ID: {matchData.peerId} • JLPT {matchData.peerLevel}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400 mb-2">
                {t("videoCall.room.reportContent")}
              </p>
              <Textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder={t("videoCall.room.placeholder.report")}
                className="min-h-[110px] resize-none bg-slate-950/70 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:ring-amber-500"
                disabled={isSubmittingReport}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
                onClick={() => setIsReportModalOpen(false)}
                disabled={isSubmittingReport}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-400 text-slate-950"
                onClick={() => handleSubmitReport()}
                disabled={isSubmittingReport || !reportContent.trim()}
              >
                {isSubmittingReport
                  ? t("videoCall.room.sending")
                  : t("videoCall.room.report")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
