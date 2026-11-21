import { useState, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricAvailability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export async function checkBiometricsAvailable(): Promise<BiometricAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const supportedTypes = types.map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return "FACIAL_RECOGNITION";
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return "FINGERPRINT";
        case LocalAuthentication.AuthenticationType.IRIS:
          return "IRIS";
        default:
          return "UNKNOWN";
      }
    });

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (err: unknown) {
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
}

export async function authenticate(
  promptMessage: string = "Authenticate to access Diety"
): Promise<BiometricAuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || "Authentication failed",
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown biometric error",
    };
  }
}

export function useBiometrics() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleCheckAvailable = useCallback(async (): Promise<BiometricAvailability> => {
    return await checkBiometricsAvailable();
  }, []);

  const handleAuthenticate = useCallback(
    async (promptMessage?: string): Promise<BiometricAuthResult> => {
      setIsAuthenticating(true);
      try {
        return await authenticate(promptMessage);
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  return {
    checkBiometricsAvailable: handleCheckAvailable,
    authenticate: handleAuthenticate,
    isAuthenticating,
  };
}
