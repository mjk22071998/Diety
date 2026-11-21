import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { ShieldCheck, Fingerprint, Lock, LogOut, CheckCircle2, AlertCircle } from "lucide-react-native";
import { useAuthStore } from "../../lib/auth-store";
import { useBiometrics, BiometricAvailability } from "../../hooks/useBiometrics";

export default function ProfileScreen() {
  const { user, updateBiometrics, logout } = useAuthStore();
  const { checkBiometricsAvailable, authenticate, isAuthenticating } = useBiometrics();

  const [biometricInfo, setBiometricInfo] = useState<BiometricAvailability | null>(null);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricsAvailable().then((info) => {
      setBiometricInfo(info);
    });
  }, [checkBiometricsAvailable]);

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      const res = await authenticate("Verify your biometric identity to enable biometric unlock");
      if (res.success) {
        updateBiometrics(true);
        setAuthStatusMessage("Biometric unlock enabled successfully");
      } else {
        setAuthStatusMessage(res.error || "Biometric verification failed");
      }
    } else {
      updateBiometrics(false);
      setAuthStatusMessage("Biometric unlock disabled");
    }
  };

  const handleTestBiometrics = async () => {
    setAuthStatusMessage(null);
    const res = await authenticate("Authenticate with Face ID / Biometrics");
    if (res.success) {
      setAuthStatusMessage("Biometric authentication successful!");
    } else {
      setAuthStatusMessage(`Authentication failed: ${res.error || "Unknown error"}`);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} testID="profile-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Practitioner Profile</Text>
        <Text style={styles.headerTitle}>Credentials & Security</Text>
      </View>

      {/* Practitioner Credentials Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AR</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.nameText}>{user?.fullName || "Alex Rivera, RD"}</Text>
            <Text style={styles.roleText}>Licensed Clinical Dietitian</Text>
            <Text style={styles.emailText}>{user?.email || "alex.rivera@diety.health"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.badgeRow}>
          <View style={styles.credBadge} testID="practitioner-credentials-badge">
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.credBadgeText}>CDR Board Certified (#860124)</Text>
          </View>
          <View style={styles.credBadge}>
            <CheckCircle2 size={16} color="#818CF8" />
            <Text style={styles.credBadgeIndigoText}>State License Active</Text>
          </View>
        </View>

        <View style={styles.specsWrap}>
          <Text style={styles.specsLabel}>Clinical Specializations:</Text>
          <Text style={styles.specsValue}>Renal Nutrition · Metabolic GI Health · FODMAP · Sports Fueling</Text>
        </View>
      </View>

      {/* Biometrics & Hardware Enclave Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Biometric Security (Expo SecureStore)</Text>
      </View>

      <View style={styles.securityCard}>
        <View style={styles.securityRow}>
          <View style={styles.securityLeft}>
            <Fingerprint size={22} color="#818CF8" />
            <View>
              <Text style={styles.securityTitle}>Biometric Authentication</Text>
              <Text style={styles.securitySub}>
                {biometricInfo?.hasHardware
                  ? biometricInfo.isEnrolled
                    ? "Face ID / Fingerprint enrolled & ready"
                    : "Hardware detected, no biometrics enrolled"
                  : "Biometric hardware not available"}
              </Text>
            </View>
          </View>
          <Switch
            testID="biometric-switch"
            value={!!user?.biometricsEnabled}
            onValueChange={handleToggleBiometrics}
            trackColor={{ false: "#334155", true: "#4F46E5" }}
            thumbColor={user?.biometricsEnabled ? "#818CF8" : "#94A3B8"}
          />
        </View>

        {authStatusMessage && (
          <View style={styles.statusBanner}>
            <AlertCircle size={14} color="#818CF8" />
            <Text style={styles.statusBannerText}>{authStatusMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestBiometrics}
          disabled={isAuthenticating}
          activeOpacity={0.7}
          testID="test-biometric-btn"
        >
          <Fingerprint size={16} color="#FFFFFF" />
          <Text style={styles.testBtnText}>
            {isAuthenticating ? "Authenticating..." : "Test Biometric Prompt"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Key Storage & Vault Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Lock size={16} color="#94A3B8" />
          <Text style={styles.infoTitle}>Keychain Access Control</Text>
        </View>
        <Text style={styles.infoBody}>
          Auth tokens are stored using Expo SecureStore with{" "}
          <Text style={styles.infoHighlight}>WHEN_UNLOCKED_THIS_DEVICE_ONLY</Text> accessibility, backed by the device's
          Secure Enclave / Keymaster.
        </Text>
      </View>

      {/* Logout Action */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
        testID="logout-btn"
      >
        <LogOut size={16} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out from Diety</Text>
      </TouchableOpacity>
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
  profileCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  avatarInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 2,
  },
  roleText: {
    fontSize: 13,
    color: "#818CF8",
    fontWeight: "500",
    marginBottom: 2,
  },
  emailText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 14,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  credBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  credBadgeText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },
  credBadgeIndigoText: {
    color: "#818CF8",
    fontSize: 11,
    fontWeight: "600",
  },
  specsWrap: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 10,
    borderRadius: 8,
  },
  specsLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  specsValue: {
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  securityCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  securityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  securityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 2,
  },
  securitySub: {
    fontSize: 11,
    color: "#94A3B8",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  statusBannerText: {
    fontSize: 12,
    color: "#818CF8",
    flex: 1,
  },
  testBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 14,
    gap: 6,
  },
  testBtnText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  infoBody: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 18,
  },
  infoHighlight: {
    color: "#818CF8",
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
});
