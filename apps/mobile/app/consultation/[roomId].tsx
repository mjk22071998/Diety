import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react-native";
import { useAuthStore } from "../../lib/auth-store";
import { ConsultationCall } from "../../components/ConsultationCall";
import { useNativeWebRTC } from "../../hooks/useNativeWebRTC";

export default function ConsultationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId: string; participantId?: string }>();
  const roomId = params.roomId || "consultation-room";
  const user = useAuthStore((s) => s.user);
  const participantId = params.participantId || user?.id || "client-participant";

  const webRTC = useNativeWebRTC({
    roomId,
    participantId,
  });

  // Handle media permissions denied or connection error fallback
  if (webRTC.error) {
    return (
      <View style={styles.errorContainer} testID="permissions-fallback">
        <View style={styles.iconCircle}>
          <AlertCircle size={36} color="#EF4444" />
        </View>

        <Text style={styles.errorTitle}>Camera or Microphone Access Required</Text>
        <Text style={styles.errorMessage} testID="error-message">
          {webRTC.error}
        </Text>
        <Text style={styles.errorHelp}>
          Diety clinical consultations require access to your device camera and microphone for secure, encrypted telehealth. Please check your app permissions in system settings.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
            testID="permission-fallback-back"
          >
            <ArrowLeft size={16} color="#CBD5E1" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              webRTC.endCall();
              router.replace(`/consultation/${roomId}`);
            }}
            activeOpacity={0.8}
            testID="permission-fallback-retry"
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ConsultationCall
      roomId={roomId}
      participantId={participantId}
      roomTitle={`Clinical Consultation: ${roomId}`}
      webRTCState={webRTC}
      onEndCall={() => {
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: "#F87171",
    textAlign: "center",
    marginBottom: 12,
  },
  errorHelp: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  backButtonText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  retryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
