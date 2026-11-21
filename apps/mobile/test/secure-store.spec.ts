import { describe, it, expect, beforeEach, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  setItemAsync: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  getItemAsync: vi.fn(async (key: string) => {
    return store.get(key) || null;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

import {
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  saveRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  clearAllTokens,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SECURE_STORE_OPTIONS,
} from "../lib/secure-store";
import * as SecureStore from "expo-secure-store";

describe("SecureStore Module", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it("saves and retrieves JWT auth tokens with hardware-enclave options", async () => {
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-jwt";
    await saveAuthToken(testToken);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      AUTH_TOKEN_KEY,
      testToken,
      SECURE_STORE_OPTIONS
    );

    const retrieved = await getAuthToken();
    expect(retrieved).toBe(testToken);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      AUTH_TOKEN_KEY,
      SECURE_STORE_OPTIONS
    );
  });

  it("removes JWT auth tokens", async () => {
    await saveAuthToken("sample-token");
    expect(await getAuthToken()).toBe("sample-token");

    await removeAuthToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      AUTH_TOKEN_KEY,
      SECURE_STORE_OPTIONS
    );
    expect(await getAuthToken()).toBeNull();
  });

  it("saves and retrieves refresh tokens", async () => {
    const refreshToken = "refresh-sample-token-12345";
    await saveRefreshToken(refreshToken);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      REFRESH_TOKEN_KEY,
      refreshToken,
      SECURE_STORE_OPTIONS
    );

    const retrieved = await getRefreshToken();
    expect(retrieved).toBe(refreshToken);

    await removeRefreshToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      REFRESH_TOKEN_KEY,
      SECURE_STORE_OPTIONS
    );
    expect(await getRefreshToken()).toBeNull();
  });

  it("clears all tokens at once upon session termination", async () => {
    await saveAuthToken("access-token-abc");
    await saveRefreshToken("refresh-token-xyz");

    expect(await getAuthToken()).toBe("access-token-abc");
    expect(await getRefreshToken()).toBe("refresh-token-xyz");

    await clearAllTokens();

    expect(await getAuthToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});
