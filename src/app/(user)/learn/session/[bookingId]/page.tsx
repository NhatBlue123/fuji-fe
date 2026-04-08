"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useBookingSignaling, type BookingRoomJoined, type BookingRoomExpired, type BookingError } from "@/hooks/useBookingSignaling";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useReconnect } from "@/hooks/useReconnect";
import { useSignaling } from "@/hooks/useSignaling";
import { useAuth } from "@/store/hooks";
import { useSubmitSessionReviewMutation } from "@/store/services/bookingApi";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Send,
  WifiOff, RefreshCw, Clock, MessageSquare, Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  senderName: string;
  message: string;
  isMine: boolean;
  timestamp: number;
}

export default function TeacherSessionPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = Number(params.bookingId);

  const booking = useBookingSignaling();
  const webrtc = useWebRTC();
  const signaling = useSignaling();
  const reconnect = useReconnect(signaling, webrtc);
  const { user: authUser } = useAuth();

  const [roomData, setRoomData] = useState<BookingRoomJoined | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isJoinTimeout, setIsJoinTimeout] = useState(false);
  const [submitReview, { isLoading: isSubmittingReview }] = useSubmitSessionReviewMutation();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);
  const cameraStartedRef = useRef(false);
  const offerSentRef = useRef(false);
  const roomDataRef = useRef<BookingRoomJoined | null>(null);
  const isInitiatorRef = useRef(false);
  const mediaReadyRef = useRef(false);
  const joinRequestedAtRef = useRef<number>(0);

  const myName = authUser?.fullName || authUser?.username || "Tôi";
  const myUserId = String(authUser?.id ?? "guest");

  useEffect(() => { roomDataRef.current = roomData; }, [roomData]);

  const requestJoinRoom = useCallback(
    (force = false) => {
      if (!bookingId) return;
      if (roomDataRef.current) return;
      if (!force && joinedRef.current) return;

      joinedRef.current = true;
      joinRequestedAtRef.current = Date.now();
      setIsJoinTimeout(false);
      booking.joinBookingRoom(bookingId, myName);
    },
    [booking, bookingId, myName]
  );

  // Join booking room once socket is connected
  useEffect(() => {
    if (!bookingId) return;
    const sock = booking.socket;
    if (!sock) return;

    const doJoin = () => {
      requestJoinRoom();
    };

    if (sock.connected) {
      doJoin();
    } else {
      sock.once("connect", doJoin);
      return () => { sock.off("connect", doJoin); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, booking.socket?.connected, requestJoinRoom]);

  // Retry join periodically while waiting (handles lost event / flaky socket)
  useEffect(() => {
    if (roomData) return;
    const t = setInterval(() => {
      const sock = booking.socket;
      if (!sock) return;
      if (sock.connected) {
        requestJoinRoom(true);
      } else {
        try { sock.connect(); } catch { /* ignore */ }
      }
    }, 6000);
    return () => clearInterval(t);
  }, [roomData, booking.socket, requestJoinRoom]);

  // Detect long waiting state to show better UX + manual retry
  useEffect(() => {
    if (roomData) {
      setIsJoinTimeout(false);
      return;
    }
    const t = setTimeout(() => {
      if (!roomDataRef.current) setIsJoinTimeout(true);
    }, 15000);
    return () => clearTimeout(t);
  }, [roomData, joinRequestedAtRef.current]);

  // All signaling event handlers — registered once on mount, use refs for latest state
  useEffect(() => {
    // ── Booking room events ──
    booking.on<BookingRoomJoined>("booking-room-joined", (data) => {
      setRoomData(data);
      roomDataRef.current = data;
      isInitiatorRef.current = data.isInitiator;
      setRemainingSeconds(data.remainingSeconds);
      setIsJoinTimeout(false);
      if (data.peerOnline && data.isInitiator && mediaReadyRef.current) {
        startCallAsInitiator(data.roomId);
      }
    });

    booking.on<BookingRoomJoined>("booking-peer-joined", (data) => {
      setRoomData((prev) => prev ? { ...prev, peerOnline: true } : data);
      toast.success(`${data.peerName} đã vào phòng`);
      if (isInitiatorRef.current && mediaReadyRef.current) {
        const rd = roomDataRef.current;
        if (rd) startCallAsInitiator(rd.roomId);
      }
    });

    booking.on<BookingRoomExpired>("booking-room-expired", () => {
      toast.info("Đã hết thời gian buổi học");
      handleLeave();
    });

    booking.on<BookingRoomExpired>("booking-session-ended", () => {
      toast.info("Buổi học đã kết thúc");
      handleLeave();
    });

    booking.on<BookingError>("booking-error", (err) => {
      toast.error(err.message);
      router.push("/booking/bookingmodal");
    });

    booking.on("peer-left", () => {
      toast.info("Đối tác đã rời phòng");
      handleLeave();
    });

    // ── WebRTC signaling events ──
    booking.on<{ sdp: string }>("offer", async (payload) => {
      // Wait for local media (getUserMedia) to finish before creating answer,
      // otherwise the answer SDP won't include our video/audio tracks.
      if (!mediaReadyRef.current) {
        const waitStep = 150;
        const maxWait = 10_000;
        let waited = 0;
        while (!mediaReadyRef.current && waited < maxWait) {
          await new Promise((r) => setTimeout(r, waitStep));
          waited += waitStep;
        }
      }
      try {
        const answer = await webrtc.createAnswer(JSON.parse(payload.sdp));
        const rd = roomDataRef.current;
        if (rd) booking.sendAnswer(rd.roomId, JSON.stringify(answer));
      } catch (e) { console.error("[WebRTC] createAnswer failed:", e); }
    });

    booking.on<{ sdp: string }>("answer", async (payload) => {
      try { await webrtc.setRemoteAnswer(JSON.parse(payload.sdp)); }
      catch (e) { console.error("[WebRTC] setRemoteAnswer failed:", e); }
    });

    booking.on<{ candidate: string; sdpMid: string; sdpMLineIndex: number }>(
      "ice-candidate", async (payload) => { await webrtc.addIceCandidate(payload); }
    );

    booking.on<{ roomId: string; senderId: string; senderName: string; message: string; messageId: string; timestamp: number }>(
      "receive-message", (payload) => {
        setMessages((prev) => [...prev, {
          id: payload.messageId,
          senderName: payload.senderName,
          message: payload.message,
          isMine: false,
          timestamp: payload.timestamp,
        }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    );

    booking.on("peer-reconnected", async () => {
      offerSentRef.current = false;
      const rd = roomDataRef.current;
      if (rd) {
        const offer = await webrtc.createOffer();
        booking.sendOffer(rd.roomId, JSON.stringify(offer));
      }
    });

    return () => {
      ["booking-room-joined", "booking-peer-joined", "booking-room-expired",
       "booking-session-ended", "booking-error", "peer-left",
       "offer", "answer", "ice-candidate", "receive-message", "peer-reconnected"].forEach(booking.off);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start camera + WebRTC
  useEffect(() => {
    if (cameraStartedRef.current) return;
    cameraStartedRef.current = true;

    webrtc.onConnectionStateChange((state) => {
      setIsConnected(state === "connected");
      const rd = roomDataRef.current;
      if (rd) {
        reconnect.handleConnectionStateChange(state, rd.roomId, myUserId);
      }
    });
    webrtc.onIceCandidate((candidate) => {
      const rd = roomDataRef.current;
      if (rd) booking.sendIceCandidate(rd.roomId, candidate);
    });

    (async () => {
      await webrtc.startLocalStream();
      mediaReadyRef.current = true;
      const rd = roomDataRef.current;
      if (rd && isInitiatorRef.current && rd.peerOnline) {
        startCallAsInitiator(rd.roomId);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCallAsInitiator = useCallback(async (roomId: string) => {
    if (offerSentRef.current) return;
    offerSentRef.current = true;
    try {
      const offer = await webrtc.createOffer();
      booking.sendOffer(roomId, JSON.stringify(offer));
    } catch (e) {
      offerSentRef.current = false;
      console.error("[WebRTC] createOffer failed:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach streams
  useEffect(() => {
    if (localVideoRef.current && webrtc.localStream)
      localVideoRef.current.srcObject = webrtc.localStream;
  }, [webrtc.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && webrtc.remoteStream)
      remoteVideoRef.current.srcObject = webrtc.remoteStream;
  }, [webrtc.remoteStream]);

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const t = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remainingSeconds]);

  // Warning before end
  useEffect(() => {
    if (remainingSeconds === 300) toast.warning("Còn 5 phút nữa là hết giờ");
    if (remainingSeconds === 60) toast.warning("Còn 1 phút nữa là hết giờ!");
  }, [remainingSeconds]);

  const handleLeave = useCallback(() => {
    if (roomData) booking.leaveBookingRoom(roomData.roomId);
    webrtc.cleanup();
    reconnect.reset();
    router.push("/booking/bookingmodal");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData, router]);

  const handleEndSession = useCallback(() => {
    if (roomData) booking.endBookingSession(roomData.roomId);
    webrtc.cleanup();
    reconnect.reset();
    setShowReviewModal(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData]);

  const handleSubmitReview = useCallback(async () => {
    try {
      await submitReview({ bookingId, rating: reviewRating, comment: reviewComment || undefined }).unwrap();
      toast.success("Cảm ơn bạn đã đánh giá!");
    } catch {
      toast.error("Không thể gửi đánh giá.");
    }
    router.push("/booking/bookingmodal");
  }, [submitReview, bookingId, reviewRating, reviewComment, router]);

  const handleSkipReview = useCallback(() => {
    router.push("/booking/bookingmodal");
  }, [router]);

  const handleSendMsg = useCallback(() => {
    const content = chatMsg.trim();
    if (!content || !roomData) return;
    const messageId = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();
    setMessages((prev) => [...prev, {
      id: messageId, senderName: myName, message: content, isMine: true, timestamp: Date.now(),
    }]);
    booking.sendChatMessage(roomData.roomId, myUserId, myName, content, messageId);
    setChatMsg("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [chatMsg, roomData, myUserId, myName, booking]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (!roomData) {
    return (
      <div className="flex items-center justify-center bg-slate-950" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-8 py-7 shadow-xl">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-sky-500/30" />
            <RefreshCw className="absolute h-6 w-6 text-sky-400 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-slate-100 font-semibold text-sm">Đang kết nối chờ chút nhé</p>
            <p className="text-slate-400 text-xs mt-1 animate-pulse">
              Hệ thống đang thiết lập phòng học an toàn...
            </p>
          </div>
          {isJoinTimeout && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-amber-300 text-xs">Kết nối lâu hơn bình thường.</p>
              <button
                type="button"
                onClick={() => {
                  const sock = booking.socket;
                  if (sock && !sock.connected) {
                    try { sock.connect(); } catch { /* ignore */ }
                  }
                  requestJoinRoom(true);
                }}
                className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
              >
                Thử kết nối lại
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
      style={{ height: "calc(100vh - 64px)" }}>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-slate-50 font-semibold text-sm">{roomData.subject || "Buổi học"}</span>
          <span className="text-slate-400 text-xs">với {roomData.peerName}</span>
          {isConnected && (
            <span className="text-[10px] bg-emerald-400/90 text-emerald-950 font-semibold px-2 py-0.5 rounded-full">
              Đã kết nối
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className={cn(
            "font-mono text-sm font-semibold",
            remainingSeconds <= 300 ? "text-amber-400" : "text-slate-200",
            remainingSeconds <= 60 && "text-red-400 animate-pulse",
          )}>
            {formatTimer(remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 px-6 py-4 min-h-0 overflow-hidden">

        {/* Video area */}
        <div className="relative flex-[7] rounded-[28px] overflow-hidden bg-slate-900/80 border border-white/10 shadow-xl">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
              {reconnect.reconnectState === "reconnecting" ? (
                <>
                  <WifiOff className="h-10 w-10 text-amber-300 mb-3" />
                  <p className="text-slate-50 font-semibold">Đang kết nối lại...</p>
                  <p className="text-slate-400 text-xs mt-1">{reconnect.countdown}s còn lại</p>
                </>
              ) : (
                <>
                  <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mb-3" />
                  <p className="text-slate-300 text-sm">
                    {roomData.peerOnline ? "Đang thiết lập kết nối P2P..." : "Đang chờ đối tác vào phòng..."}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Peer info */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-slate-50 text-sm font-medium drop-shadow bg-slate-900/60 px-3 py-1 rounded-full">
              {roomData.peerName}
            </span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-semibold">
              {roomData.role === "TEACHER" ? "Học viên" : "Giáo viên"}
            </span>
          </div>

          {/* Mic/Camera toggles */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={webrtc.toggleMic}
              className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/15",
                webrtc.isMicOn ? "bg-slate-900/40 hover:bg-slate-900/70 text-slate-50" : "bg-red-500 hover:bg-red-400 text-white")}>
              {webrtc.isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button onClick={webrtc.toggleCamera}
              className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/15",
                webrtc.isCameraOn ? "bg-slate-900/40 hover:bg-slate-900/70 text-slate-50" : "bg-red-500 hover:bg-red-400 text-white")}>
              {webrtc.isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>
          </div>

          {/* Local PiP */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 items-start">
            <div className="relative w-36 aspect-video rounded-2xl overflow-hidden border border-white/35 shadow-xl bg-slate-900">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {!webrtc.isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                  <VideoOff className="h-5 w-5 text-slate-500" />
                </div>
              )}
            </div>
            <span className="text-slate-50 text-xs font-medium bg-slate-900/75 px-2.5 py-0.5 rounded-full">
              {myName} ({roomData.role === "TEACHER" ? "GV" : "HV"})
            </span>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="flex-[3] flex flex-col rounded-[24px] overflow-hidden bg-slate-900/80 border border-white/10 shadow-xl min-h-0">
            <div className="px-4 py-3 bg-slate-900/80 border-b border-white/10 shrink-0">
              <h2 className="text-slate-50 font-semibold text-sm">Nhắn tin</h2>
              <p className="text-slate-400 text-xs mt-0.5">{roomData.peerName}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-500 text-xs text-center">Gửi tin nhắn để bắt đầu trò chuyện.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col gap-0.5", msg.isMine ? "items-end" : "items-start")}>
                  <span className="text-slate-500 text-[10px] px-1">{msg.senderName}</span>
                  <div className={cn("px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm",
                    msg.isMine ? "bg-sky-500/90 text-slate-950 rounded-br-sm" : "bg-slate-800/90 text-slate-50 rounded-bl-sm")}>
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="shrink-0 p-3 border-t border-white/10 bg-slate-950/80">
              <div className="flex gap-2">
                <input
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMsg(); } }}
                  placeholder="Nhắn tin..."
                  className="flex-1 bg-slate-900/70 border border-slate-700 text-sm text-slate-50 placeholder:text-slate-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button onClick={handleSendMsg}
                  className="shrink-0 w-9 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-4 px-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent">
        <button onClick={() => setShowChat((v) => !v)}
          className="h-11 px-5 rounded-full border border-slate-600 text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 font-medium gap-2 shadow-md flex items-center text-sm">
          <MessageSquare className="h-4 w-4" />
          {showChat ? "Ẩn chat" : "Chat"}
        </button>

        <button onClick={handleEndSession}
          className="h-12 px-8 rounded-full bg-red-500 hover:bg-red-400 text-white font-semibold tracking-wide gap-2 shadow-lg flex items-center">
          <PhoneOff className="h-4 w-4" />
          Kết thúc buổi học
        </button>

        <button onClick={handleLeave}
          className="h-11 px-5 rounded-full border border-slate-600 text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 font-medium gap-2 shadow-md flex items-center text-sm">
          Rời phòng
        </button>
      </div>

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-50 mb-1">Đánh giá buổi học</h3>
            <p className="text-slate-400 text-sm mb-5">
              Buổi học với {roomData?.peerName} đã kết thúc.
            </p>

            {/* Star rating */}
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}
                  className="transition-transform hover:scale-110">
                  <Star className={cn("h-8 w-8", s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-600")} />
                </button>
              ))}
              <span className="ml-2 text-slate-300 text-sm font-semibold">{reviewRating}/5</span>
            </div>

            {/* Comment */}
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Nhận xét (không bắt buộc)..."
              className="w-full min-h-[80px] resize-none bg-slate-950/70 border border-slate-700 text-sm text-slate-50 placeholder:text-slate-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-4"
            />

            <div className="flex justify-end gap-3">
              <button onClick={handleSkipReview}
                className="px-5 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800">
                Bỏ qua
              </button>
              <button onClick={handleSubmitReview} disabled={isSubmittingReview}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold disabled:opacity-50">
                {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
