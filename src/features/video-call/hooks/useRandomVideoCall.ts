"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchVideoCallIceServers,
  getRandomVideoCallWsUrl,
} from "../api/videoCallTransport";
import type {
  VideoCallMatchPreferences,
  RemoteMediaStatus,
  VideoCallSignalMessage,
  VideoCallStatus,
} from "../types";

interface UseRandomVideoCallOptions {
  autoStart?: boolean;
  initialPreferences?: VideoCallMatchPreferences;
}

const DEFAULT_MATCH_PREFERENCES: VideoCallMatchPreferences = {
  level: "N5",
  matchMode: "same_level",
};

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

  const handleSignalMessage = useCallback(
    async (message: MessageEvent<string>) => {
      const data = JSON.parse(message.data) as VideoCallSignalMessage;

      switch (data.type) {
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
  };
}
