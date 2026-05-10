/**
 * useWebRTC — manages the RTCPeerConnection lifecycle.
 *
 * Flow:
 *   1. getUserMedia — request camera + mic
 *   2. createPeerConnection with STUN servers
 *   3. Initiator: createOffer → setLocalDescription → emit offer
 *   4. Receiver:  setRemoteDescription(offer) → createAnswer → emit answer
 *   5. Both: onicecandidate → emit ice-candidate
 *   6. Both: ontrack → attach remote stream to video element
 *
 * KEY FIX: cleanup is separated from localStream state.
 * Previously: cleanup useCallback depended on [localStream].
 * When startLocalStream() called setLocalStream(), React re-ran the cleanup
 * useEffect (because [cleanup] dep changed) → closed the RTCPeerConnection
 * WHILE createOffer() was pending → Chrome hung the promise indefinitely.
 * Solution: use localStreamRef (always current) so cleanup has no deps and
 * the useEffect only fires on actual unmount.
 */
"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { getVideoCallIceConfigUrl } from "@/lib/video-call-urls";
import { getAccessToken } from "@/lib/token";

interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

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

let cachedIceServers: RTCIceServer[] | null = null;

async function loadIceServers(): Promise<RTCIceServer[]> {
  if (cachedIceServers) return cachedIceServers;

  try {
    // Must use same host as API (not hardcoded localhost) so 2+ devices on LAN work
    const headers: HeadersInit = {};
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(getVideoCallIceConfigUrl(), { headers });
    if (!res.ok) {
      throw new Error(`ICE config HTTP ${res.status}`);
    }
    const data: { iceServers?: IceServerConfig[] } = await res.json();
    if (data.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      cachedIceServers = data.iceServers as RTCIceServer[];
      return cachedIceServers;
    }
  } catch (err) {
    console.warn("[WebRTC] Failed to load ICE config from backend, falling back to default STUN only.", err);
  }

  // Fallback: original hardcoded STUN list
  cachedIceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];
  return cachedIceServers;
}

export function useWebRTC(): WebRTCHook {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCbRef = useRef<((c: RTCIceCandidate) => void) | null>(null);
  const stateCbRef = useRef<((s: RTCPeerConnectionState) => void) | null>(null);

  // Keep a ref of localStream so cleanup() always has the latest value
  // WITHOUT being listed as a useCallback dependency.
  // This is the key fix: cleanup's useEffect dep array is now [] (empty),
  // so it only runs when the component actually unmounts — not every time
  // localStream changes.
  const localStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const ensurePC = useCallback(async () => {
    // Recreate if PC doesn't exist or was previously closed
    if (pcRef.current && pcRef.current.connectionState !== "closed") {
      return pcRef.current;
    }

    const iceServers = await loadIceServers();
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (e) => {
      if (e.candidate) iceCbRef.current?.(e.candidate);
    };

    pc.onconnectionstatechange = () => {
      stateCbRef.current?.(pc.connectionState);
    };

    pc.ontrack = (e) => {
      const incomingStream = e.streams[0] ?? new MediaStream([e.track]);
      setRemoteStream((prev) => {
        if (prev && prev.id === incomingStream.id) {
          // Same stream reference — React won't re-render. Clone to force update.
          const clone = new MediaStream(incomingStream.getTracks());
          return clone;
        }
        return incomingStream;
      });
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  const startLocalStream = useCallback(async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      console.warn("[WebRTC] getUserMedia failed, continuing without local media:", err);
    }

    if (stream) {
      localStreamRef.current = stream;
      setLocalStream(stream);
    }

    const pc = await ensurePC();
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
    } else {
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
    }
  }, [ensurePC]);

  const createOffer = useCallback(async () => {
    const pc = await ensurePC();
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
    const pc = await ensurePC();
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
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMicOn((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOn((prev) => !prev);
  }, []);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  // IMPORTANT: no deps — this only runs on actual component unmount.
  // Using localStreamRef (not localStream state) avoids making cleanup
  // a [localStream]-dependent callback, which was the root cause of the bug:
  // every setLocalStream() call would trigger the old cleanup and close the PC.

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    iceCbRef.current = null;
    stateCbRef.current = null;
  }, []); // ← NO deps: cleanup is stable, useEffect only fires on unmount

  useEffect(() => () => { cleanup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
