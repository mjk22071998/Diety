import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { RTCView } from "react-native-webrtc";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
  PhoneOff,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { useNativeWebRTC, UseNativeWebRTCResult } from "../hooks/useNativeWebRTC";

export interface ConsultationCallProps {
  roomId: string;
  participantId: string;
  roomTitle?: string | undefined;
  onEndCall?: (() => void) | undefined;
  signalingUrl?: string | undefined;
  webRTCState?: Partial<UseNativeWebRTCResult> | undefined;
}

export function ConsultationCall({
  roomId,
  participantId,
  roomTitle,
  onEndCall,
  signalingUrl,
  webRTCState,
}: ConsultationCallProps) {
  const nativeRTC = useNativeWebRTC({
    roomId,
    participantId,
    signalingUrl,
  });

  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    isVerified,
    toggleMute,
    toggleCamera,
    switchCamera,
    endCall,
  } = webRTCState ? { ...nativeRTC, ...webRTCState } : nativeRTC;

  // Elapsed call duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    endCall();
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <View style={styles.container} testID="consultation-call-screen">
      {/* Remote Video / Background Fullscreen View */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          zOrder={0}
          testID="remote-video"
        />
      ) : (
        <View style={styles.remotePlaceholder} testID="remote-placeholder">
          <View style={styles.pulseAvatar}>
            <ActivityIndicator size="large" color="#6366F1" testID="remote-loading-indicator" />
          </View>
          <Text style={styles.waitingTitle}>Connecting Telehealth Session</Text>
          <Text style={styles.waitingSubtitle}>
            Awaiting remote clinical participant in room {roomId}...
          </Text>
        </View>
      )}

      {/* Floating Picture-in-Picture Local Preview */}
      <View style={styles.pipContainer} testID="local-pip-container">
        {localStream && !isCameraOff ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.pipVideo}
            objectFit="cover"
            mirror={true}
            zOrder={1}
            testID="local-video"
          />
        ) : (
          <View style={styles.cameraOffPiP} testID="camera-off-pip">
            <VideoOff size={24} color="#94A3B8" />
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        )}
      </View>

      {/* Overlay Header: Session Room Title, Elapsed Timer, Verified Badge */}
      <View style={styles.headerOverlay} testID="call-header-overlay">
        <View style={styles.headerInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {roomTitle || `Session: ${roomId}`}
          </Text>

          <View style={styles.timerRow}>
            <View style={styles.timerPill}>
              <View style={[styles.timerDot, isConnected && styles.timerDotActive]} />
              <Text style={styles.timerText} testID="call-timer">
                {formatElapsed(elapsedSeconds)}
              </Text>
            </View>

            {/* Attendance Verification Badge */}
            {isVerified ? (
              <View style={styles.verifiedBadge} testID="verified-badge">
                <CheckCircle2 size={13} color="#10B981" />
                <Text style={styles.verifiedText}>✓ Attendance Verified</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge} testID="attendance-pending-badge">
                <Clock size={11} color="#94A3B8" />
                <Text style={styles.pendingText}>15m Verification</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Floating Control Bar */}
      <View style={styles.controlsBar} testID="call-controls-bar">
        {/* Toggle Mute Microphone */}
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnMuted]}
          onPress={toggleMute}
          activeOpacity={0.8}
          testID="toggle-mute-button"
          accessibilityLabel="Toggle Microphone Mute"
        >
          {isMuted ? (
            <MicOff size={22} color="#EF4444" />
          ) : (
            <Mic size={22} color="#F8FAFC" />
          )}
        </TouchableOpacity>

        {/* Flip / Switch Camera */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={switchCamera}
          activeOpacity={0.8}
          testID="switch-camera-button"
          accessibilityLabel="Flip Camera"
        >
          <RefreshCw size={20} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Toggle Camera Video */}
        <TouchableOpacity
          style={[styles.controlBtn, isCameraOff && styles.controlBtnCameraOff]}
          onPress={toggleCamera}
          activeOpacity={0.8}
          testID="toggle-camera-button"
          accessibilityLabel="Toggle Camera Video"
        >
          {isCameraOff ? (
            <VideoOff size={22} color="#EF4444" />
          ) : (
            <Video size={22} color="#F8FAFC" />
          )}
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.controlBtn, styles.endCallBtn]}
          onPress={handleEndCall}
          activeOpacity={0.8}
          testID="end-call-button"
          accessibilityLabel="End Call"
        >
          <PhoneOff size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617", // bg-slate-950
    position: "relative",
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
  },
  remotePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  pulseAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  waitingTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  waitingSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  pipContainer: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 112, // w-28
    height: 160, // h-40
    borderRadius: 16, // rounded-xl
    borderWidth: 2,
    borderColor: "#6366F1", // border-indigo-500
    backgroundColor: "#0F172A",
    overflow: "hidden",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pipVideo: {
    width: "100%",
    height: "100%",
  },
  cameraOffPiP: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  cameraOffText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 6,
  },
  headerOverlay: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 140, // leaves room for PiP
    zIndex: 10,
  },
  headerInfo: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.6)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  roomTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(2, 6, 23, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
  },
  timerDotActive: {
    backgroundColor: "#10B981",
  },
  timerText: {
    color: "#F1F5F9",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    borderColor: "rgba(148, 163, 184, 0.2)",
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
  },
  controlsBar: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnMuted: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
  },
  controlBtnCameraOff: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
  },
  endCallBtn: {
    backgroundColor: "#DC2626", // red-600
    borderColor: "#EF4444",
  },
});
