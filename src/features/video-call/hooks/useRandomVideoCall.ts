"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_CONFIG } from "@/config/api";
import { getAccessToken } from "@/lib/token";
import type { ChatViolationType } from "@/types/chat-moderation";
import {
  fetchVideoCallIceServers,
  getRandomVideoCallWsUrl,
} from "../api/videoCallTransport";
import type {
  VideoCallChatMessage,
  VideoCallMatchPreferences,
  RemoteMediaStatus,
  VideoCallSignalMessage,
  VideoCallStatus,
  ChatMessageItem,
} from "../types";

interface UseRandomVideoCallOptions {
  autoStart?: boolean;
  initialPreferences?: VideoCallMatchPreferences;
}

const DEFAULT_MATCH_PREFERENCES: VideoCallMatchPreferences = {
  level: "N5",
  matchMode: "same_level",
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
};

type BanStatusResponse = {
  banned: boolean;
  type?: string | null;
  until?: string | null;
  violationCount: number;
};

const JAPANESE_CHAR_REGEX = /[ぁ-んァ-ン一-龯]/;
const LATIN_CHAR_REGEX = /[A-Za-zÀ-ỹ]/;
const VIETNAMESE_DIACRITIC_REGEX = /[À-ỹ]/;

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function getStoredUser(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth_state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.user ?? parsed?.userInfo ?? parsed?.profile;
    const id = user?.id;
    if (id == null) return null;
    const name =
      user?.username || user?.fullName || user?.name || user?.email || `User#${id}`;
    return { id: String(id), name };
  } catch {
    return null;
  }
}

function classifyViolationType(message: string): ChatViolationType | null {
  if (JAPANESE_CHAR_REGEX.test(message)) return null;
  if (!LATIN_CHAR_REGEX.test(message)) return null;
  if (VIETNAMESE_DIACRITIC_REGEX.test(message)) return "VIETNAMESE";
  if (/[A-Za-z]/.test(message)) return "ENGLISH";
  return "OTHER";
}

export function useRandomVideoCall({
  autoStart = false,
  initialPreferences = DEFAULT_MATCH_PREFERENCES,
}: UseRandomVideoCallOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localMediaPromiseRef = useRef<Promise<MediaStream> | null>(null);
  const queuedRemoteIceRef = useRef<RTCIceCandidateInit[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStartRef = useRef(autoStart);
  const matchPreferencesRef =
    useRef<VideoCallMatchPreferences>(initialPreferences);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<VideoCallStatus>("connecting");
  const [notice, setNotice] = useState("Đang mở camera và micro...");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [remoteMedia, setRemoteMedia] = useState<RemoteMediaStatus>({
    audio: true,
    video: true,
  });
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [violationCount, setViolationCount] = useState(0);
  const [isChatBanned, setIsChatBanned] = useState(false);
  const [chatBanUntil, setChatBanUntil] = useState<Date | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const applyBanStatus = useCallback((status?: BanStatusResponse | null) => {
    if (!status) return;
    setViolationCount(status.violationCount ?? 0);

    if (status.banned) {
      setIsChatBanned(true);
      setChatBanUntil(status.until ? new Date(status.until) : null);
      setShowWarning(false);
      return;
    }

    setIsChatBanned(false);
    setChatBanUntil(null);
  }, []);

  // Auto-unban timer
  useEffect(() => {
    if (!isChatBanned || !chatBanUntil) return;

    const checkBanStatus = () => {
      const now = new Date();
      if (chatBanUntil <= now) {
        setIsChatBanned(false);
        setChatBanUntil(null);
        setViolationCount(0);
      }
    };

    const interval = setInterval(checkBanStatus, 1000);
    return () => clearInterval(interval);
  }, [isChatBanned, chatBanUntil]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;

    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
    fetch(`${baseUrl}/chat/ban-status/${user.id}`, {
      headers,
      credentials: "include",
    })
      .then((res) => res.json())
      .then((result: ApiResponse<BanStatusResponse>) => {
        applyBanStatus(result?.data);
      })
      .catch((error) => {
        console.warn("[VideoCall] Failed to fetch ban status.", error);
      });
  }, [applyBanStatus]);

  useEffect(() => () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const sendSignal = useCallback((payload: VideoCallSignalMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const closePeerConnection = useCallback(() => {
    clearReconnectTimer();
    pcRef.current?.close();
    pcRef.current = null;
    queuedRemoteIceRef.current = [];
    setRemoteStream(null);
    setRemoteMedia({ audio: true, video: true });
  }, [clearReconnectTimer]);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (localMediaPromiseRef.current) return localMediaPromiseRef.current;

    localMediaPromiseRef.current = navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicOn(stream.getAudioTracks().every((track) => track.enabled));
        setIsCameraOn(stream.getVideoTracks().every((track) => track.enabled));
        return stream;
      })
      .catch((error) => {
        localMediaPromiseRef.current = null;
        throw error;
      });

    return localMediaPromiseRef.current;
  }, []);

  const startSearch = useCallback((preferences?: VideoCallMatchPreferences) => {
    if (preferences) {
      matchPreferencesRef.current = preferences;
    }

    autoStartRef.current = true;
    setStatus("connecting");
    setNotice("Đang mở camera và kết nối...");
    setRemoteStream(null);
    setRemoteMedia({ audio: true, video: true });
    queuedRemoteIceRef.current = [];

    ensureLocalMedia()
      .then(() => {
        if (!autoStartRef.current) return;
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          setNotice("Đang kết nối máy chủ...");
          return;
        }

        setStatus("searching");
        setNotice("Đang tìm bạn học ngẫu nhiên...");
        sendSignal({
          type: "ready_for_peer",
          ...matchPreferencesRef.current,
        });
      })
      .catch((error) => {
        console.warn("[VideoCall] getUserMedia failed.", error);
        sendSignal({ type: "leave" });
        setStatus("error");
        setNotice("Không mở được camera hoặc micro.");
      });
  }, [ensureLocalMedia, sendSignal]);

  const sendMediaStatus = useCallback(
    (kind: "audio" | "video", enabled: boolean) => {
      sendSignal({ type: "media_status", kind, enabled });
    },
    [sendSignal],
  );

  const addLocalTracks = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    const stream = await ensureLocalMedia();
    for (const track of stream.getTracks()) {
      const alreadyAdded = pc.getSenders().some((sender) => sender.track === track);
      if (!alreadyAdded) pc.addTrack(track, stream);
    }
  }, [ensureLocalMedia]);

  const flushQueuedIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;

    const candidates = [...queuedRemoteIceRef.current];
    queuedRemoteIceRef.current = [];

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("[VideoCall] Failed to add queued ICE candidate.", error);
      }
    }
  }, []);

  const createOfferWithIceRestart = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) throw new Error("PeerConnection is not ready");
    return pc.createOffer({ iceRestart: true });
  }, []);

  const resetAndSearch = useCallback(() => {
    closePeerConnection();
    setChatMessages([]);
    if (wsRef.current?.readyState === WebSocket.OPEN && autoStartRef.current) {
      startSearch(matchPreferencesRef.current);
    }
  }, [closePeerConnection, startSearch]);

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      return pcRef.current;
    }

    queuedRemoteIceRef.current = [];
    const iceServers = await fetchVideoCallIceServers();
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: "ice", candidate: event.candidate.toJSON() });
      }
    };

    pc.oniceconnectionstatechange = () => {
      switch (pc.iceConnectionState) {
        case "checking":
          setStatus("calling");
          setNotice("Đang thiết lập kết nối...");
          break;
        case "connected":
        case "completed":
          clearReconnectTimer();
          setStatus("connected");
          setNotice("");
          break;
        case "disconnected":
          setStatus("reconnecting");
          setNotice("Mất tín hiệu, đang thử nối lại...");
          pc.restartIce();
          break;
        case "failed":
          setStatus("reconnecting");
          setNotice("Kết nối yếu, thử gọi lại...");
          clearReconnectTimer();
          reconnectTimerRef.current = setTimeout(() => {
            if (pcRef.current?.iceConnectionState !== "failed") return;
            createOfferWithIceRestart()
              .then(async (offer) => {
                await pcRef.current?.setLocalDescription(offer);
                sendSignal({ type: "offer", offer });
              })
              .catch(() => {
                setNotice("Không nối lại được. Đang tìm bạn học mới...");
                resetAndSearch();
              });
          }, 3000);
          break;
      }
    };

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0] ?? new MediaStream([event.track]);
      setRemoteStream(incomingStream);
      setStatus("connected");
      setNotice("");

      const local = localStreamRef.current;
      if (local) {
        sendMediaStatus("audio", local.getAudioTracks()[0]?.enabled ?? false);
        sendMediaStatus("video", local.getVideoTracks()[0]?.enabled ?? false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [
    clearReconnectTimer,
    createOfferWithIceRestart,
    resetAndSearch,
    sendMediaStatus,
    sendSignal,
  ]);

  const sendChatMessage = useCallback(
    async (messageText: string) => {
      const user = getStoredUser();
      if (!user) {
        console.warn("[VideoCall] Cannot send chat: user not found");
        return;
      }

      if (isChatBanned) {
        console.warn("[VideoCall] Chat is currently banned.");
        return;
      }

      const violationType = classifyViolationType(messageText);
      const isViolation = violationType !== null;
      const messageId = createMessageId();
      const timestamp = Date.now();

      // Add to local UI immediately
      const localMessage: ChatMessageItem = {
        id: messageId,
        senderId: user.id,
        senderName: user.name,
        message: messageText,
        timestamp,
        isLocal: true,
        isViolation,
        status: "sending",
      };
      setChatMessages((prev) => [...prev, localMessage]);

      // Send via WebSocket
      const chatPayload: VideoCallChatMessage = {
        type: "chat_message",
        messageId,
        senderId: user.id,
        senderName: user.name,
        message: messageText,
        timestamp,
        isViolation,
      };

      const sent = sendSignal(chatPayload);
      if (sent) {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "sent" as const } : m
          )
        );
      } else {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "failed" as const } : m
          )
        );
      }

      // Report violation to backend
      if (sent && isViolation && violationType) {
        try {
          const token = getAccessToken();
          const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
          const headers: HeadersInit = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await fetch(`${baseUrl}/chat/violation`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({
              userId: user.id,
              sessionId: wsRef.current?.url ?? "random-video-call",
              violationType,
              messageContent: messageText,
            }),
          });

          const result = (await response.json().catch(() => null)) as
            | ApiResponse<BanStatusResponse>
            | null;

          applyBanStatus(result?.data);

          if (result?.code === "VIOLATION_WARNING") {
            setShowWarning(true);
            if (warningTimerRef.current) {
              clearTimeout(warningTimerRef.current);
            }
            warningTimerRef.current = setTimeout(() => {
              setShowWarning(false);
            }, 6000);
          }
          if (result?.data?.banned) {
            setShowWarning(false);
          }
        } catch (error) {
          console.error("[VideoCall] Failed to report violation:", error);
        }
      }
    },
    [applyBanStatus, isChatBanned, sendSignal]
  );

  const handleSignalMessage = useCallback(
    async (message: MessageEvent<string>) => {
      const data = JSON.parse(message.data) as VideoCallSignalMessage;

      switch (data.type) {
        case "chat_message": {
          const chatMsg = data as VideoCallChatMessage;
          const user = getStoredUser();
          const isLocal = user?.id === chatMsg.senderId;

          setChatMessages((prev) => [
            ...prev,
            {
              id: chatMsg.messageId,
              senderId: chatMsg.senderId,
              senderName: chatMsg.senderName,
              message: chatMsg.message,
              timestamp: chatMsg.timestamp,
              isLocal,
              isViolation: chatMsg.isViolation,
              status: "sent",
            },
          ]);
          break;
        }
        case "initiateOffer": {
          setStatus("matched");
          setNotice("Đã tìm thấy bạn học. Đang gọi...");
          await ensurePeerConnection();
          await addLocalTracks();
          const offer = await createOfferWithIceRestart();
          await pcRef.current?.setLocalDescription(offer);
          sendSignal({ type: "offer", offer });
          break;
        }
        case "waitForOffer":
          setStatus("matched");
          setNotice("Đã tìm thấy bạn học. Đang chờ cuộc gọi...");
          await ensurePeerConnection();
          await addLocalTracks();
          break;
        case "offer": {
          if (pcRef.current && pcRef.current.signalingState !== "stable") {
            closePeerConnection();
          }
          const pc = await ensurePeerConnection();
          await addLocalTracks();
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await flushQueuedIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: "answer", answer });
          break;
        }
        case "answer":
          if (pcRef.current?.signalingState === "have-local-offer") {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer),
            );
            await flushQueuedIce();
          }
          break;
        case "ice":
          if (!data.candidate) return;
          if (pcRef.current?.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate),
              );
            } catch (error) {
              console.error("[VideoCall] Failed to add ICE candidate.", error);
            }
          } else {
            queuedRemoteIceRef.current.push(data.candidate);
          }
          break;
        case "media_status":
          setRemoteMedia((prev) => ({ ...prev, [data.kind]: data.enabled }));
          break;
        case "leave":
          setNotice("Bạn học đã rời phòng. Đang tìm người mới...");
          resetAndSearch();
          break;
      }
    },
    [
      addLocalTracks,
      closePeerConnection,
      createOfferWithIceRestart,
      ensurePeerConnection,
      flushQueuedIce,
      resetAndSearch,
      sendSignal,
    ],
  );

  const toggleMic = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    const enabled = !audioTrack.enabled;
    audioTrack.enabled = enabled;
    pcRef.current
      ?.getSenders()
      .filter((sender) => sender.track?.kind === "audio")
      .forEach((sender) => {
        if (sender.track) sender.track.enabled = enabled;
      });
    setIsMicOn(enabled);
    sendMediaStatus("audio", enabled);
  }, [sendMediaStatus]);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    const enabled = !videoTrack.enabled;
    videoTrack.enabled = enabled;
    pcRef.current
      ?.getSenders()
      .filter((sender) => sender.track?.kind === "video")
      .forEach((sender) => {
        if (sender.track) sender.track.enabled = enabled;
      });
    setIsCameraOn(enabled);
    sendMediaStatus("video", enabled);
  }, [sendMediaStatus]);

  const nextPeer = useCallback(() => {
    sendSignal({ type: "leave" });
    setNotice("Đang chuyển sang bạn học mới...");
    resetAndSearch();
  }, [resetAndSearch, sendSignal]);

  const endCall = useCallback(() => {
    autoStartRef.current = false;
    sendSignal({ type: "leave" });
    closePeerConnection();
    setChatMessages([]);
    setStatus("closed");
    setNotice("Đã dừng tìm kiếm.");
  }, [closePeerConnection, sendSignal]);

  useEffect(() => {
    let isMounted = true;

    const initMediaTimer = window.setTimeout(() => {
      ensureLocalMedia()
        .then(() => {
          if (!isMounted || autoStartRef.current) return;
          setStatus("idle");
          setNotice("Camera đã sẵn sàng. Chọn level rồi bắt đầu matching.");
        })
        .catch((error) => {
          if (!isMounted) return;
          console.warn("[VideoCall] getUserMedia failed.", error);
          setStatus("error");
          setNotice("Không mở được camera hoặc micro.");
        });
    }, 0);

    const ws = new WebSocket(getRandomVideoCallWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) return;
      if (autoStartRef.current) {
        startSearch(matchPreferencesRef.current);
      } else if (localStreamRef.current) {
        setStatus("idle");
        setNotice("Camera đã sẵn sàng. Chọn level rồi bắt đầu matching.");
      }
    };
    ws.onmessage = (message) => {
      handleSignalMessage(message).catch((error) => {
        console.error("[VideoCall] Failed to handle signal.", error);
        setStatus("error");
        setNotice("Có lỗi khi xử lý tín hiệu cuộc gọi.");
      });
    };
    ws.onerror = () => {
      if (!isMounted) return;
      setStatus("error");
      setNotice("Không kết nối được máy chủ video call.");
    };
    ws.onclose = () => {
      if (!isMounted) return;
      closePeerConnection();
      setStatus("closed");
      setNotice("Kết nối video call đã đóng.");
    };

    return () => {
      isMounted = false;
      autoStartRef.current = false;
      window.clearTimeout(initMediaTimer);
      clearReconnectTimer();
      sendSignal({ type: "leave" });
      ws.close();
      closePeerConnection();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      localMediaPromiseRef.current = null;
      setLocalStream(null);
    };
  }, [
    clearReconnectTimer,
    closePeerConnection,
    ensureLocalMedia,
    handleSignalMessage,
    sendSignal,
    startSearch,
  ]);

  return {
    localStream,
    remoteStream,
    status,
    notice,
    isMicOn,
    isCameraOn,
    remoteMedia,
    toggleMic,
    toggleCamera,
    startSearch,
    nextPeer,
    endCall,
    chatMessages,
    sendChatMessage,
    violationCount,
    isChatBanned,
    chatBanUntil,
    showWarning,
  };
}
