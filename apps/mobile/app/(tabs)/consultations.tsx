import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Video, ShieldCheck, ArrowRight } from "lucide-react-native";

interface ScheduledConsultation {
  id: string;
  roomId: string;
  clientName: string;
  date: string;
  time: string;
  topic: string;
  isVerified: boolean;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
}

const mockConsultations: ScheduledConsultation[] = [
  {
    id: "c1",
    roomId: "room-session-402",
    clientName: "Marcus Chen",
    date: "Today",
    time: "4:00 PM EST (45m)",
    topic: "Metabolic & Gut Health Protocol Review",
    isVerified: true,
    status: "UPCOMING",
  },
  {
    id: "c2",
    roomId: "room-session-509",
    clientName: "Sophia Taylor",
    date: "Tomorrow",
    time: "11:00 AM EST (30m)",
    topic: "FODMAP Reintroduction Check-in",
    isVerified: true,
    status: "UPCOMING",
  },
];

export default function ConsultationsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} testID="consultations-screen">
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Encrypted Clinical Telehealth</Text>
        <Text style={styles.headerTitle}>Video Consultations</Text>
      </View>

      <View style={styles.complianceCard}>
        <ShieldCheck size={18} color="#10B981" />
        <View style={styles.complianceTextWrap}>
          <Text style={styles.complianceTitle}>Mutual 15-Minute Attendance Verification</Text>
          <Text style={styles.complianceSub}>
            WebRTC sessions require 15 minutes of mutual peer connection before escrow milestone clearance.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scheduled Telehealth Sessions</Text>
      </View>

      {mockConsultations.map((item) => (
        <View key={item.id} style={styles.sessionCard}>
          <View style={styles.sessionTop}>
            <View style={styles.tagWrap}>
              <Video size={14} color="#818CF8" />
              <Text style={styles.tagText}>{item.time}</Text>
            </View>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>

          <Text style={styles.topicText}>{item.topic}</Text>
          <Text style={styles.clientText}>Participant: {item.clientName}</Text>

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => router.push(`/consultation/${item.roomId}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.joinBtnText}>Enter WebRTC Consultation</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  complianceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  complianceTextWrap: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 2,
  },
  complianceSub: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  sessionCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sessionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: "#818CF8",
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  topicText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  clientText: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 14,
  },
  joinBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
