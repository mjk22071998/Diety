import { create } from "zustand";
import { UserRole, VerificationStatus, PractitionerType } from "@diety/types";
import { getAuthToken, saveAuthToken, removeAuthToken } from "./secure-store";

export interface MobileUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  practitionerType?: PractitionerType;
  biometricsEnabled: boolean;
}

export interface AuthState {
  user: MobileUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: MobileUser, token: string) => Promise<void>;
  updateBiometrics: (enabled: boolean) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const initialMockUser: MobileUser = {
  id: "usr_mock_001",
  email: "alex.rivera@diety.health",
  fullName: "Alex Rivera, RD",
  role: UserRole.DIETITIAN,
  verificationStatus: VerificationStatus.APPROVED,
  practitionerType: PractitionerType.LICENSED_DIETITIAN,
  biometricsEnabled: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: initialMockUser,
  token: "mock-jwt-token-active",
  isLoading: false,
  isAuthenticated: true,
  setAuth: async (user, token) => {
    await saveAuthToken(token);
    set({ user, token, isAuthenticated: true });
  },
  updateBiometrics: (enabled) => {
    set((state) => (state.user ? { user: { ...state.user, biometricsEnabled: enabled } } : state));
  },
  logout: async () => {
    await removeAuthToken();
    set({ user: null, token: null, isAuthenticated: false });
  },
  hydrate: async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        set({ token, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
