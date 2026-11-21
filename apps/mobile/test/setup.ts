import React from "react";
import { vi } from "vitest";

// React Native / Expo globals
(globalThis as any).__DEV__ = true;

// Polyfill globalThis.expo for expo-modules-core
if (!(globalThis as any).expo) {
  (globalThis as any).expo = {
    EventEmitter: class {
      addListener() {
        return { remove: () => {} };
      }
      removeListener() {}
      emit() {}
    },
    modules: {},
    ExpoModulesCore: {},
  };
}

// Mock expo-router
vi.mock("expo-router", () => {
  const pushMock = vi.fn();
  const replaceMock = vi.fn();
  const backMock = vi.fn();

  return {
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      back: backMock,
    }),
    useLocalSearchParams: () => ({}),
    Stack: Object.assign(({ children }: any) => children, { Screen: () => null }),
    Tabs: Object.assign(({ children }: any) => children, { Screen: () => null }),
    Link: ({ children }: any) => children,
  };
});

// Mock expo-status-bar
vi.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

// Mock expo-secure-store
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  setItemAsync: vi.fn(async () => {}),
  getItemAsync: vi.fn(async () => null),
  deleteItemAsync: vi.fn(async () => {}),
}));

// Mock expo-local-authentication
vi.mock("expo-local-authentication", () => ({
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  hasHardwareAsync: vi.fn(async () => true),
  isEnrolledAsync: vi.fn(async () => true),
  supportedAuthenticationTypesAsync: vi.fn(async () => [2]),
  authenticateAsync: vi.fn(async () => ({ success: true })),
}));

// Mock lucide-react-native
vi.mock("lucide-react-native", () => {
  const IconMock = React.forwardRef<any, any>((props: any, ref) =>
    React.createElement("span", { ref, "data-testid": "icon", ...props })
  );
  return {
    __esModule: true,
    default: IconMock,
    Home: IconMock,
    Calendar: IconMock,
    FileText: IconMock,
    User: IconMock,
    Video: IconMock,
    ShieldCheck: IconMock,
    Activity: IconMock,
    Award: IconMock,
    ArrowUpRight: IconMock,
    CheckCircle2: IconMock,
    Clock: IconMock,
    Lock: IconMock,
    Fingerprint: IconMock,
    LogOut: IconMock,
    AlertCircle: IconMock,
    ArrowRight: IconMock,
  };
});
