"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import SimplePeer, { Instance as PeerInstance } from "simple-peer";

export interface UseWebRTCOptions {
  roomId: string;
  participantId: string;
  signalingUrl?: string;
  iceServers?: RTCIceServer[];
  autoJoin?: boolean;
}

export interface UseWebRTCResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isVerified: boolean;
  error: string | null;
  toggleMute: () => void;
  toggleCamera: () => void;
  leave: () => void;
}

const DEFAULT_SIGNALING_URL =
  process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:3001/signaling";

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

/**
 * useWebRTC Hook
 *
 * Manages:
 * - Local & remote MediaStreams
 * - Socket.io signaling connection to /signaling namespace
 * - WebRTC RTCPeerConnection through SimplePeer
 * - 60-second periodic heartbeat with { sessionId, participantId }
 * - Mutex controls for Audio & Video tracks (toggleMute, toggleCamera)
 * - Session verification from server attendance accumulator
 */
export function useWebRTC({
  roomId,
  participantId,
  signalingUrl = DEFAULT_SIGNALING_URL,
  iceServers = DEFAULT_ICE_SERVERS,
  autoJoin = true,
}: UseWebRTCOptions): UseWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep localStreamRef synchronized
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  /**
   * Helper to instantiate a SimplePeer connection
   */
  const createPeer = useCallback(
    (initiator: boolean, streamToUse?: MediaStream): PeerInstance => {
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        peerRef.current = null;
      }

      const activeStream = streamToUse ?? localStreamRef.current ?? undefined;

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream: activeStream,
        config: {
          iceServers,
        },
      });

      // Relay SDP offers/answers and ICE candidates through socket.io
      peer.on("signal", (signalData) => {
        if (!socketRef.current) return;

        if (signalData.type === "offer") {
          socketRef.current.emit("signal-offer", {
            sessionId: roomId,
            payload: signalData,
          });
        } else if (signalData.type === "answer") {
          socketRef.current.emit("signal-answer", {
            sessionId: roomId,
            payload: signalData,
          });
        } else {
          socketRef.current.emit("ice-candidate", {
            sessionId: roomId,
            payload: signalData,
          });
        }
      });

      peer.on("stream", (incomingStream) => {
        setRemoteStream(incomingStream);
        setIsConnected(true);
      });

      peer.on("connect", () => {
        setIsConnected(true);
      });

      peer.on("close", () => {
        setIsConnected(false);
        setRemoteStream(null);
      });

      peer.on("error", (err) => {
        // Log WebRTC connection issue
        console.error("SimplePeer error:", err);
      });

      peerRef.current = peer;
      return peer;
    },
    [roomId, iceServers]
  );

  /**
   * Leave call / cleanup resources
   */
  const leave = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        // ignore
      }
      peerRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setRemoteStream(null);
    setIsConnected(false);
  }, []);

  /**
   * Toggle microphone (mute / unmute audio tracks)
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextMuted;
        });
      }
      return nextMuted;
    });
  }, []);

  /**
   * Toggle camera (enable / disable video tracks)
   */
  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const nextCameraOff = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !nextCameraOff;
        });
      }
      return nextCameraOff;
    });
  }, []);

  // Main lifecycle: acquire media, connect socket, register events & heartbeat
  useEffect(() => {
    if (!autoJoin || !roomId || !participantId) {
      return;
    }

    let isCancelled = false;

    // Check mediaDevices support
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("WebRTC MediaDevices API is not available in this environment.");
      return;
    }

    // Acquire local audio + video stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Connect to Socket.io signaling gateway
        const socket = io(signalingUrl, {
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        // Join room
        socket.emit("join-room", {
          sessionId: roomId,
          participantId,
        });

        // Remote peer joined -> initiate offer as initiator
        socket.on("peer-joined", () => {
          createPeer(true, stream);
        });

        // Receive offer from remote peer -> create receiver peer and signal
        socket.on("signal-offer", (payload) => {
          let peer = peerRef.current;
          if (!peer) {
            peer = createPeer(false, stream);
          }
          peer.signal(payload);
        });

        // Receive answer from remote peer
        socket.on("signal-answer", (payload) => {
          if (peerRef.current) {
            peerRef.current.signal(payload);
          }
        });

        // Receive ICE candidate from remote peer
        socket.on("ice-candidate", (payload) => {
          if (peerRef.current) {
            peerRef.current.signal(payload);
          }
        });

        // Attendance mutual 15-minute verification event from gateway
        socket.on("session-verified", () => {
          setIsVerified(true);
        });

        // Peer disconnected
        socket.on("peer-disconnected", () => {
          if (peerRef.current) {
            try {
              peerRef.current.destroy();
            } catch {
              // ignore
            }
            peerRef.current = null;
          }
          setRemoteStream(null);
          setIsConnected(false);
        });

        // Setup 60-second periodic heartbeat
        heartbeatTimerRef.current = setInterval(() => {
          if (socketRef.current) {
            socketRef.current.emit(
              "heartbeat",
              {
                sessionId: roomId,
                participantId,
              },
              (res?: { acknowledged?: boolean; isVerified?: boolean }) => {
                if (res?.isVerified) {
                  setIsVerified(true);
                }
              }
            );
          }
        }, 60000);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Camera or microphone permission denied.";
        setError(msg);
      });

    return () => {
      isCancelled = true;
      leave();
    };
  }, [roomId, participantId, signalingUrl, autoJoin, createPeer, leave]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    isVerified,
    error,
    toggleMute,
    toggleCamera,
    leave,
  };
}
