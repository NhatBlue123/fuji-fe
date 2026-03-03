/**
 * useWebRTC — manages the RTCPeerConnection lifecycle.
 *
 * Flow:
 *   1. getUserMedia — request camera + mic
 *   2. createPeerConnection with STUN servers from /api/video-call/config
 *   3. Initiator: createOffer → setLocalDescription → emit offer
 *   4. Receiver:  setRemoteDescription(offer) → createAnswer → emit answer
 *   5. Both: onicecandidate → emit ice-candidate
 *   6. Both: ontrack → attach remote stream to video element
 */
"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export interface WebRTCHook {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  startLocalStream: () => Promise<void>;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  setRemoteAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  onIceCandidate: (cb: (candidate: RTCIceCandidate) => void) => void;
  onConnectionStateChange: (cb: (state: RTCPeerConnectionState) => void) => void;
  cleanup: () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function useWebRTC(): WebRTCHook {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCbRef = useRef<((c: RTCIceCandidate) => void) | null>(null);
  const stateCbRef = useRef<((s: RTCPeerConnectionState) => void) | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const ensurePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) iceCbRef.current?.(e.candidate);
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] state:", pc.connectionState);
      stateCbRef.current?.(pc.connectionState);
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      setRemoteStream(stream);
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setLocalStream(stream);

      const pc = ensurePC();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      console.error("[WebRTC] getUserMedia failed:", err);
      throw err;
    }
  }, [ensurePC]);

  const createOffer = useCallback(async () => {
    const pc = ensurePC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, [ensurePC]);

  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const flushCandidates = async () => {
    while (pendingCandidates.current.length > 0) {
      const c = pendingCandidates.current.shift();
      if (c && pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch((e) => console.error("ICE error", e));
      }
    }
  };

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = ensurePC();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushCandidates();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, [ensurePC]);

  const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    await flushCandidates();
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (pcRef.current?.remoteDescription) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.error("ICE error", e));
    } else {
      pendingCandidates.current.push(candidate);
    }
  }, []);

  const onIceCandidate = useCallback((cb: (c: RTCIceCandidate) => void) => {
    iceCbRef.current = cb;
  }, []);

  const onConnectionStateChange = useCallback((cb: (s: RTCPeerConnectionState) => void) => {
    stateCbRef.current = cb;
  }, []);

  // ── Mic / Camera toggle ──────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMicOn((prev) => !prev);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOn((prev) => !prev);
  }, [localStream]);

  // ── Cleanup ──────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    iceCbRef.current = null;
    stateCbRef.current = null;
  }, [localStream]);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  return {
    localStream,
    remoteStream,
    isMicOn,
    isCameraOn,
    toggleMic,
    toggleCamera,
    startLocalStream,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    onIceCandidate,
    onConnectionStateChange,
    cleanup,
  };
}
