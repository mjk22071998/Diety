import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from "react-native-webrtc";

export interface UseNativeWebRTCOptions {
  roomId: string;
  participantId: string;
  signalingUrl?: string | undefined;
  iceServers?: Array<{ urls: string | string[] }> | undefined;
  autoJoin?: boolean | undefined;
}

export interface UseNativeWebRTCResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isVerified: boolean;
  error: string | null;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  endCall: () => void;
}

const DEFAULT_SIGNALING_URL =
  process.env.EXPO_PUBLIC_SIGNALING_URL || "ws://localhost:3001/signaling";

const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

/**
 * useNativeWebRTC
 *
 * Native WebRTC hook for React Native Expo mobile app:
 * - Manages RTCPeerConnection and MediaStream lifecycle
 * - Connects to Socket.io /signaling gateway
 * - Exchanges signals: join-room, peer-joined, signal-offer, signal-answer, ice-candidate
 * - 10-second presence heartbeats for clinical attendance accumulator
 * - Listens for session-verified event upon achieving 15m mutual attendance
 * - Controls: toggleMute, toggleCamera, switchCamera, endCall
 */
export function useNativeWebRTC({
  roomId,
  participantId,
  signalingUrl = DEFAULT_SIGNALING_URL,
  iceServers = DEFAULT_ICE_SERVERS,
  autoJoin = true,
}: UseNativeWebRTCOptions): UseNativeWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Keep localStreamRef synced
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  /**
   * End call & release all media and network resources
   */
  const endCall = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        // ignore cleanup error
      }
      pcRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {
        // ignore cleanup error
      }
      socketRef.current = null;
    }

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {
        // ignore track stop error
      }
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    queuedCandidatesRef.current = [];
  }, []);

  /**
   * Toggle microphone audio tracks
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
   * Toggle camera video tracks
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

  /**
   * Flip between front and rear cameras
   */
  const switchCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track: any) => {
        if (typeof track._switchCamera === "function") {
          track._switchCamera();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!autoJoin || !roomId || !participantId) {
      return;
    }

    let isCancelled = false;

    async function initializeCall() {
      try {
        setError(null);

        // 1. Acquire media stream (audio + front-facing video)
        const stream = (await mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: "user" },
        })) as MediaStream;

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Initialize RTCPeerConnection with STUN
        const pc = new RTCPeerConnection({ iceServers });
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // 3. Connect to Socket.io signaling gateway
        const socket = io(signalingUrl, {
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        // ICE candidate generation handler
        pc.onicecandidate = (event: any) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit("ice-candidate", {
              sessionId: roomId,
              payload: event.candidate,
            });
          }
        };

        // Incoming remote media tracks
        pc.ontrack = (event: any) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            setIsConnected(true);
          }
        };

        // Also handle onaddstream for compatibility
        (pc as any).onaddstream = (event: any) => {
          if (event.stream) {
            setRemoteStream(event.stream);
            setIsConnected(true);
          }
        };

        // Connection state observer
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setIsConnected(true);
          } else if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed" ||
            pc.connectionState === "closed"
          ) {
            setIsConnected(false);
          }
        };

        // 4. Socket signaling listeners
        socket.on("connect", () => {
          socket.emit("join-room", {
            sessionId: roomId,
            participantId,
          });
        });

        // If socket is already connected immediately
        if (socket.connected) {
          socket.emit("join-room", {
            sessionId: roomId,
            participantId,
          });
        }

        // When remote peer joins -> create and emit offer as initiator
        socket.on("peer-joined", async () => {
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            socket.emit("signal-offer", {
              sessionId: roomId,
              payload: offer,
            });
          } catch (err: any) {
            console.error("Error creating WebRTC offer:", err);
          }
        });

        // When receiving offer -> create and emit answer
        socket.on("signal-offer", async (payload: any) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload));

            // Drain queued ICE candidates
            while (queuedCandidatesRef.current.length > 0) {
              const candidate = queuedCandidatesRef.current.shift();
              if (candidate) {
                await pc.addIceCandidate(candidate).catch((e) =>
                  console.warn("Error adding queued ICE candidate:", e)
                );
              }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal-answer", {
              sessionId: roomId,
              payload: answer,
            });
          } catch (err: any) {
            console.error("Error handling WebRTC offer:", err);
          }
        });

        // When receiving answer
        socket.on("signal-answer", async (payload: any) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload));

            // Drain queued ICE candidates
            while (queuedCandidatesRef.current.length > 0) {
              const candidate = queuedCandidatesRef.current.shift();
              if (candidate) {
                await pc.addIceCandidate(candidate).catch((e) =>
                  console.warn("Error adding queued ICE candidate:", e)
                );
              }
            }
          } catch (err: any) {
            console.error("Error handling WebRTC answer:", err);
          }
        });

        // When receiving ICE candidate
        socket.on("ice-candidate", async (payload: any) => {
          if (!payload) return;
          try {
            const candidate = new RTCIceCandidate(payload);
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidate);
            } else {
              queuedCandidatesRef.current.push(candidate);
            }
          } catch (err: any) {
            console.warn("Error adding ICE candidate:", err);
          }
        });

        // Mutual verification event from signaling gateway
        socket.on("session-verified", () => {
          setIsVerified(true);
        });

        // Remote peer disconnected
        socket.on("peer-disconnected", () => {
          setRemoteStream(null);
          setIsConnected(false);
        });

        // 5. 10-second presence heartbeats
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
        }, 10000);
      } catch (err: any) {
        if (isCancelled) return;
        const msg =
          err?.message || "Failed to access camera or microphone permissions.";
        setError(msg);
      }
    }

    initializeCall();

    return () => {
      isCancelled = true;
      endCall();
    };
  }, [roomId, participantId, signalingUrl, autoJoin, endCall]);

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
    switchCamera,
    endCall,
  };
}
