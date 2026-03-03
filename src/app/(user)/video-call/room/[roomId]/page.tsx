"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSignaling } from "@/hooks/useSignaling";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useReconnect } from "@/hooks/useReconnect";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, X, Send, WifiOff, RefreshCw } from "lucide-react";
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myUserId = "user-local"; // replace with real userId from auth

  const initRef = useRef(false);

  // ── On Mount: load match data + start camera ──────────────────────────────
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const raw = sessionStorage.getItem("matchData");
    if (!raw) { router.push("/video-call"); return; }
    const data: MatchData = JSON.parse(raw);
    setMatchData(data);
    // Remove keeping it for now in case of fast refresh during dev
    // sessionStorage.removeItem("matchData");

    (async () => {
      await webrtc.startLocalStream();

      // Subscribe to WebRTC state changes
      webrtc.onConnectionStateChange((state) => {
        setIsConnected(state === "connected");
        reconnect.handleConnectionStateChange(state, roomId, myUserId);
      });

      // Subscribe to ICE candidate → relay to peer
      webrtc.onIceCandidate((candidate) => {
        signaling.sendIceCandidate(roomId, candidate);
      });

      if (data.isInitiator) {
        const offer = await webrtc.createOffer();
        signaling.sendOffer(roomId, JSON.stringify(offer));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Attach local stream to video ──────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && webrtc.localStream) {
      localVideoRef.current.srcObject = webrtc.localStream;
    }
  }, [webrtc.localStream]);

  // ── Attach remote stream to video ─────────────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && webrtc.remoteStream) {
      remoteVideoRef.current.srcObject = webrtc.remoteStream;
    }
  }, [webrtc.remoteStream]);

  // ── Signaling event listeners ─────────────────────────────────────────────
  useEffect(() => {
    // Receive offer → send answer
    signaling.on<{ sdp: string }>("offer", async (data) => {
      console.log("[WebRTC] Received offer");
      const sdp = JSON.parse(data.sdp);
      const answer = await webrtc.createAnswer(sdp);
      signaling.sendAnswer(roomId, JSON.stringify(answer));
    });

    // Receive answer → set remote
    signaling.on<{ sdp: string }>("answer", async (data) => {
      console.log("[WebRTC] Received answer");
      await webrtc.setRemoteAnswer(JSON.parse(data.sdp));
    });

    // Receive ICE candidate
    signaling.on<{ candidate: string; sdpMid: string; sdpMLineIndex: number }>(
      "ice-candidate",
      async (data) => {
        console.log("[WebRTC] Received ice-candidate");
        await webrtc.addIceCandidate(data);
      }
    );

    // Chat message
    signaling.on<{ senderName: string; message: string; timestamp: number }>(
      "receive-message",
      (data) => {
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(36).slice(2), ...data, isMine: false },
        ]);
      }
    );

    // Peer reconnected → re-initiate offer
    signaling.on("peer-reconnected", async () => {
      console.log("[Signaling] peer-reconnected");
      const offer = await webrtc.createOffer();
      signaling.sendOffer(roomId, JSON.stringify(offer));
    });

    // Peer left or room expired
    signaling.on("peer-left", (data) => {
      console.error("[Signaling] peer-left:", data);
      handleLeave();
    });
    signaling.on("room-expired", (data) => {
      console.error("[Signaling] room-expired:", data);
      handleLeave();
    });

    return () => {
      ["offer", "answer", "ice-candidate", "receive-message",
       "peer-reconnected", "peer-left", "room-expired"].forEach(signaling.off);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    signaling.leaveRoom(roomId);
    webrtc.cleanup();
    reconnect.reset();
    router.push("/video-call");
  }, [signaling, webrtc, reconnect, roomId, router]);

  const handleSendMsg = useCallback(() => {
    if (!chatMsg.trim()) return;
    signaling.sendChatMessage(roomId, myUserId, "Me", chatMsg.trim());
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        senderName: "Me",
        message: chatMsg.trim(),
        isMine: true,
        timestamp: Date.now(),
      },
    ]);
    setChatMsg("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [chatMsg, signaling, roomId]);

  if (!matchData) return null;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen bg-zinc-950 flex flex-col">

      {/* ── Video Grid ── */}
      <div className="flex-1 relative grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">

        {/* Remote video */}
        <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
              {reconnect.reconnectState === "reconnecting" ? (
                <>
                  <WifiOff className="h-12 w-12 text-amber-400 mb-3" />
                  <p className="text-white font-semibold">Đang kết nối lại...</p>
                  <p className="text-zinc-400 text-sm">
                    {reconnect.countdown}s còn lại
                  </p>
                </>
              ) : (
                <>
                  <RefreshCw className="h-10 w-10 text-zinc-500 animate-spin mb-3" />
                  <p className="text-zinc-400">Đang chờ kết nối P2P...</p>
                </>
              )}
            </div>
          )}
          {/* Peer info overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="secondary" className="font-bold">{matchData.peerLevel}</Badge>
            <span className="text-white text-sm font-semibold drop-shadow">{matchData.peerName}</span>
          </div>
        </div>

        {/* Local video */}
        <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!webrtc.isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              <VideoOff className="h-12 w-12 text-zinc-500" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="text-white text-sm font-semibold bg-black/40 px-2 py-0.5 rounded-lg drop-shadow">Bạn</span>
          </div>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="flex items-center justify-center gap-4 pb-6 pt-3">
        <Button
          onClick={webrtc.toggleMic}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full text-white shadow-lg transition-all",
            webrtc.isMicOn ? "bg-zinc-700 hover:bg-zinc-600" : "bg-rose-600 hover:bg-rose-700"
          )}
        >
          {webrtc.isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        <Button
          onClick={webrtc.toggleCamera}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full text-white shadow-lg transition-all",
            webrtc.isCameraOn ? "bg-zinc-700 hover:bg-zinc-600" : "bg-rose-600 hover:bg-rose-700"
          )}
        >
          {webrtc.isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </Button>

        <Button
          onClick={handleLeave}
          size="icon"
          className="h-16 w-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl"
        >
          <PhoneOff className="h-7 w-7" />
        </Button>

        <Button
          onClick={() => setChatOpen((o) => !o)}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full text-white shadow-lg transition-all relative",
            chatOpen ? "bg-primary" : "bg-zinc-700 hover:bg-zinc-600"
          )}
        >
          <MessageSquare className="h-6 w-6" />
          {messages.filter((m) => !m.isMine).length > 0 && !chatOpen && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {messages.filter((m) => !m.isMine).length}
            </span>
          )}
        </Button>
      </div>

      {/* ── Chat Overlay ── */}
      {chatOpen && (
        <div className="fixed right-4 bottom-24 w-80 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <span className="text-white font-semibold text-sm">Chat</span>
            <Button variant="ghost" size="icon" className="text-zinc-400 h-7 w-7"
              onClick={() => setChatOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64">
            {messages.length === 0 && (
              <p className="text-zinc-500 text-xs text-center py-4">Chưa có tin nhắn nào</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex flex-col gap-0.5", msg.isMine ? "items-end" : "items-start")}
              >
                <span className="text-zinc-500 text-[10px]">{msg.senderName}</span>
                <div className={cn(
                  "px-3 py-2 rounded-xl text-sm max-w-[85%] break-words",
                  msg.isMine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                )}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-700 flex gap-2">
            <Input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
              placeholder="Nhắn tin..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
            />
            <Button onClick={handleSendMsg} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
