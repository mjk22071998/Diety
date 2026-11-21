import { QueryClient } from "@tanstack/react-query";

/**
 * Create a TanStack Query client with sensible defaults for the Diety
 * healthcare platform:
 * - 60s stale time — clinical data should not over-refetch
 * - 3 retries for transient network failures
 * - No window focus refetch (reduces noise in clinician workflows)
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Singleton getter — always returns the same client on the browser,
 * always creates a fresh one on the server (per request).
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  // Browser: reuse the same client across renders
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
