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
    <div className="flex flex-col bg-[#1e3a5f]" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Main content: Video (60%) + Chat (40%) ── */}
      <div className="flex flex-1 gap-3 p-4 min-h-0 overflow-hidden">

        {/* ── Left: Remote video with local PiP overlay ── */}
        <div className="relative flex-[6] rounded-2xl overflow-hidden bg-black shadow-2xl">

          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Waiting / Reconnecting overlay */}
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95">
              {reconnect.reconnectState === "reconnecting" ? (
                <>
                  <WifiOff className="h-12 w-12 text-amber-400 mb-3" />
                  <p className="text-white font-semibold">Đang kết nối lại...</p>
                  <p className="text-zinc-400 text-sm">{reconnect.countdown}s còn lại</p>
                </>
              ) : (
                <>
                  <RefreshCw className="h-10 w-10 text-zinc-500 animate-spin mb-3" />
                  <p className="text-zinc-400">Đang chờ kết nối P2P...</p>
                </>
              )}
            </div>
          )}

          {/* Peer name + level (top-left) */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className="bg-[#1e3a5f] text-white font-bold border-0 text-xs">
              {matchData.peerLevel}
            </Badge>
            <span className="text-white text-sm font-semibold drop-shadow bg-black/30 px-2 py-0.5 rounded-lg">
              {matchData.peerName}
            </span>
          </div>

          {/* Mic / Camera quick-toggle (top-right) */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={webrtc.toggleMic}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg",
                webrtc.isMicOn
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              )}
            >
              {webrtc.isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button
              onClick={webrtc.toggleCamera}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg",
                webrtc.isCameraOn
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              )}
            >
              {webrtc.isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>
          </div>

          {/* My name label (bottom-right of PiP) */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-start">
            <div className="w-32 aspect-video rounded-xl overflow-hidden border-2 border-white/40 shadow-xl bg-zinc-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!webrtc.isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 rounded-xl">
                  <VideoOff className="h-5 w-5 text-zinc-500" />
                </div>
              )}
            </div>
            <span className="text-white text-xs font-semibold bg-black/40 px-2 py-0.5 rounded-lg">
              {myName}
            </span>
          </div>
        </div>

        {/* ── Right: Chat Panel ── */}
        <div className="flex-[4] flex flex-col rounded-2xl overflow-hidden bg-white shadow-2xl min-h-0">

          {/* Chat header */}
          <div className="px-5 py-3 bg-[#2563eb] shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-base">Nhắn tin</h2>
              <p className="text-blue-100 text-xs">{matchData.peerName} • {matchData.peerLevel}</p>
            </div>
            {isConnected && (
              <span className="text-xs bg-green-400 text-green-900 font-bold px-2 py-0.5 rounded-full">
                Đã kết nối
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <p className="text-zinc-400 text-sm text-center">
                  Gửi tin nhắn để bắt đầu hội thoại 💬
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex flex-col gap-0.5", msg.isMine ? "items-end" : "items-start")}
              >
                <span className="text-zinc-400 text-[10px] px-1">{msg.senderName}</span>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm",
                  msg.isMine
                    ? "bg-[#2563eb] text-white rounded-br-sm"
                    : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
                )}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-zinc-100 flex gap-2">
            <Input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
              placeholder="Nhắn tin..."
              className="bg-zinc-50 border-zinc-200 text-sm focus-visible:ring-[#2563eb]"
            />
            <Button
              onClick={handleSendMsg}
              size="icon"
              className="shrink-0 bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Bottom Control Bar ── */}
      <div className="shrink-0 flex items-center justify-center gap-3 py-4 px-4">

        {/* Next — find new partner at same level */}
        <Button
          onClick={handleNext}
          className="h-11 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg gap-2 shadow-lg"
        >
          <SkipForward className="h-4 w-4" />
          Tiếp theo
        </Button>

        {/* End Call — hang up permanently */}
        <Button
          onClick={handleLeave}
          className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg gap-2 shadow-lg"
        >
          <PhoneOff className="h-4 w-4" />
          Kết thúc
        </Button>

        {/* Report */}
        <Button
          variant="outline"
          className="h-11 px-4 font-bold rounded-lg gap-2 shadow-sm border-zinc-600 text-zinc-200 hover:bg-zinc-700"
          onClick={() => alert("Báo cáo đã được ghi nhận.")}
        >
          <AlertTriangle className="h-4 w-4" />
          Báo cáo
        </Button>

        {/* Timer */}
        <div className="h-11 px-6 bg-zinc-800 text-white font-mono font-bold text-base rounded-lg flex items-center shadow-lg min-w-[80px] justify-center">
          {formatTimer(sessionSeconds)}
        </div>
      </div>
    </div>
  );
}
