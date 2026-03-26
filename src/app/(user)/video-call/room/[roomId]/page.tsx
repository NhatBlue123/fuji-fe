"use client";
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSignaling } from "@/hooks/useSignaling";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useReconnect } from "@/hooks/useReconnect";
import {
  Mic, MicOff, Video, VideoOff, WifiOff, RefreshCw,
  AlertTriangle, PhoneOff, Send, SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchData {
  roomId: string;
  peerId: string;
  peerName: string;
  peerAvatarUrl: string;
  peerLevel: string;
  myLevel?: string;   // stored by matching page
  myName?: string;    // stored by matching page
  isInitiator: boolean;
}

interface ChatMsg {
  id: string;
  senderName: string;
  message: string;
  isMine: boolean;
  timestamp: number;
}

export default function VideoCallRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;

  const signaling = useSignaling();
  const webrtc = useWebRTC();
  const reconnect = useReconnect(signaling, webrtc);

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const matchDataRef = useRef<MatchData | null>(null);
  const cameraStartedRef = useRef(false);

  // ── Effect 1: Load match data ──────────────────────────────────────────────
  useEffect(() => {
    if (matchDataRef.current) return;
    const raw = sessionStorage.getItem("matchData");
    if (!raw) { router.push("/video-call"); return; }
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
      }
    );

    signaling.on<{ senderName: string; message: string; timestamp: number }>(
      "receive-message",
      (payload) => {
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(36).slice(2), ...payload, isMine: false },
        ]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    );

    signaling.on("peer-reconnected", async () => {
      console.log("[Signaling] Peer reconnected, re-initiating offer...");
      const offer = await webrtc.createOffer();
      signaling.sendOffer(roomId, JSON.stringify(offer));
    });

    signaling.on("peer-left", () => handleLeave());
    signaling.on("room-expired", () => handleLeave());

    return () => {
      ["offer", "answer", "ice-candidate", "receive-message",
       "peer-reconnected", "peer-left", "room-expired"].forEach(signaling.off);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

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
          reconnect.handleConnectionStateChange(state, roomId, matchDataRef.current?.myName ?? "user");
        });

        webrtc.onIceCandidate((candidate) => {
          signaling.sendIceCandidate(roomId, candidate);
        });

        const data = matchDataRef.current;
        console.log("[WebRTC] isInitiator =", data?.isInitiator, "| socket connected =", signaling.socket?.connected);

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
    const level = matchDataRef.current?.myLevel ?? matchDataRef.current?.peerLevel ?? "N3";
    sessionStorage.setItem("autoSearch", level);
    router.push("/video-call");
  }, [signaling, webrtc, reconnect, roomId, router]);

  const myName = matchData?.myName ?? "Tôi";

  const handleSendMsg = useCallback(() => {
    if (!chatMsg.trim()) return;
    signaling.sendChatMessage(roomId, "me", myName, chatMsg.trim());
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        senderName: myName,
        message: chatMsg.trim(),
        isMine: true,
        timestamp: Date.now(),
      },
    ]);
    setChatMsg("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [chatMsg, signaling, roomId, myName]);

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
                    Đang kết nối lại...
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {reconnect.countdown}s còn lại
                  </p>
                </>
              ) : (
                <>
                  <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mb-3" />
                  <p className="text-slate-300 text-sm">
                    Đang chờ kết nối P2P...
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
                  : "bg-rose-600/90 hover:bg-rose-700 text-white"
              )}
            >
              {webrtc.isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button
              onClick={webrtc.toggleCamera}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/15",
                webrtc.isCameraOn
                  ? "bg-slate-900/40 hover:bg-slate-900/70 text-slate-50"
                  : "bg-rose-600/90 hover:bg-rose-700 text-white"
              )}
            >
              {webrtc.isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
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
                Nhắn tin
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {matchData.peerName} • JLPT {matchData.peerLevel}
              </p>
            </div>
            {isConnected && (
              <span className="text-[10px] bg-emerald-400/90 text-emerald-950 font-semibold px-2 py-0.5 rounded-full tracking-wide">
                Đã kết nối
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-gradient-to-b from-slate-950/40 to-slate-900/40">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-xs text-center leading-relaxed">
                  Gửi vài câu chào bằng tiếng Nhật
                  <br />
                  để bắt đầu cuộc trò chuyện.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-0.5",
                  msg.isMine ? "items-end" : "items-start"
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
                      : "bg-slate-800/90 text-slate-50 rounded-bl-sm"
                  )}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-white/10 flex gap-2 bg-slate-950/80">
            <Input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
              placeholder="Nhắn tin..."
              className="bg-slate-900/70 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:ring-sky-500"
            />
            <Button
              onClick={handleSendMsg}
              size="icon"
              className="shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950"
            >
              <Send className="h-4 w-4" />
            </Button>
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
          className="h-12 px-8 rounded-full bg-rose-600 hover:bg-rose-500 text-slate-50 font-semibold tracking-wide gap-2 shadow-[0_18px_40px_rgba(248,113,113,0.6)]"
        >
          <PhoneOff className="h-4 w-4" />
          Kết thúc
        </Button>

        {/* Next — subtle outline */}
        <Button
          onClick={handleNext}
          variant="outline"
          className="h-11 px-6 rounded-full border-slate-600 text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 font-medium gap-2 shadow-md"
        >
          <SkipForward className="h-4 w-4" />
          Tiếp theo
        </Button>

        {/* Report */}
        <Button
          variant="outline"
          className="h-11 px-4 rounded-full border-amber-500/60 text-amber-300 bg-slate-900/60 hover:bg-slate-800/80 font-medium gap-2 shadow-md"
          onClick={() => toast.success("Báo cáo đã được ghi nhận.")}
        >
          <AlertTriangle className="h-4 w-4" />
          Báo cáo
        </Button>
      </div>
    </div>
  );
}
