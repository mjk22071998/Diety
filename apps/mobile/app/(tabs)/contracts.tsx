import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ShieldCheck, CheckCircle2, Clock, Lock } from "lucide-react-native";

interface Milestone {
  id: string;
  title: string;
  status: "COMPLETED" | "IN_PROGRESS" | "LOCKED";
  amount: string;
}

interface EscrowContract {
  id: string;
  code: string;
  title: string;
  clientName: string;
  totalAmount: string;
  status: "ACTIVE" | "CLEARING" | "COMPLETED";
  escrowStatus: string;
  milestones: Milestone[];
}

const mockContracts: EscrowContract[] = [
  {
    id: "ctr-001",
    code: "CTR-8821",
    title: "Targeted Gastrointestinal & FODMAP Therapy",
    clientName: "Sophia Taylor",
    totalAmount: "$450.00",
    status: "ACTIVE",
    escrowStatus: "Secured in Dual-Signature Escrow",
    milestones: [
      { id: "m1", title: "Clinical Assessment & Baseline Diary Audit", status: "COMPLETED", amount: "$150.00" },
      { id: "m2", title: "Elimination Protocol & Weekly Adjustments", status: "IN_PROGRESS", amount: "$150.00" },
      { id: "m3", title: "Reintroduction Phase & Long-Term Regimen", status: "LOCKED", amount: "$150.00" },
    ],
  },
  {
    id: "ctr-002",
    code: "CTR-7904",
    title: "Sports Nutrition & Peak Glycogen Protocol",
    clientName: "David Vance",
    totalAmount: "$600.00",
    status: "CLEARING",
    escrowStatus: "48h Client Review & Verification Window",
    milestones: [
      { id: "m4", title: "Aerobic Threshold & Macro Split", status: "COMPLETED", amount: "$300.00" },
      { id: "m5", title: "Race Simulation Fueling Audit", status: "COMPLETED", amount: "$300.00" },
    ],
  },
  {
    id: "ctr-003",
    code: "CTR-6210",
    title: "Hypertension Dietary Sodium Intervention",
    clientName: "Elena Rostova",
    totalAmount: "$300.00",
    status: "COMPLETED",
    escrowStatus: "Escrow Disbursed & Verified",
    milestones: [
      { id: "m6", title: "DASH Protocol Customization", status: "COMPLETED", amount: "$150.00" },
      { id: "m7", title: "Electrolyte Balance & 30-Day Check", status: "COMPLETED", amount: "$150.00" },
    ],
  },
];

export default function ContractsScreen() {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "CLEARING" | "COMPLETED">("ALL");

  const filteredContracts = mockContracts.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} testID="contracts-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Escrow-Backed Engagements</Text>
        <Text style={styles.headerTitle}>Contracts & Milestones</Text>
      </View>

      {/* Escrow Vault Summary Card */}
      <View style={styles.vaultCard}>
        <View style={styles.vaultRow}>
          <View>
            <Text style={styles.vaultLabel}>Total Value Under Contract</Text>
            <Text style={styles.vaultValue}>$1,350.00</Text>
          </View>
          <View style={styles.vaultBadge}>
            <ShieldCheck size={18} color="#10B981" />
            <Text style={styles.vaultBadgeText}>Smart Escrow</Text>
          </View>
        </View>
        <Text style={styles.vaultSub}>Milestones auto-release upon mutual attendance & approval verification.</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["ALL", "ACTIVE", "CLEARING", "COMPLETED"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            testID={`filter-chip-${tab}`}
            onPress={() => setFilter(tab)}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contracts List */}
      {filteredContracts.map((contract) => (
        <View key={contract.id} style={styles.contractCard} testID={`contract-card-${contract.id}`}>
          <View style={styles.contractHeader}>
            <View>
              <Text style={styles.contractCode}>{contract.code}</Text>
              <Text style={styles.contractTitle}>{contract.title}</Text>
              <Text style={styles.contractClient}>Client: {contract.clientName}</Text>
            </View>
            <View style={styles.contractPriceBlock}>
              <Text style={styles.contractAmount}>{contract.totalAmount}</Text>
              <View
                style={[
                  styles.statusTag,
                  contract.status === "ACTIVE"
                    ? styles.statusActive
                    : contract.status === "CLEARING"
                      ? styles.statusClearing
                      : styles.statusCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    contract.status === "ACTIVE"
                      ? styles.textActive
                      : contract.status === "CLEARING"
                        ? styles.textClearing
                        : styles.textCompleted,
                  ]}
                >
                  {contract.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.escrowNoticeRow}>
            <Lock size={13} color="#818CF8" />
            <Text style={styles.escrowNoticeText}>{contract.escrowStatus}</Text>
          </View>

          {/* Milestones Stepper */}
          <View style={styles.milestonesList}>
            {contract.milestones.map((m) => (
              <View key={m.id} style={styles.milestoneItem}>
                <View style={styles.milestoneIconWrap}>
                  {m.status === "COMPLETED" ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : m.status === "IN_PROGRESS" ? (
                    <Clock size={16} color="#818CF8" />
                  ) : (
                    <Lock size={16} color="#64748B" />
                  )}
                </View>
                <View style={styles.milestoneTextWrap}>
                  <Text style={[styles.milestoneTitle, m.status === "LOCKED" && styles.textMuted]}>{m.title}</Text>
                  <Text style={styles.milestoneAmount}>{m.amount}</Text>
                </View>
              </View>
            ))}
          </View>
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
  vaultCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  vaultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vaultLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  vaultValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  vaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  vaultBadgeText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  vaultSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  filterText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  contractCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  contractCode: {
    fontSize: 11,
    color: "#818CF8",
    fontWeight: "600",
    marginBottom: 2,
  },
  contractTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 2,
    maxWidth: 200,
  },
  contractClient: {
    fontSize: 12,
    color: "#94A3B8",
  },
  contractPriceBlock: {
    alignItems: "flex-end",
  },
  contractAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: "rgba(79, 70, 229, 0.15)",
  },
  statusClearing: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textActive: {
    color: "#818CF8",
  },
  textClearing: {
    color: "#F59E0B",
  },
  textCompleted: {
    color: "#10B981",
  },
  escrowNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  escrowNoticeText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  milestonesList: {
    gap: 8,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  milestoneIconWrap: {
    width: 20,
    alignItems: "center",
  },
  milestoneTextWrap: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneTitle: {
    fontSize: 13,
    color: "#CBD5E1",
    flex: 1,
    marginRight: 8,
  },
  milestoneAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  textMuted: {
    color: "#64748B",
  },
});
