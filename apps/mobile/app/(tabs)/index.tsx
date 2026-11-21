import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Video, ShieldCheck, Activity, Award, ArrowUpRight } from "lucide-react-native";
import { useAuthStore } from "../../lib/auth-store";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const greetingName = user?.fullName || "Alex Rivera, RD";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} testID="dashboard-screen">
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeSubtitle}>Clinical Workspace</Text>
          <Text style={styles.welcomeTitle} testID="user-greeting">
            {`Hello, ${greetingName}`}
          </Text>
        </View>
        <View style={styles.statusBadge} testID="active-status">
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.statusText}>Verified Practitioner</Text>
        </View>
      </View>

      {/* Primary KPI Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Active Contracts</Text>
            <Award size={16} color="#818CF8" />
          </View>
          <Text style={styles.metricValue}>3</Text>
          <Text style={styles.metricSub}>Secured in Escrow</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Plan Adherence</Text>
            <Activity size={16} color="#10B981" />
          </View>
          <Text style={styles.metricValue}>94.2%</Text>
          <Text style={styles.metricSub}>Target &gt; 90%</Text>
        </View>
      </View>

      {/* Upcoming Consultation Banner */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Next Scheduled Consultation</Text>
      </View>

      <View style={styles.consultationCard}>
        <View style={styles.consultationTop}>
          <View style={styles.videoBadge}>
            <Video size={16} color="#4F46E5" />
            <Text style={styles.videoBadgeText}>HD WebRTC Room</Text>
          </View>
          <Text style={styles.consultationTime}>Today at 4:00 PM</Text>
        </View>

        <Text style={styles.consultationTopic}>Metabolic & Gut Health Protocol Review</Text>
        <Text style={styles.consultationParticipant}>Client: Marcus Chen (Week 4 Review)</Text>

        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => router.push("/consultation/room-session-402")}
          activeOpacity={0.8}
          testID="join-consultation-btn"
        >
          <Text style={styles.joinButtonText}>Join Consultation</Text>
          <ArrowUpRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Escrow Milestone Snapshot */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Escrow Contracts Overview</Text>
      </View>

      <View style={styles.contractCard}>
        <View style={styles.contractRow}>
          <Text style={styles.contractTitle}>Personalized Keto & FODMAP Plan</Text>
          <Text style={styles.contractAmount}>$450.00</Text>
        </View>
        <Text style={styles.contractClient}>Client: Sophia Taylor</Text>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: "66%" }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>Milestone 2 of 3 Completed</Text>
          <Text style={styles.escrowLockedText}>$150.00 in Escrow</Text>
        </View>
      </View>

      {/* Clinical Dietary Metrics */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dietary & Biomarker Tracking</Text>
      </View>

      <View style={styles.dietMetricsCard}>
        <View style={styles.dietRow}>
          <Text style={styles.dietLabel}>Daily Caloric Target Avg</Text>
          <Text style={styles.dietValue}>1,850 kcal</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dietRow}>
          <Text style={styles.dietLabel}>Macronutrient Ratio (P/C/F)</Text>
          <Text style={styles.dietValue}>30% / 40% / 30%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dietRow}>
          <Text style={styles.dietLabel}>Hydration Compliance</Text>
          <Text style={styles.dietValue}>2.8 L / 3.0 L</Text>
        </View>
      </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  statusText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    color: "#64748B",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  consultationCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  consultationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  videoBadgeText: {
    color: "#818CF8",
    fontSize: 12,
    fontWeight: "600",
  },
  consultationTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  consultationTopic: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  consultationParticipant: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 16,
  },
  joinButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  contractCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  contractRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
    flex: 1,
    marginRight: 8,
  },
  contractAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  contractClient: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  escrowLockedText: {
    fontSize: 11,
    color: "#818CF8",
    fontWeight: "500",
  },
  dietMetricsCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  dietRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  dietLabel: {
    fontSize: 13,
    color: "#94A3B8",
  },
  dietValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 4,
  },
});
