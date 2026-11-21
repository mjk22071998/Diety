import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { mockLocalAuth } = vi.hoisted(() => {
  return {
    mockLocalAuth: {
      AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
      },
      hasHardwareAsync: vi.fn(),
      isEnrolledAsync: vi.fn(),
      supportedAuthenticationTypesAsync: vi.fn(),
      authenticateAsync: vi.fn(),
    },
  };
});

vi.mock("expo-local-authentication", () => mockLocalAuth);

import {
  checkBiometricsAvailable,
  authenticate,
  useBiometrics,
} from "../hooks/useBiometrics";

describe("Biometrics Module & Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkBiometricsAvailable", () => {
    it("detects hardware availability, enrollment, and maps supported types", async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValueOnce([
        mockLocalAuth.AuthenticationType.FACIAL_RECOGNITION,
        mockLocalAuth.AuthenticationType.FINGERPRINT,
      ]);

      const result = await checkBiometricsAvailable();

      expect(result).toEqual({
        hasHardware: true,
        isEnrolled: true,
        supportedTypes: ["FACIAL_RECOGNITION", "FINGERPRINT"],
      });
      expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalled();
      expect(mockLocalAuth.isEnrolledAsync).toHaveBeenCalled();
      expect(mockLocalAuth.supportedAuthenticationTypesAsync).toHaveBeenCalled();
    });

    it("handles devices without biometric hardware gracefully", async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(false);
      mockLocalAuth.isEnrolledAsync.mockResolvedValueOnce(false);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValueOnce([]);

      const result = await checkBiometricsAvailable();

      expect(result).toEqual({
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      });
    });

    it("handles errors thrown by native hardware checks gracefully", async () => {
      mockLocalAuth.hasHardwareAsync.mockRejectedValueOnce(new Error("Hardware query failed"));

      const result = await checkBiometricsAvailable();

      expect(result).toEqual({
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      });
    });
  });

  describe("authenticate", () => {
    it("successfully authenticates with Face ID / biometrics", async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValueOnce({
        success: true,
      });

      const result = await authenticate("Verify Identity for Diety");

      expect(result).toEqual({ success: true });
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: "Verify Identity for Diety",
        })
      );
    });

    it("handles biometric authentication cancellation or failure", async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValueOnce({
        success: false,
        error: "user_cancel",
      });

      const result = await authenticate();

      expect(result).toEqual({
        success: false,
        error: "user_cancel",
      });
    });

    it("catches and returns exceptions as errors", async () => {
      mockLocalAuth.authenticateAsync.mockRejectedValueOnce(new Error("Biometric sensor timeout"));

      const result = await authenticate();

      expect(result).toEqual({
        success: false,
        error: "Biometric sensor timeout",
      });
    });
  });

  describe("useBiometrics hook", () => {
    it("provides functional checkBiometricsAvailable and authenticate callbacks", async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValueOnce([
        mockLocalAuth.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      mockLocalAuth.authenticateAsync.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useBiometrics());

      let avail: any;
      await act(async () => {
        avail = await result.current.checkBiometricsAvailable();
      });
      expect(avail.hasHardware).toBe(true);
      expect(avail.supportedTypes).toEqual(["FACIAL_RECOGNITION"]);

      let authRes: any;
      await act(async () => {
        authRes = await result.current.authenticate("Test prompt");
      });
      expect(authRes.success).toBe(true);
    });
  });
});
