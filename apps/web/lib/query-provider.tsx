"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./query-client";

/**
 * Client-side wrapper that provides the TanStack Query client.
 * Placed in layout.tsx so it wraps the entire app shell.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
